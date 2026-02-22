<?php

namespace App\Http\Controllers;

use App\Events\DashboardSummaryUpdated;
use App\Http\Requests\BookLoan\BookLoanRequest;
use App\Models\Book;
use App\Models\BookLoan;
use App\Models\BookLoanRequest as BookLoanRequestModel;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BookLoanController extends Controller
{
    /**
     * Display a listing of book loans.
     */
    public function index()
    {
        $query = BookLoan::with(['books:id,title', 'book:id,title', 'user:id,name'])->active($this->userCampusId());

        $status = request('status');
        $overdue = request('overdue');

        if ($status) {
            $query->where('status', $status);
        }

        if ($overdue) {
            $today = now()->timezone('Asia/Phnom_Penh')->toDateString();
            $query->where('return_date', '<', $today)->where('status', 'processing');
        }

        $bookloans = $query
            ->get()
            ->map(fn (BookLoan $bookLoan) => $this->normalizeLoanBooks($bookLoan));

        $loanRequests = BookLoanRequestModel::query()
            ->with(['book:id,title', 'requester:id,name'])
            ->pending()
            ->when($this->userCampusId(), function ($requestQuery, $campusId) {
                $requestQuery->where('campus_id', $campusId);
            })
            ->latest('created_at')
            ->get()
            ->map(function ($loanRequest) {
                return [
                    'id' => $loanRequest->id,
                    'book_id' => $loanRequest->book_id,
                    'book_title' => $loanRequest->book?->title,
                    'requester_id' => $loanRequest->requester_id,
                    'requester_name' => $loanRequest->requester?->name,
                    'status' => $loanRequest->status,
                    'created_at' => optional($loanRequest->created_at)->toIso8601String(),
                ];
            });

        return Inertia::render('BookLoans/Index', [
            'bookloans' => $bookloans,
            'loanRequests' => $loanRequests,
        ]);
    }

    /**
     * Show the form for creating a new book loan.
     */
    public function create()
    {
        return Inertia::render('BookLoans/Create', [
            'books' => $this->getAvailableBooksForSelection(),
            'users' => $this->getLoanableUsers(),
            'statuses' => ['processing', 'returned', 'canceled'],
        ]);
    }

    /**
     * Store a newly created book loan.
     */
    public function store(BookLoanRequest $request): RedirectResponse
    {
        $validated = $request->validatedWithExtras();
        $bookIds = $this->uniqueBookIdsFromPayload($validated);

        if ($bookIds === []) {
            throw ValidationException::withMessages([
                'book_ids' => 'Please select at least one book.',
            ]);
        }

        $attributes = $validated;
        unset($attributes['book_ids']);

        if (($attributes['status'] ?? null) === 'returned' && empty($attributes['returned_at'])) {
            $attributes['returned_at'] = now();
        }

        if (($attributes['status'] ?? null) !== 'returned') {
            $attributes['returned_at'] = null;
        }

        DB::transaction(function () use ($attributes, $bookIds): void {
            $this->lockBooks($bookIds);
            $this->assertValidPhysicalBooks($bookIds);

            if (($attributes['status'] ?? null) === 'processing') {
                $this->assertBooksAreNotActivelyLoaned($bookIds);
            }

            $bookLoan = BookLoan::create($attributes);
            $bookLoan->books()->sync($bookIds);

            $this->refreshBookAvailability($bookIds);
        });

        broadcast(new DashboardSummaryUpdated('book-loan.store'));

        return redirect()
            ->route('bookloans.index')
            ->with('message', 'Book loan created successfully.');
    }

    /**
     * Display the specified book loan.
     */
    public function show(BookLoan $bookloan)
    {
        if ($this->isDeleted($bookloan)) {
            return abort(404);
        }

        $loan = $this->normalizeLoanBooks($bookloan->load(['books:id,title', 'book:id,title', 'user:id,name']));

        return Inertia::render('BookLoans/Show', [
            'loan' => $loan,
        ]);
    }

    /**
     * Show the form for editing a book loan.
     */
    public function edit(BookLoan $bookloan)
    {
        if ($this->isDeleted($bookloan)) {
            return abort(404);
        }

        $bookloan->load(['books:id,title', 'book:id,title', 'user:id,name']);
        $selectedBookIds = $this->loanBookIds($bookloan);

        return Inertia::render('BookLoans/Edit', [
            'loan' => $this->normalizeLoanBooks($bookloan),
            'books' => $this->getAvailableBooksForSelection($selectedBookIds),
            'users' => $this->getLoanableUsers(),
            'statuses' => ['processing', 'returned', 'canceled'],
        ]);
    }

    /**
     * Update the specified book loan.
     */
    public function update(BookLoanRequest $request, BookLoan $bookloan): RedirectResponse
    {
        $validated = $request->validatedWithExtras();
        $newBookIds = $this->uniqueBookIdsFromPayload($validated);

        if ($newBookIds === []) {
            throw ValidationException::withMessages([
                'book_ids' => 'Please select at least one book.',
            ]);
        }

        $attributes = $validated;
        unset($attributes['book_ids']);

        if (($attributes['status'] ?? null) === 'returned' && empty($attributes['returned_at'])) {
            $attributes['returned_at'] = now();
        }

        if (($attributes['status'] ?? null) !== 'returned') {
            $attributes['returned_at'] = null;
        }

        $bookloan->load(['books:id,title', 'book:id,title']);
        $previousBookIds = $this->loanBookIds($bookloan);
        $affectedBookIds = array_values(array_unique(array_merge($previousBookIds, $newBookIds)));

        DB::transaction(function () use ($bookloan, $attributes, $newBookIds, $affectedBookIds): void {
            $this->lockBooks($affectedBookIds);
            $this->assertValidPhysicalBooks($newBookIds);

            if (($attributes['status'] ?? $bookloan->status) === 'processing') {
                $this->assertBooksAreNotActivelyLoaned($newBookIds, $bookloan->id);
            }

            $bookloan->update($attributes);
            $bookloan->books()->sync($newBookIds);

            $this->refreshBookAvailability($affectedBookIds);
        });

        broadcast(new DashboardSummaryUpdated('book-loan.update'));

        return redirect()
            ->route('bookloans.show', $bookloan)
            ->with('message', 'Book loan updated successfully.');
    }

    /**
     * Delete the specified book loan.
     */
    public function destroy(BookLoan $bookloan): RedirectResponse
    {
        $bookloan->load(['books:id,title', 'book:id,title']);
        $bookIds = $this->loanBookIds($bookloan);

        return $this->handleBookLoanOperation(function () use ($bookloan, $bookIds) {
            $bookloan->is_deleted
                ? $bookloan->delete()
                : $bookloan->update(['is_deleted' => true]);

            $this->refreshBookAvailability($bookIds);
            broadcast(new DashboardSummaryUpdated('book-loan.destroy'));

            return redirect()
                ->route('bookloans.index')
                ->with('message', 'Book loan deleted successfully.');
        }, 'delete');
    }

    /**
     * Handle book loan operations with error catching.
     */
    private function handleBookLoanOperation(callable $operation, string $action): RedirectResponse
    {
        try {
            return $operation();
        } catch (\Exception $e) {
            return redirect()->back()->with('flash', [
                'error' => "Failed to $action book loan: ".$e->getMessage(),
            ]);
        }
    }

    /**
     * Export bookloans as CSV.
     */
    public function export()
    {
        $csv = (new \App\Exports\BookLoanExport())->toCsvString();
        $filename = 'bookloans_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Import bookloans from a CSV file.
     */
    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        try {
            $result = (new \App\Imports\BookLoanImport())->importFromPath(
                $validated['import_file']->getRealPath()
            );

            $message = "Import complete. Created: {$result['created']}, Updated: {$result['updated']}, Failed: {$result['failed']}.";

            if ($result['failed'] > 0) {
                $sampleErrors = implode(' | ', array_slice($result['errors'], 0, 3));

                if (($result['created'] ?? 0) > 0 || ($result['updated'] ?? 0) > 0) {
                    broadcast(new DashboardSummaryUpdated('book-loan.import'));
                }

                return redirect()->route('bookloans.index')->with('flash', [
                    'error' => $message.' '.$sampleErrors,
                ]);
            }

            if (($result['created'] ?? 0) > 0 || ($result['updated'] ?? 0) > 0) {
                broadcast(new DashboardSummaryUpdated('book-loan.import'));
            }

            return redirect()->route('bookloans.index')->with('flash', [
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return redirect()->route('bookloans.index')->with('flash', [
                'error' => 'Import failed: '.$e->getMessage(),
            ]);
        }
    }

    /**
     * Redirect if the user is not a staff member.
     */
    protected function shouldRedirectIfNotStaff(): ?RedirectResponse
    {
        return Auth::check() && ! Auth::user()->hasRole('staff')
            ? redirect()->route('bookloans.index')
            : null;
    }

    /**
     * Get the user's campus ID.
     */
    protected function userCampusId(): ?int
    {
        return Auth::user()->campus_id;
    }

    /**
     * Check if the book loan is deleted.
     */
    protected function isDeleted(BookLoan $bookloan): bool
    {
        return (bool) $bookloan->is_deleted;
    }

    /**
     * Get users eligible for loans in the current campus.
     */
    protected function getLoanableUsers()
    {
        return User::loaners($this->userCampusId())->get()->toArray();
    }

    private function uniqueBookIdsFromPayload(array $validated): array
    {
        return collect($validated['book_ids'] ?? [])
            ->when(
                isset($validated['book_id']) && $validated['book_id'] !== null,
                fn ($collection) => $collection->push($validated['book_id'])
            )
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function loanBookIds(BookLoan $bookloan): array
    {
        $bookIds = $bookloan->relationLoaded('books')
            ? $bookloan->books->pluck('id')->all()
            : $bookloan->books()->pluck('books.id')->all();

        $bookIds = collect($bookIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($bookIds === [] && $bookloan->book_id) {
            return [(int) $bookloan->book_id];
        }

        return $bookIds;
    }

    private function normalizeLoanBooks(BookLoan $bookLoan): BookLoan
    {
        $books = $bookLoan->relationLoaded('books')
            ? $bookLoan->books
            : $bookLoan->books()->select(['books.id', 'title'])->get();

        $fallbackBook = $bookLoan->relationLoaded('book')
            ? $bookLoan->book
            : null;

        if (! $fallbackBook && $bookLoan->book_id) {
            $fallbackBook = Book::query()->select(['id', 'title'])->find($bookLoan->book_id);
        }

        if ($books->isEmpty() && $fallbackBook) {
            $books = collect([$fallbackBook]);
        }

        $bookLoan->setRelation('books', $books->values());

        if (! $bookLoan->relationLoaded('book') || $bookLoan->book === null) {
            $bookLoan->setRelation('book', $fallbackBook ?: $books->first());
        }

        return $bookLoan;
    }

    private function getAvailableBooksForSelection(array $alwaysIncludeBookIds = [])
    {
        $user = Auth::user();
        $alwaysIncludeBookIds = collect($alwaysIncludeBookIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        return Book::query()
            ->select(['id', 'title'])
            ->where('type', 'physical')
            ->where('is_deleted', false)
            ->when(
                $user && $user->hasAnyRole(['staff', 'regular-user']) && $user->campus_id,
                fn ($query) => $query->where('campus_id', $user->campus_id)
            )
            ->where(function ($query) use ($alwaysIncludeBookIds) {
                $query->where('is_available', true);

                if ($alwaysIncludeBookIds !== []) {
                    $query->orWhereIn('id', $alwaysIncludeBookIds);
                }
            })
            ->orderBy('title')
            ->get();
    }

    private function lockBooks(array $bookIds): void
    {
        if ($bookIds === []) {
            return;
        }

        Book::query()
            ->whereIn('id', $bookIds)
            ->lockForUpdate()
            ->get(['id']);
    }

    private function assertValidPhysicalBooks(array $bookIds): void
    {
        if ($bookIds === []) {
            throw ValidationException::withMessages([
                'book_ids' => 'Please select at least one book.',
            ]);
        }

        $user = Auth::user();
        $validBooksQuery = Book::query()
            ->whereIn('id', $bookIds)
            ->where('type', 'physical')
            ->where('is_deleted', false);

        if ($user && $user->hasAnyRole(['staff', 'regular-user']) && $user->campus_id) {
            $validBooksQuery->where('campus_id', $user->campus_id);
        }

        $validCount = $validBooksQuery->count();

        if ($validCount !== count($bookIds)) {
            throw ValidationException::withMessages([
                'book_ids' => 'One or more selected books are not eligible for lending.',
            ]);
        }
    }

    private function assertBooksAreNotActivelyLoaned(array $bookIds, ?int $ignoreBookLoanId = null): void
    {
        if ($bookIds === []) {
            return;
        }

        $activePivotBookIds = DB::table('book_loan_books as blb')
            ->join('book_loans as bl', 'bl.id', '=', 'blb.book_loan_id')
            ->whereIn('blb.book_id', $bookIds)
            ->where('bl.is_deleted', 0)
            ->where('bl.status', 'processing')
            ->when($ignoreBookLoanId, fn ($query, $loanId) => $query->where('bl.id', '!=', $loanId))
            ->pluck('blb.book_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $activeLegacyBookIds = BookLoan::query()
            ->whereIn('book_id', $bookIds)
            ->where('is_deleted', false)
            ->where('status', 'processing')
            ->when($ignoreBookLoanId, fn ($query, $loanId) => $query->where('id', '!=', $loanId))
            ->pluck('book_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->all();

        $conflictingBookIds = collect(array_merge($activePivotBookIds, $activeLegacyBookIds))
            ->unique()
            ->values()
            ->all();

        if ($conflictingBookIds === []) {
            return;
        }

        $conflictingTitles = Book::query()
            ->whereIn('id', $conflictingBookIds)
            ->orderBy('title')
            ->pluck('title')
            ->all();

        throw ValidationException::withMessages([
            'book_ids' => 'The following books are already on active loans: '.implode(', ', $conflictingTitles).'.',
        ]);
    }

    private function refreshBookAvailability(array $bookIds): void
    {
        $bookIds = collect($bookIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($bookIds === []) {
            return;
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

        $borrowedBookIds = collect(array_merge($processingPivotBookIds, $processingLegacyBookIds))
            ->unique()
            ->values()
            ->all();

        Book::query()->whereIn('id', $bookIds)->update(['is_available' => true]);

        if ($borrowedBookIds !== []) {
            Book::query()->whereIn('id', $borrowedBookIds)->update(['is_available' => false]);
        }
    }
}
