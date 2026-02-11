<?php

namespace App\Http\Controllers;

use App\Http\Requests\BookLoan\BookLoanRequest;
use App\Models\Book;
use App\Models\BookLoan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BookLoanController extends Controller
{
    /**
     * Display a listing of book loans.
     */
    public function index()
    {
        $query = BookLoan::with(['book', 'user'])->active($this->userCampusId());

        $status = request('status');
        $overdue = request('overdue');

        if ($status) {
            $query->where('status', $status);
        }

        if ($overdue) {
            $today = now()->timezone('Asia/Phnom_Penh')->toDateString();
            $query->where('return_date', '<', $today)->where('status', 'processing');
        }

        $bookloans = $query->get();

        return Inertia::render('BookLoans/Index', [
            'bookloans' => $bookloans,
        ]);
    }

    /**
     * Show the form for creating a new book loan.
     */
    public function create()
    {
        return Inertia::render('BookLoans/Create', [
            'books' => Book::active('physical')->get(),
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

        BookLoan::create($validated);

        Book::where('id', $validated['book_id'])->update(['is_available' => false]);

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

        return Inertia::render('BookLoans/Show', [
            'loan' => $bookloan->load(['book', 'user']),
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

        return Inertia::render('BookLoans/Edit', [
            'loan' => $bookloan,
            'books' => Book::active(null)->get(),
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

        // If status is being set to 'returned', set returned_at to now
        if (isset($validated['status']) && $validated['status'] === 'returned') {
            $validated['returned_at'] = now();
        }

        $bookloan->update($validated);

        if (in_array($bookloan->status, ['canceled', 'returned'])) {
            Book::where('id', $bookloan->book_id)->update(['is_available' => true]);
        }

        return redirect()
            ->route('bookloans.show', $bookloan)
            ->with('message', 'Book loan updated successfully.');
    }

    /**
     * Delete the specified book loan.
     */
    public function destroy(BookLoan $bookloan): RedirectResponse
    {
        return $this->handleBookLoanOperation(function () use ($bookloan) {
            $bookloan->is_deleted
                ? $bookloan->delete()
                : $bookloan->update(['is_deleted' => true]);

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
        return $bookloan->is_deleted === 1;
    }

    /**
     * Get users eligible for loans in the current campus.
     */
    protected function getLoanableUsers()
    {
        return User::loaners($this->userCampusId())->get()->toArray();
    }
}
