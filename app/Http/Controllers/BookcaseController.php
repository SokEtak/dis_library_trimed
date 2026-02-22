<?php

namespace App\Http\Controllers;

use App\Http\Requests\Bookcase\StoreBookcaseRequest;
use App\Models\Bookcase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BookcaseController extends Controller
{
    /**
     * Display a listing of bookcases.
     */
    public function index()
    {
        $bookcases = Bookcase::forCurrentCampusWithBooks()->get();

        return Inertia::render('Bookcases/Index', [
            'bookcases' => $bookcases,
            'flash' => [
                'message' => session('flash.message') ?? session('message'),
                'error' => session('flash.error'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new bookcase.
     */
    public function create()
    {
        return redirect()->route('bookcases.index', ['dialog' => 'create']);
    }

    /**
     * Store a newly created bookcase.
     */
    public function store(StoreBookcaseRequest $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $bookcase = Bookcase::create($request->validated() + ['campus_id' => Auth::user()->campus_id]);
        $bookcase = Bookcase::forCurrentCampusWithBooks()->findOrFail($bookcase->id);
        $message = 'Bookcase created successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'data' => $bookcase,
            ], 201);
        }

        return redirect()->route('bookcases.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    /**
     * Display the specified bookcase.
     */
    public function show(Request $request, Bookcase $bookcase)
    {
        $bookcase = Bookcase::forCurrentCampusWithBooks()->findOrFail($bookcase->id);

        if ($request->expectsJson()) {
            return response()->json([
                'data' => $bookcase,
            ]);
        }

        return Inertia::render('Bookcases/Show', [
            'bookcase' => $bookcase,
            'flash' => ['message' => session('flash.message') ?? session('message')],
        ]);
    }

    /**
     * Show the form for editing a bookcase.
     */
    public function edit(Bookcase $bookcase)
    {
        if ($bookcase->campus_id !== Auth::user()->campus_id) {
            return abort(404, 'Not Found.');
        }

        return redirect()->route('bookcases.index', [
            'dialog' => 'edit',
            'id' => $bookcase->id,
        ]);
    }

    /**
     * Update the specified bookcase.
     */
    public function update(Request $request, Bookcase $bookcase): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        if ($bookcase->campus_id !== Auth::user()->campus_id) {
            return abort(404, 'Not Found.');
        }

        $bookcase->update($request->validate([
            'code' => 'required|string|max:255',
        ]));

        $bookcase = Bookcase::forCurrentCampusWithBooks()->findOrFail($bookcase->id);
        $message = 'Bookcase updated successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'data' => $bookcase,
            ]);
        }

        return redirect()->route('bookcases.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    /**
     * Remove the specified bookcase.
     */
    public function destroy(Request $request, Bookcase $bookcase): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        if ($bookcase->campus_id !== Auth::user()->campus_id) {
            return abort(404, 'Not Found.');
        }

        $hasActiveBooks = $bookcase->books()->physicalAndActiveForCampus()->exists();
        $hasShelves = $bookcase->shelves()->exists();

        if ($hasActiveBooks || $hasShelves) {
            $message = 'Cannot delete bookcase because it is still referenced by shelves or active books.';

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                ], 422);
            }

            return redirect()->route('bookcases.index')->with('flash', [
                'error' => $message,
                'type' => 'error',
            ]);
        }

        $bookcase->delete();
        $message = 'Bookcase deleted successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
            ]);
        }

        return redirect()->route('bookcases.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    /**
     * Export bookcases as CSV.
     */
    public function export()
    {
        $csv = (new \App\Exports\BookcaseExport())->toCsvString();
        $filename = 'bookcases_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Import bookcases from a CSV file.
     */
    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        try {
            $result = (new \App\Imports\BookcaseImport())->importFromPath(
                $validated['import_file']->getRealPath()
            );

            $message = "Import complete. Created: {$result['created']}, Updated: {$result['updated']}, Failed: {$result['failed']}.";

            if ($result['failed'] > 0) {
                $sampleErrors = implode(' | ', array_slice($result['errors'], 0, 3));

                return redirect()->route('bookcases.index')->with('flash', [
                    'error' => $message.' '.$sampleErrors,
                ]);
            }

            return redirect()->route('bookcases.index')->with('flash', [
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return redirect()->route('bookcases.index')->with('flash', [
                'error' => 'Import failed: '.$e->getMessage(),
            ]);
        }
    }
}

