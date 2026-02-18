<?php

namespace App\Http\Controllers;

use App\Exports\BookExport;
use App\Http\Requests\Book\StoreBookRequest;
use App\Http\Requests\Book\UpdateBookRequest;
use App\Imports\BookImport;
use App\Models\Book;
use App\Models\Bookcase;
use App\Models\Campus;
use App\Models\Category;
use App\Models\Grade;
use App\Models\Shelf;
use App\Models\SubCategory;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BookController extends Controller
{
    /**
     * Display a listing of books.
     */
    public function index(Request $request)
    {
        $book_type = request()->query('type', null);

        // Allow 'miss' and 'del' as valid book_types
        if (! in_array($book_type, ['physical', 'ebook', 'miss', 'del'])) {
            $book_type = null; // Default to null to fetch all non-deleted books
        }
        // Sort desc to see the newest created book
        $books = Book::active($book_type)->orderByDesc('created_at')->get();
        // dd($books->toArray());
        // dd($books->toArray());
        return Inertia::render('Books/Index', [
            'books' => $books,
            'availableCategories' => Category::all(),
            'availableSubjects' => Subject::all(),
            'availableShelves' => Shelf::select(['id', 'code'])->get(),
            'availableSubcategories' => SubCategory::all(),
            'availableBookcases' => Bookcase::select(['id', 'code'])->get(),
            'availableCampuses' => Campus::select('id', 'name')->get(),
            'availableGrades' => Grade::all(),
            'isSuperLibrarian' => $this->isSuperLibrarian(),
            'flash' => session('flash', []),
        ]);
    }

    /**
     * Export books as CSV.
     */
    public function export(): Response
    {
        $csv = (new BookExport())->toCsvString();
        $filename = 'books_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Import books from a CSV file.
     */
    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $result = (new BookImport())->importFromPath(
            $validated['import_file']->getRealPath(),
            Auth::id()
        );

        $message = "Import complete. Created: {$result['created']}, Updated: {$result['updated']}, Failed: {$result['failed']}.";

        if ($result['failed'] > 0) {
            $sampleErrors = implode(' | ', array_slice($result['errors'], 0, 3));

            return redirect()->route('books.index')->with('flash', [
                'error' => $message.' '.$sampleErrors,
            ]);
        }

        return redirect()->route('books.index')->with('flash', [
            'message' => $message,
        ]);
    }

    /**
     * Show the form for creating a new book.
     */
    public function create(Request $request)
    {
        return Inertia::render('Books/Create', [
            'categories' => Category::all(['id', 'name']),
            'subcategories' => SubCategory::all(['id', 'name']),
            'shelves' => $this->getShelvesForCampus(),
            'bookcases' => $this->getBookcasesForCampus(),
            'grades' => Grade::all(['id', 'name']),
            'subjects' => Subject::all(['id', 'name']),
            'type' => request('type', 'physical'),
            'lang' => $request->query('lang', 'en'),
        ]);
    }

    /**
     * Store a newly created book.
     */
    public function store(StoreBookRequest $request): RedirectResponse
    {

        $validated = $request->validated();
        $book = new Book(array_merge($validated, ['user_id' => Auth::id()]));

        try {
            // Handle cover upload
            if ($request->hasFile('cover') && $request->file('cover')->isValid()) {
                $coverFile = $request->file('cover');
                $allowedMimes = ['image/jpeg', 'image/png'];

                if (! in_array($coverFile->getMimeType(), $allowedMimes)) {
                    Log::warning('Invalid cover image format', [
                        'mime' => $coverFile->getMimeType(),
                        'filename' => $coverFile->getClientOriginalName(),
                    ]);

                    return redirect()->back()->with('flash', ['error' => 'Invalid cover image format. Only JPEG or PNG allowed.']);
                }

                $coverExtension = $coverFile->getClientOriginalExtension();
                $bookCode = $validated['code'];
                $sanitizedCode = preg_replace('/[^A-Za-z0-9\-_]/', '', $bookCode);

                $coverFilename = 'covers/'.$sanitizedCode.'.'.$coverExtension;
                $counter = 1;

                while (Storage::disk('public')->exists($coverFilename)) {
                    $coverFilename = 'covers/'.$sanitizedCode.'('.$counter.').'.$coverExtension;
                    $counter++;
                }

                $coverPath = $coverFile->storeAs('', $coverFilename, 'public');
                if (! $coverPath) {
                    Log::error('Failed to store cover image', ['filename' => $coverFilename]);

                    return redirect()->back()->with('flash', ['error' => 'Failed to store cover image.']);
                }

                $book->cover = Storage::disk('public')->url($coverPath);
                Log::info('Cover uploaded successfully', ['path' => $coverPath, 'url' => $book->cover]);
            }

            // Handle PDF upload (optional for e-books)
            if ($this->isEbook($validated) && $request->hasFile('pdf_url') && $request->file('pdf_url')->isValid()) {
                $pdfFile = $request->file('pdf_url');

                if ($pdfFile->getMimeType() !== 'application/pdf') {
                    Log::warning('Invalid PDF file format', [
                        'mime' => $pdfFile->getMimeType(),
                        'filename' => $pdfFile->getClientOriginalName(),
                    ]);

                    return redirect()->back()->with('flash', ['error' => 'Invalid PDF file format. Only PDF allowed.']);
                }

                $originalPdfName = pathinfo($pdfFile->getClientOriginalName(), PATHINFO_FILENAME);
                $pdfExtension = $pdfFile->getClientOriginalExtension();
                $sanitizedPdfName = preg_replace('/[^A-Za-z0-9\-_]/', '', $originalPdfName);
                $pdfFilename = 'pdfs/'.$sanitizedPdfName.'.'.$pdfExtension;
                $counter = 1;

                while (Storage::disk('public')->exists($pdfFilename)) {
                    $pdfFilename = 'pdfs/'.$sanitizedPdfName.'('.$counter.').'.$pdfExtension;
                    $counter++;
                }

                $pdfPath = $pdfFile->storeAs('', $pdfFilename, 'public');
                if (! $pdfPath) {
                    Log::error('Failed to store PDF file', ['filename' => $pdfFilename]);

                    return redirect()->back()->with('flash', ['error' => 'Failed to store PDF file.']);
                }

                $book->pdf_url = Storage::disk('public')->url($pdfPath);
                Log::info('PDF uploaded successfully', ['path' => $pdfPath, 'url' => $book->pdf_url]);
            }

            $book->save();

            // Redirect based on is_continue
            $redirectRoute = $request['is_continue']
                ? route('books.create', ['type' => $validated['type']])
                : route('books.index');

            $locale = app()->getLocale();
            $message = $locale === 'kh'
                ? 'សៀវភៅត្រូវបានបង្កើតដោយជោគជ័យ!'
                : 'Book created successfully!';

            return redirect()->to($redirectRoute)->with('flash', ['message' => $message]);

        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Database error during book store', [
                'error' => $e->getMessage(),
                'validated' => $validated,
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
            ]);
            $errorMessage = stripos($e->getMessage(), 'duplicate entry') !== false
                ? 'Duplicate book code or ISBN. Please use a unique code or ISBN.'
                : 'Unable to save book: '.$e->getMessage();

            return redirect()->back()->with('flash', ['error' => $errorMessage]);

        } catch (\Exception $e) {
            Log::error('General exception during book store', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'validated' => $validated,
            ]);

            return redirect()->back()->with('flash', ['error' => 'Book creation failed: '.$e->getMessage()]);
        }
    }

    /**
     * Display the specified book.
     */
    public function show(Book $book)
    {
        if ($this->isDeleted($book)) {
            return abort(404);
        }

        if (! $this->belongsToUserCampus($book)) {
            return abort(403, 'Unauthorized action.');
        }

        return Inertia::render('Books/Show', ['book' => $book]);
    }

    /**
     * Show the form for editing a book.
     */
    public function edit(Book $book)
    {
        // TEMP: Redirect to index until edit functionality is implemented
        // return redirect()->route('books.index');

        if ($this->isDeleted($book)) {
            return abort(404);
        }

        if (! $this->belongsToUserCampus($book)) {
            return abort(403, 'Unauthorized action.');
        }

        return Inertia::render('Books/Edit', [
            'book' => $book,
            'categories' => Category::all(),
            'subcategory' => SubCategory::all(),
            'shelves' => $this->getShelvesForCampus(),
            'bookcases' => $this->getBookcasesForCampus(),
            'grades' => Grade::all(),
            'subjects' => Subject::all(),
        ]);
    }

    /**
     * Update the specified book.
     */
    public function update(UpdateBookRequest $request, Book $book): RedirectResponse
    {
        if ($this->isDeleted($book)) {
            return abort(404);
        }

        if (! $this->belongsToUserCampus($book)) {
            return abort(403, 'Unauthorized action.');
        }

        Log::info('Book update request payload (raw):', $request->all());

        $validated = $request->validated();

        try {
            // Handle cover upload
            if ($request->hasFile('cover') && $request->file('cover')->isValid()) {
                $coverFile = $request->file('cover');
                $allowedMimes = ['image/jpeg', 'image/png'];

                if (! in_array($coverFile->getMimeType(), $allowedMimes)) {
                    Log::warning('Invalid cover image format', [
                        'mime' => $coverFile->getMimeType(),
                        'filename' => $coverFile->getClientOriginalName(),
                    ]);

                    return redirect()->back()->with('flash', ['error' => 'Invalid cover image format. Only JPEG or PNG allowed.']);
                }

                $coverExtension = $coverFile->getClientOriginalExtension();
                $bookCode = $validated['code'] ?? $book->code;
                $sanitizedCode = preg_replace('/[^A-Za-z0-9\-_]/', '', $bookCode);

                $coverFilename = 'covers/'.$sanitizedCode.'.'.$coverExtension;
                $counter = 1;

                while (Storage::disk('public')->exists($coverFilename)) {
                    $coverFilename = 'covers/'.$sanitizedCode.'('.$counter.').'.$coverExtension;
                    $counter++;
                }

                // Delete existing cover if it exists (normalize path from URL)
                if ($book->cover) {
                    $parsedPath = parse_url($book->cover, PHP_URL_PATH);
                    if ($parsedPath) {
                        Storage::disk('public')->delete(ltrim($parsedPath, '/storage/'));
                    }
                }

                $coverPath = $coverFile->storeAs('', $coverFilename, 'public');
                if (! $coverPath) {
                    Log::error('Failed to store cover image', ['filename' => $coverFilename]);

                    return redirect()->back()->with('flash', ['error' => 'Failed to store cover image.']);
                }

                $validated['cover'] = Storage::disk('public')->url($coverPath);
                Log::info('Cover uploaded successfully', ['path' => $coverPath, 'url' => $validated['cover']]);
            }

            // Handle PDF upload (optional for e-books)
            if ($this->isEbook($validated) && $request->hasFile('pdf_url') && $request->file('pdf_url')->isValid()) {
                $pdfFile = $request->file('pdf_url');

                if ($pdfFile->getMimeType() !== 'application/pdf') {
                    Log::warning('Invalid PDF file format', [
                        'mime' => $pdfFile->getMimeType(),
                        'filename' => $pdfFile->getClientOriginalName(),
                    ]);

                    return redirect()->back()->with('flash', ['error' => 'Invalid PDF file format. Only PDF allowed.']);
                }

                $originalPdfName = pathinfo($pdfFile->getClientOriginalName(), PATHINFO_FILENAME);
                $pdfExtension = $pdfFile->getClientOriginalExtension();
                $sanitizedPdfName = preg_replace('/[^A-Za-z0-9\-_]/', '', $originalPdfName);
                $pdfFilename = 'pdfs/'.$sanitizedPdfName.'.'.$pdfExtension;
                $counter = 1;

                while (Storage::disk('public')->exists($pdfFilename)) {
                    $pdfFilename = 'pdfs/'.$sanitizedPdfName.'('.$counter.').'.$pdfExtension;
                    $counter++;
                }

                // Delete existing PDF if it exists (normalize path from URL)
                if ($book->pdf_url) {
                    $parsedPath = parse_url($book->pdf_url, PHP_URL_PATH);
                    if ($parsedPath) {
                        Storage::disk('public')->delete(ltrim($parsedPath, '/storage/'));
                    }
                }

                $pdfPath = $pdfFile->storeAs('', $pdfFilename, 'public');
                if (! $pdfPath) {
                    Log::error('Failed to store PDF file', ['filename' => $pdfFilename]);

                    return redirect()->back()->with('flash', ['error' => 'Failed to store PDF file.']);
                }

                $validated['pdf_url'] = Storage::disk('public')->url($pdfPath);
                Log::info('PDF uploaded successfully', ['path' => $pdfPath, 'url' => $validated['pdf_url']]);
            }

            $book->update($validated);

            $locale = app()->getLocale();
            $message = $locale === 'kh'
                ? 'សៀវភៅត្រូវបានកែប្រែដោយជោគជ័យ!'
                : 'Book updated successfully!';

            return redirect()->route('books.index')->with('flash', ['message' => $message]);

        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Database error during book update', [
                'error' => $e->getMessage(),
                'validated' => $validated,
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
            ]);
            $errorMessage = stripos($e->getMessage(), 'duplicate entry') !== false
                ? 'Duplicate book code or ISBN. Please use a unique code or ISBN.'
                : 'Unable to update book: '.$e->getMessage();

            return redirect()->back()->with('flash', ['error' => $errorMessage]);

        } catch (\Exception $e) {
            Log::error('General exception during book update', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'validated' => $validated,
            ]);

            return redirect()->back()->with('flash', ['error' => 'Book update failed: '.$e->getMessage()]);
        }
    }

    /**
     * Restore a soft-deleted book (set is_deleted to false).
     */
    public function restore(Request $request, Book $book): RedirectResponse
    {
        if (! $this->isDeleted($book)) {
            return redirect()->back()->with('flash', ['error' => 'Book is not deleted or already active.']);
        }

        if (! $this->belongsToUserCampus($book)) {
            return abort(403, 'Unauthorized action.');
        }

        try {
            $book->update(['is_deleted' => false]);

            $locale = app()->getLocale();
            $message = $locale === 'kh' ? 'សៀវភៅត្រូវបានស្ដារឡើងវិញដោយជោគជ័យ!' : 'Book restored successfully!';

            return redirect()->route('books.index')->with('flash', ['message' => $message]);
        } catch (\Exception $e) {
            Log::error('Failed to restore book', ['error' => $e->getMessage(), 'book_id' => $book->id]);
            return redirect()->back()->with('flash', ['error' => 'Failed to restore book: '.$e->getMessage()]);
        }
    }

    /**
     * Delete the specified book.
     */
    public function destroy(Book $book): RedirectResponse
    {
        return $this->handleBookOperation(function () use ($book) {
            try {
                if (! $book->is_deleted) {
                    $book->update(['is_deleted' => true]);
                    $message = 'Book deleted successfully!';
                } else {
                    if ($book->cover) {
                        $parsedPath = parse_url($book->cover, PHP_URL_PATH);
                        if ($parsedPath) {
                            Storage::disk('public')->delete(ltrim($parsedPath, '/storage/'));
                        }
                    }
                    if ($book->pdf_url) {
                        $parsedPath = parse_url($book->pdf_url, PHP_URL_PATH);
                        if ($parsedPath) {
                            Storage::disk('public')->delete(ltrim($parsedPath, '/storage/'));
                        }
                    }
                    $book->delete();
                    $message = 'Book permanently deleted!';
                }

                return redirect()->route('books.index')->with('message', $message);
            } catch (\Exception $e) {
                Log::error('General exception during book destroy', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

                return redirect()->back()->with('flash', [
                    'error' => 'Deletion failed: '.$e->getMessage(),
                ]);
            }
        }, 'delete');
    }

    /**
     * Handle book operations with error catching.
     */
    private function handleBookOperation(callable $operation, string $action): RedirectResponse
    {
        try {
            return $operation();
        } catch (\Exception $e) {
            Log::error("Book operation ($action) failed", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return redirect()->back()->with('flash', [
                'error' => "Failed to $action book: ".$e->getMessage(),
            ]);
        }
    }

    /**
     * Redirect if the user is not a staff member.
     */
    protected function shouldRedirectIfNotStaff(): ?RedirectResponse
    {
        return Auth::check() && ! Auth::user()->hasRole('staff')
            ? redirect()->route('books.index')
            : null;
    }

    /**
     * Check if the user is a super librarian (admin).
     */
    protected function isSuperLibrarian(): bool
    {
        return Auth::check() && Auth::user()->hasRole('admin');
    }

    /**
     * Get the user's campus ID.
     */
    protected function userCampusId(): ?int
    {
        return Auth::user()->campus_id;
    }

    /**
     * Check if the model belongs to the user's campus.
     */
    protected function belongsToUserCampus($model): bool
    {
        return $model->campus_id === $this->userCampusId();
    }

    /**
     * Check if the book is deleted.
     */
    protected function isDeleted(Book $book): bool
    {
        return $book->is_deleted;
    }

    /**
     * Check if the book is an e-book.
     */
    protected function isEbook(array $validated): bool
    {
        return $validated['type'] === 'ebook';
    }

    /**
     * Store a PDF file for an e-book.
     */
    protected function storePdf($request): string
    {
        try {
            $pdfFile = $request->file('pdf_url');
            $pdfExtension = $pdfFile->getClientOriginalExtension();
            $pdfFilename = 'pdfs/'.uniqid('pdf_', true).'.'.$pdfExtension;

            Log::info('Starting PDF upload to local storage', ['filename' => $pdfFilename]);

            $path = $pdfFile->storeAs('', $pdfFilename, 'public');
            $url = Storage::disk('public')->url($path);

            Log::info('PDF uploaded successfully', ['path' => $path, 'url' => $url]);

            return $url;
        } catch (\Exception $e) {
            Log::error('Exception during PDF store', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            throw new \Exception('PDF upload failed: '.$e->getMessage());
        }
    }

    /**
     * Get shelves for the user's campus.
     */
    protected function getShelvesForCampus()
    {
        return Shelf::select(['id', 'code'])
            ->where('campus_id', $this->userCampusId())
            ->get();
    }

    /**
     * Get bookcases for the user's campus.
     */
    protected function getBookcasesForCampus()
    {
        return Bookcase::select(['id', 'code'])
            ->where('campus_id', $this->userCampusId())
            ->get();
    }
}
