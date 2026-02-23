<?php

namespace App\Http\Controllers;

use App\Events\BookLoanRequestCreated;
use App\Events\BookLoanRequestUpdated;
use App\Events\DashboardSummaryUpdated;
use App\Models\Book;
use App\Models\BookLoan;
use App\Models\BookLoanRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookLoanRequestController extends Controller
{
    public function store(Request $request, Book $book): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('regular-user')) {
            abort(403, 'Only regular users can request to borrow books.');
        }

        [$loanRequest, $wasCreated] = DB::transaction(function () use ($book, $user): array {
            $lockedBook = Book::query()
                ->whereKey($book->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedBook || $lockedBook->type !== 'physical' || (bool) $lockedBook->is_deleted) {
                throw ValidationException::withMessages([
                    'book' => 'Only active physical books can be requested.',
                ]);
            }

            // Idempotent behavior: never create more than one pending request per user/book.
            $existingPendingRequest = BookLoanRequest::query()
                ->where('book_id', $lockedBook->id)
                ->where('requester_id', $user->id)
                ->where('status', 'pending')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if ($existingPendingRequest) {
                return [$existingPendingRequest->load(['book:id,title', 'requester:id,name']), false];
            }

            if (! $lockedBook->is_available) {
                throw ValidationException::withMessages([
                    'book' => 'This book is not currently available.',
                ]);
            }

            try {
                $newLoanRequest = BookLoanRequest::create([
                    'book_id' => $lockedBook->id,
                    'requester_id' => $user->id,
                    'campus_id' => $user->campus_id ?? $lockedBook->campus_id,
                    'status' => 'pending',
                ])->load(['book:id,title', 'requester:id,name']);

                return [$newLoanRequest, true];
            } catch (QueryException $exception) {
                // If a unique pending constraint is hit by concurrent requests,
                // return the existing pending row instead of surfacing an error.
                $concurrentPendingRequest = BookLoanRequest::query()
                    ->where('book_id', $lockedBook->id)
                    ->where('requester_id', $user->id)
                    ->where('status', 'pending')
                    ->latest('id')
                    ->first();

                if ($concurrentPendingRequest) {
                    return [$concurrentPendingRequest->load(['book:id,title', 'requester:id,name']), false];
                }

                throw $exception;
            }
        });

        if ($wasCreated) {
            broadcast(new BookLoanRequestCreated($loanRequest));
            broadcast(new DashboardSummaryUpdated('book-loan-request.store'));
        }

        return response()->json([
            'message' => 'សំណើរបានផ្ញើរដោយជោគជ័យ',
            'loanRequest' => $this->loanRequestPayload($loanRequest),
            'already_pending' => ! $wasCreated,
        ], $wasCreated ? 201 : 200);
    }

    public function decide(Request $request, BookLoanRequest $loanRequest): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole(['admin', 'staff'])) {
            abort(403, 'Only staff/admin can approve or reject requests.');
        }

        $validated = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
        ]);

        $decision = $validated['decision'];
        $createdBookLoan = null;

        DB::transaction(function () use ($loanRequest, $user, $decision, &$createdBookLoan): void {
            $lockedRequest = BookLoanRequest::query()
                ->whereKey($loanRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedRequest->status !== 'pending') {
                throw ValidationException::withMessages([
                    'request' => 'This request has already been processed.',
                ]);
            }

            $book = Book::query()->whereKey($lockedRequest->book_id)->lockForUpdate()->first();

            if (! $book || (bool) $book->is_deleted) {
                throw ValidationException::withMessages([
                    'book' => 'This book is no longer available.',
                ]);
            }

            if ($decision === 'approved' && ! $book->is_available) {
                throw ValidationException::withMessages([
                    'book' => 'This book has already been borrowed.',
                ]);
            }

            $lockedRequest->update([
                'status' => $decision,
                'approver_id' => $user->id,
                'decided_at' => now(),
            ]);

            if ($decision === 'approved') {
                $createdBookLoan = BookLoan::create([
                    'book_id' => $lockedRequest->book_id,
                    'user_id' => $lockedRequest->requester_id,
                    'campus_id' => $lockedRequest->campus_id ?? $book->campus_id,
                    'return_date' => now()->addDays(14)->toDateString(),
                    'status' => 'processing',
                    'is_deleted' => false,
                ]);

                $createdBookLoan->books()->sync([(int) $lockedRequest->book_id]);

                $book->update(['is_available' => false]);
            }
        });

        $loanRequest->refresh()->load(['book:id,title', 'requester:id,name', 'approver:id,name']);
        $createdBookLoan?->load(['books:id,title', 'book:id,title', 'user:id,name']);

        broadcast(new BookLoanRequestUpdated($loanRequest));
        broadcast(new DashboardSummaryUpdated('book-loan-request.decide'));

        return response()->json([
            'message' => $decision === 'approved'
                ? 'សំណើរ​សុំ​ការខ្ចី​សៀវភៅ​ត្រូវ​បាន​អនុម័ត'
                : 'សំណើរ​ស្នើរសុំខ្ចី​សៀវភៅ​ត្រូវ​បាន​បដិសេធ',
            'loanRequest' => $this->loanRequestPayload($loanRequest),
            'bookLoan' => $createdBookLoan ? $this->bookLoanPayload($createdBookLoan) : null,
        ]);
    }

    public function createBatchLoan(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole(['admin', 'staff'])) {
            abort(403, 'Only staff/admin can create loans from requests.');
        }

        $validated = $request->validate([
            'request_ids' => ['required', 'array', 'min:1'],
            'request_ids.*' => ['integer', 'distinct'],
        ]);

        $requestIds = collect($validated['request_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($requestIds === []) {
            throw ValidationException::withMessages([
                'request_ids' => 'Please select at least one pending request.',
            ]);
        }

        $approvedRequests = collect();
        $createdBookLoan = null;

        DB::transaction(function () use ($requestIds, $user, &$approvedRequests, &$createdBookLoan): void {
            $lockedRequests = BookLoanRequest::query()
                ->whereIn('id', $requestIds)
                ->lockForUpdate()
                ->get();

            if ($lockedRequests->count() !== count($requestIds)) {
                throw ValidationException::withMessages([
                    'request_ids' => 'One or more selected requests no longer exist.',
                ]);
            }

            $hasProcessedRequests = $lockedRequests->contains(fn (BookLoanRequest $loanRequest) => $loanRequest->status !== 'pending');

            if ($hasProcessedRequests) {
                throw ValidationException::withMessages([
                    'request_ids' => 'One or more requests have already been processed.',
                ]);
            }

            $requesterIds = $lockedRequests
                ->pluck('requester_id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            if (count($requesterIds) !== 1) {
                throw ValidationException::withMessages([
                    'request_ids' => 'Batch loan creation requires requests from one user only.',
                ]);
            }

            $campusIds = $lockedRequests
                ->pluck('campus_id')
                ->filter(fn ($campusId) => $campusId !== null)
                ->map(fn ($campusId) => (int) $campusId)
                ->unique()
                ->values()
                ->all();

            if (count($campusIds) > 1) {
                throw ValidationException::withMessages([
                    'request_ids' => 'Batch loan creation requires requests from the same campus.',
                ]);
            }

            $bookIds = $lockedRequests
                ->pluck('book_id')
                ->map(fn ($id) => (int) $id)
                ->filter(fn ($id) => $id > 0)
                ->unique()
                ->values()
                ->all();

            if ($bookIds === []) {
                throw ValidationException::withMessages([
                    'book_ids' => 'No valid books were found for the selected requests.',
                ]);
            }

            $lockedBooks = Book::query()
                ->whereIn('id', $bookIds)
                ->lockForUpdate()
                ->get(['id', 'title', 'type', 'is_deleted', 'is_available', 'campus_id']);

            if ($lockedBooks->count() !== count($bookIds)) {
                throw ValidationException::withMessages([
                    'book_ids' => 'One or more requested books no longer exist.',
                ]);
            }

            $invalidBookTitles = $lockedBooks
                ->filter(fn (Book $book) => $book->type !== 'physical' || (bool) $book->is_deleted)
                ->pluck('title')
                ->values()
                ->all();

            if ($invalidBookTitles !== []) {
                throw ValidationException::withMessages([
                    'book_ids' => 'The following books are not eligible for lending: '.implode(', ', $invalidBookTitles).'.',
                ]);
            }

            $processingPivotBookIds = DB::table('book_loan_books as blb')
                ->join('book_loans as bl', 'bl.id', '=', 'blb.book_loan_id')
                ->whereIn('blb.book_id', $bookIds)
                ->where('bl.is_deleted', 0)
                ->where('bl.status', 'processing')
                ->pluck('blb.book_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            $processingLegacyBookIds = BookLoan::query()
                ->whereIn('book_id', $bookIds)
                ->where('is_deleted', false)
                ->where('status', 'processing')
                ->pluck('book_id')
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->all();

            $processingBookIds = collect(array_merge($processingPivotBookIds, $processingLegacyBookIds))
                ->unique()
                ->values()
                ->all();

            if ($processingBookIds !== []) {
                $processingBookTitles = $lockedBooks
                    ->whereIn('id', $processingBookIds)
                    ->pluck('title')
                    ->values()
                    ->all();

                throw ValidationException::withMessages([
                    'book_ids' => 'The following books are already on active loans: '.implode(', ', $processingBookTitles).'.',
                ]);
            }

            $unavailableTitles = $lockedBooks
                ->filter(fn (Book $book) => ! (bool) $book->is_available)
                ->pluck('title')
                ->values()
                ->all();

            if ($unavailableTitles !== []) {
                throw ValidationException::withMessages([
                    'book_ids' => 'The following books are no longer available: '.implode(', ', $unavailableTitles).'.',
                ]);
            }

            $loanCampusId = $campusIds[0] ?? $lockedBooks->first()?->campus_id;

            $createdBookLoan = BookLoan::create([
                'book_id' => $bookIds[0],
                'user_id' => $requesterIds[0],
                'campus_id' => $loanCampusId,
                'return_date' => now()->addDays(14)->toDateString(),
                'status' => 'processing',
                'is_deleted' => false,
            ]);

            $createdBookLoan->books()->sync($bookIds);
            Book::query()->whereIn('id', $bookIds)->update(['is_available' => false]);

            $decidedAt = now();
            BookLoanRequest::query()
                ->whereIn('id', $requestIds)
                ->update([
                    'status' => 'approved',
                    'approver_id' => $user->id,
                    'decided_at' => $decidedAt,
                ]);

            $approvedRequests = BookLoanRequest::query()
                ->with(['book:id,title', 'requester:id,name', 'approver:id,name'])
                ->whereIn('id', $requestIds)
                ->get();
        });

        $createdBookLoan?->load(['books:id,title', 'book:id,title', 'user:id,name']);

        $approvedRequests->each(function (BookLoanRequest $approvedRequest): void {
            broadcast(new BookLoanRequestUpdated($approvedRequest));
        });
        broadcast(new DashboardSummaryUpdated('book-loan-request.batch-create-loan'));

        return response()->json([
            'message' => sprintf('Created one loan with %d requested books.', $approvedRequests->count()),
            'loanRequests' => $approvedRequests
                ->map(fn (BookLoanRequest $approvedRequest) => $this->loanRequestPayload($approvedRequest))
                ->values()
                ->all(),
            'bookLoan' => $createdBookLoan ? $this->bookLoanPayload($createdBookLoan) : null,
        ]);
    }

    public function rejectBatch(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole(['admin', 'staff'])) {
            abort(403, 'Only staff/admin can reject requests.');
        }

        $validated = $request->validate([
            'request_ids' => ['required', 'array', 'min:1'],
            'request_ids.*' => ['integer', 'distinct'],
        ]);

        $requestIds = collect($validated['request_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($requestIds === []) {
            throw ValidationException::withMessages([
                'request_ids' => 'Please select at least one pending request.',
            ]);
        }

        $rejectedRequests = collect();

        DB::transaction(function () use ($requestIds, $user, &$rejectedRequests): void {
            $lockedRequests = BookLoanRequest::query()
                ->whereIn('id', $requestIds)
                ->lockForUpdate()
                ->get();

            if ($lockedRequests->count() !== count($requestIds)) {
                throw ValidationException::withMessages([
                    'request_ids' => 'One or more selected requests no longer exist.',
                ]);
            }

            $hasProcessedRequests = $lockedRequests->contains(fn (BookLoanRequest $loanRequest) => $loanRequest->status !== 'pending');

            if ($hasProcessedRequests) {
                throw ValidationException::withMessages([
                    'request_ids' => 'One or more requests have already been processed.',
                ]);
            }

            $requesterIds = $lockedRequests
                ->pluck('requester_id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            if (count($requesterIds) !== 1) {
                throw ValidationException::withMessages([
                    'request_ids' => 'Batch rejection requires requests from one user only.',
                ]);
            }

            $campusIds = $lockedRequests
                ->pluck('campus_id')
                ->filter(fn ($campusId) => $campusId !== null)
                ->map(fn ($campusId) => (int) $campusId)
                ->unique()
                ->values()
                ->all();

            if (count($campusIds) > 1) {
                throw ValidationException::withMessages([
                    'request_ids' => 'Batch rejection requires requests from the same campus.',
                ]);
            }

            $decidedAt = now();
            BookLoanRequest::query()
                ->whereIn('id', $requestIds)
                ->update([
                    'status' => 'rejected',
                    'approver_id' => $user->id,
                    'decided_at' => $decidedAt,
                ]);

            $rejectedRequests = BookLoanRequest::query()
                ->with(['book:id,title', 'requester:id,name', 'approver:id,name'])
                ->whereIn('id', $requestIds)
                ->get();
        });

        $rejectedRequests->each(function (BookLoanRequest $rejectedRequest): void {
            broadcast(new BookLoanRequestUpdated($rejectedRequest));
        });
        broadcast(new DashboardSummaryUpdated('book-loan-request.batch-reject'));

        return response()->json([
            'message' => sprintf('បដិសេធចំនួន%dសំណើរ.', $rejectedRequests->count()),
            'loanRequests' => $rejectedRequests
                ->map(fn (BookLoanRequest $rejectedRequest) => $this->loanRequestPayload($rejectedRequest))
                ->values()
                ->all(),
        ]);
    }

    public function cancel(Request $request, BookLoanRequest $loanRequest): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('regular-user')) {
            abort(403, 'Only regular users can cancel requests.');
        }

        DB::transaction(function () use ($loanRequest, $user): void {
            $lockedRequest = BookLoanRequest::query()
                ->whereKey($loanRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ((int) $lockedRequest->requester_id !== (int) $user->id) {
                abort(403, 'You can only cancel your own request.');
            }

            if ($lockedRequest->status !== 'pending') {
                throw ValidationException::withMessages([
                    'request' => 'Only pending requests can be canceled.',
                ]);
            }

            // Keep request history, but mark this as a requester-side cancellation.
            $lockedRequest->update([
                'status' => 'rejected',
                'approver_id' => null,
                'decided_at' => now(),
            ]);
        });

        $loanRequest->refresh()->load(['book:id,title', 'requester:id,name', 'approver:id,name']);

        broadcast(new BookLoanRequestUpdated($loanRequest));
        broadcast(new DashboardSummaryUpdated('book-loan-request.cancel'));

        return response()->json([
            'message' => 'សំណើរ​​ត្រូវ​បាន​បោះបង់',
            'loanRequest' => $this->loanRequestPayload($loanRequest),
        ]);
    }

    private function loanRequestPayload(BookLoanRequest $loanRequest): array
    {
        return [
            'id' => $loanRequest->id,
            'book_id' => $loanRequest->book_id,
            'book_title' => $loanRequest->book?->title,
            'requester_id' => $loanRequest->requester_id,
            'requester_name' => $loanRequest->requester?->name,
            'status' => $loanRequest->status,
            'approver_id' => $loanRequest->approver_id,
            'canceled_by_requester' => $loanRequest->status === 'rejected' && ! $loanRequest->approver_id,
            'decided_at' => optional($loanRequest->decided_at)->toIso8601String(),
            'created_at' => optional($loanRequest->created_at)->toIso8601String(),
        ];
    }

    private function bookLoanPayload(BookLoan $bookLoan): array
    {
        $books = $bookLoan->books;

        if ($books->isEmpty() && $bookLoan->book) {
            $books = collect([$bookLoan->book]);
        }

        return [
            'id' => $bookLoan->id,
            'return_date' => $bookLoan->return_date,
            'returned_at' => $bookLoan->returned_at,
            'book_id' => $bookLoan->book_id,
            'book_ids' => $books->pluck('id')->values()->all(),
            'user_id' => $bookLoan->user_id,
            'created_at' => optional($bookLoan->created_at)->toIso8601String(),
            'updated_at' => optional($bookLoan->updated_at)->toIso8601String(),
            'status' => $bookLoan->status,
            'book' => $books->isNotEmpty() ? [
                'id' => $books->first()->id,
                'title' => $books->first()->title,
            ] : null,
            'books' => $books
                ->map(fn ($book) => [
                    'id' => $book->id,
                    'title' => $book->title,
                ])
                ->values()
                ->all(),
            'user' => $bookLoan->user ? [
                'id' => $bookLoan->user->id,
                'name' => $bookLoan->user->name,
            ] : null,
        ];
    }
}


