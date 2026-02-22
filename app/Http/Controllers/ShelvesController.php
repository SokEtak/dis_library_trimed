<?php

namespace App\Http\Controllers;

use App\Models\Bookcase;
use App\Models\Shelf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ShelvesController extends Controller
{
    /**
     * Display a listing of shelves.
     */
    public function index()
    {
        $shelves = Shelf::forCurrentCampusWithActiveBooks()->get();

        return Inertia::render('Shelves/Index', [
            'shelves' => $shelves,
            'bookcases' => $this->getBookcasesForCampus(),
            'flash' => [
                'message' => session('flash.message') ?? session('message'),
                'error' => session('flash.error'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new shelf.
     */
    public function create()
    {
        return redirect()->route('shelves.index', ['dialog' => 'create']);
    }

    /**
     * Display the specified shelf.
     */
    public function show(Request $request, Shelf $shelf)
    {
        if (! $this->belongsToUserCampus($shelf)) {
            return abort(404, 'Not Found');
        }

        $shelf->loadActiveBooks();

        if ($request->expectsJson()) {
            return response()->json([
                'data' => $shelf,
            ]);
        }

        return Inertia::render('Shelves/Show', [
            'shelf' => $shelf,
            'flash' => ['message' => session('flash.message') ?? session('message')],
        ]);
    }

    /**
     * Store a newly created shelf.
     */
    public function store(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10',
            'bookcase_id' => [
                'required',
                'exists:bookcases,id',
                function ($attribute, $value, $fail) {
                    if (! $this->bookcaseBelongsToUserCampus($value)) {
                        $fail('The selected bookcase does not belong to your campus.');
                    }
                },
            ],
        ]);

        $shelf = Shelf::create($validated + ['campus_id' => Auth::user()->campus_id]);
        $shelf->loadActiveBooks();
        $message = 'Shelf created successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'data' => $shelf,
            ], 201);
        }

        return redirect()->route('shelves.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    /**
     * Show the form for editing a shelf.
     */
    public function edit(Shelf $shelf)
    {
        if (! $this->belongsToUserCampus($shelf)) {
            return abort(404, 'Not Found');
        }

        return redirect()->route('shelves.index', [
            'dialog' => 'edit',
            'id' => $shelf->id,
        ]);
    }

    /**
     * Update the specified shelf.
     */
    public function update(Request $request, Shelf $shelf): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        if (! $this->belongsToUserCampus($shelf)) {
            return abort(404, 'Not Found');
        }

        $validated = $request->validate([
            'code' => 'required|string|max:255',
            'bookcase_id' => [
                'required',
                'exists:bookcases,id',
                function ($attribute, $value, $fail) {
                    if (! $this->bookcaseBelongsToUserCampus($value)) {
                        $fail('The selected bookcase does not belong to your campus.');
                    }
                },
            ],
        ]);

        $shelf->update($validated);
        $shelf->loadActiveBooks();
        $message = 'Shelf updated successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'data' => $shelf,
            ]);
        }

        return redirect()->route('shelves.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    /**
     * Remove the specified shelf.
     */
    public function destroy(Request $request, Shelf $shelf): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        if (! $this->belongsToUserCampus($shelf)) {
            return abort(404, 'Not Found');
        }

        $hasActiveBooks = $shelf->books()
            ->where('is_deleted', 0)
            ->where('campus_id', Auth::user()->campus_id)
            ->exists();

        if ($hasActiveBooks) {
            $message = 'Cannot delete shelf because it still contains active books.';

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                ], 422);
            }

            return redirect()->route('shelves.index')->with('flash', [
                'error' => $message,
                'type' => 'error',
            ]);
        }

        $shelf->delete();
        $message = 'Shelf deleted successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
            ]);
        }

        return redirect()->route('shelves.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    /**
     * Export shelves as CSV.
     */
    public function export()
    {
        $csv = (new \App\Exports\ShelfExport())->toCsvString();
        $filename = 'shelves_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Import shelves from a CSV file.
     */
    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        try {
            $result = (new \App\Imports\ShelfImport())->importFromPath(
                $validated['import_file']->getRealPath()
            );

            $message = "Import complete. Created: {$result['created']}, Updated: {$result['updated']}, Failed: {$result['failed']}.";

            if ($result['failed'] > 0) {
                $sampleErrors = implode(' | ', array_slice($result['errors'], 0, 3));

                return redirect()->route('shelves.index')->with('flash', [
                    'error' => $message.' '.$sampleErrors,
                ]);
            }

            return redirect()->route('shelves.index')->with('flash', [
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return redirect()->route('shelves.index')->with('flash', [
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
            ? redirect()->route('shelves.index')
            : null;
    }

    /**
     * Check if the model belongs to the user's campus.
     */
    protected function belongsToUserCampus($model): bool
    {
        return $model->campus_id === Auth::user()->campus_id;
    }

    /**
     * Get bookcases for the user's campus.
     */
    protected function getBookcasesForCampus()
    {
        return Bookcase::select('id', 'code')
            ->where('campus_id', Auth::user()->campus_id)
            ->orderBy('code')
            ->get();
    }

    /**
     * Check if the bookcase belongs to the user's campus.
     */
    protected function bookcaseBelongsToUserCampus($bookcaseId): bool
    {
        $bookcase = Bookcase::find($bookcaseId);

        return $bookcase && $bookcase->campus_id === Auth::user()->campus_id;
    }
}

