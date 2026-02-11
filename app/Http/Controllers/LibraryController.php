<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LibraryController extends Controller
{
    /**
     * Build a paginated book query with filters and sorting.
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    private function buildBookQuery(Request $request, string $type, string $scope, int $perPage = 42)
    {
        $query = Book::active($type, $scope);

        // Apply search filter
        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Apply category filter
        if ($request->has('category') && $request->query('category') !== 'All') {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('name', $request->query('category'));
            });
        }

        // Apply subcategory filter
        if ($request->has('subcategory') && $request->query('subcategory') !== 'All') {
            $query->whereHas('subcategory', function ($q) use ($request) {
                $q->where('name', $request->query('subcategory'));
            });
        }

        // Apply bookcase filter (physical books only)
        if ($type === 'physical' && $request->has('bookcase') && $request->query('bookcase') !== 'All') {
            $query->whereHas('bookcase', function ($q) use ($request) {
                $q->where('code', $request->query('bookcase'));
            });
        }

        // Apply shelf filter (physical books only)
        if ($type === 'physical' && $request->has('shelf') && $request->query('shelf') !== 'All') {
            $query->whereHas('shelf', function ($q) use ($request) {
                $q->where('code', $request->query('shelf'));
            });
        }

        // Apply grade filter
        if ($request->has('grade') && $request->query('grade') !== 'All') {
            $query->whereHas('grade', function ($q) use ($request) {
                $q->where('name', $request->query('grade'));
            });
        }

        // Apply subject filter
        if ($request->has('subject') && $request->query('subject') !== 'All') {
            $query->whereHas('subject', function ($q) use ($request) {
                $q->where('name', $request->query('subject'));
            });
        }

        // Apply campus filter (physical books in global scope only)
        if ($type === 'physical' && $scope === 'global' && $request->has('campus') && $request->query('campus') !== 'All') {
            $query->whereHas('campus', function ($q) use ($request) {
                $q->where('name', $request->query('campus'));
            });
        }

        // Apply language filter
        if ($request->has('language') && $request->query('language') !== 'All') {
            $query->where('language', $request->query('language'));
        }

        // Apply program filter
        if ($request->has('program') && $request->query('program') !== 'All') {
            $query->where('program', $request->query('program'));
        }

        // Apply sorting
        if ($request->has('sort_by')) {
            $sortBy = $request->query('sort_by');
            if ($sortBy === 'Newest') {
                $query->orderBy('created_at', 'desc');
            } elseif ($sortBy === 'Title A-Z') {
                $query->orderBy('title', 'asc');
            } elseif ($sortBy === 'Most Viewed') {
                $query->orderBy('view', 'desc');
            }
        } else {
            $query->inRandomOrder();
        }

        return $query->paginate($perPage);
    }

    /**
     * Display the Global Physical Library with pagination.
     */
    public function globalLibrary(Request $request)
    {
        $books = $this->buildBookQuery($request, 'physical', 'global');

        $lang = $request->user()->language ?? session('language', 'kh');
        if ($request->has('lang') && in_array($request->query('lang'), ['en', 'kh'])) {
            $lang = $request->query('lang');
            session(['language' => $lang]);
        }

        return Inertia::render('Client/Library/Index', [
            'books' => $books,
            'scope' => 'global',
            'lang' => $lang,
        ]);
    }

    /**
     * Display the Local Physical Library with pagination.
     */
    public function localLibrary(Request $request)
    {
        $books = $this->buildBookQuery($request, 'physical', 'local');

        return Inertia::render('Client/Library/Index', [
            'books' => $books,
            'scope' => 'local',
        ]);
    }

    /**
     * Display the Global E-book Library with pagination.
     */
    public function globalEbooks(Request $request)
    {
        try {
            $books = $this->buildBookQuery($request, 'ebook', 'global');

            return Inertia::render('Client/Library/Index', [
                'books' => $books,
                'bookType' => 'ebook',
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return Inertia::render('Error', ['status' => 403, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Show a single book and its details.
     */
    public function show(Book $book)
    {
        // Fetch related books logic
        $relatedBooks = Book::relatedBooks($book);

        // Increment view count if the user is not the book's owner
        if ($book->user_id !== Auth::id()) {
            $book->increment('view');
        }

        return Inertia::render('Client/Library/Show', [
            'book' => $book->load('user', 'category', 'subcategory', 'shelf', 'subject', 'grade', 'bookcase', 'campus')->toArray(),
            'lang' => app()->getLocale(),
            'authUser' => Auth::user() ? [
                'name' => Auth::user()->name,
                'email' => Auth::user()->email,
                'avatar' => Auth::user()->avatar ?? null,
                'isVerified' => Auth::user()->isVerified ?? false,
            ] : null,
            'relatedBooks' => $relatedBooks,
        ]);
    }
}
