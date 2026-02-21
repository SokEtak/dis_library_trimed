<?php

namespace App\Http\Controllers;

use App\Events\BookLoanRequestCreated;
use App\Events\BookLoanRequestUpdated;
use App\Models\Book;
use App\Models\BookLoan;
use App\Models\BookLoanRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        if ($book->type !== 'physical' || (bool) $book->is_deleted) {
            throw ValidationException::withMessages([
                'book' => 'Only active physical books can be requested.',
            ]);
        }

        if (! $book->is_available) {
            throw ValidationException::withMessages([
                'book' => 'This book is not currently available.',
            ]);
        }

        $hasPendingRequest = BookLoanRequest::query()
            ->where('book_id', $book->id)
            ->where('requester_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPendingRequest) {
            throw ValidationException::withMessages([
                'book' => 'You already have a pending request for this book.',
            ]);
        }

        $loanRequest = BookLoanRequest::create([
            'book_id' => $book->id,
            'requester_id' => $user->id,
            'campus_id' => $user->campus_id ?? $book->campus_id,
            'status' => 'pending',
        ])->load(['book:id,title', 'requester:id,name']);

        broadcast(new BookLoanRequestCreated($loanRequest));

        return response()->json([
            // 'message' => 'Loan request sent to the library admin.',
            'message' => 'សំណើរ​​ត្រូវ​បាន​ផ្ញើរ',
            'loanRequest' => $this->loanRequestPayload($loanRequest),
        ], 201);
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

                $book->update(['is_available' => false]);
            }
        });

        $loanRequest->refresh()->load(['book:id,title', 'requester:id,name', 'approver:id,name']);
        $createdBookLoan?->load(['book:id,title', 'user:id,name']);

        broadcast(new BookLoanRequestUpdated($loanRequest));

        return response()->json([
            'message' => $decision === 'approved'
                ? 'សំណើរ​សុំ​ការខ្ចី​សៀវភៅ​ត្រូវ​បាន​អនុម័ត'
                : 'សំណើរ​ស្នើរសុំខ្ចី​សៀវភៅ​ត្រូវ​បាន​បដិសេធ',
            'loanRequest' => $this->loanRequestPayload($loanRequest),
            'bookLoan' => $createdBookLoan ? $this->bookLoanPayload($createdBookLoan) : null,
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

        return response()->json([
            'message' => 'Loan request canceled.',
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
        return [
            'id' => $bookLoan->id,
            'return_date' => $bookLoan->return_date,
            'returned_at' => $bookLoan->returned_at,
            'book_id' => $bookLoan->book_id,
            'user_id' => $bookLoan->user_id,
            'created_at' => optional($bookLoan->created_at)->toIso8601String(),
            'updated_at' => optional($bookLoan->updated_at)->toIso8601String(),
            'status' => $bookLoan->status,
            'book' => $bookLoan->book ? [
                'id' => $bookLoan->book->id,
                'title' => $bookLoan->book->title,
            ] : null,
            'user' => $bookLoan->user ? [
                'id' => $bookLoan->user->id,
                'name' => $bookLoan->user->name,
            ] : null,
        ];
    }
}

