<?php

namespace App\Http\Controllers;

use App\Http\Requests\Campus\CampusRequest;
use App\Models\Campus;
use App\Models\School;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class CampusController extends Controller
{
    /**
     * Display a listing of campuses.
     */
    public function index()
    {
        $campuses = Campus::with('school')
            ->select('id', 'school_id', 'name', 'code', 'email', 'contact', 'address', 'website')
            ->orderBy('name')
            ->paginate(10);

        return Inertia::render('Campuses/Index', [
            'campuses' => $campuses,
            'flash' => session('flash'),
            'isSuperLibrarian' => auth()->user()?->hasRole('super-librarian') ?? false,
            'lang' => app()->getLocale(),
        ]);
    }

    /**
     * Show the form for creating a new campus.
     */
    public function create()
    {
        $schools = School::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Campuses/Create', [
            'schools' => $schools,
            'isSuperLibrarian' => auth()->user()?->hasRole('super-librarian') ?? false,
            'lang' => app()->getLocale(),
        ]);
    }

    /**
     * Store a newly created campus.
     */
    public function store(CampusRequest $request)
    {
        Campus::create($request->validated());

        return Redirect::route('campuses.index')
            ->with('flash', ['message' => 'Campus created successfully.', 'type' => 'success']);
    }

    /**
     * Display the specified campus.
     */
    public function show(Campus $campus)
    {
        $campus->load('school');

        return Inertia::render('Campuses/Show', [
            'campus' => $campus,
            'isSuperLibrarian' => auth()->user()?->hasRole('super-librarian') ?? false,
            'lang' => app()->getLocale(),
        ]);
    }

    /**
     * Show the form for editing the specified campus.
     */
    public function edit(Campus $campus)
    {
        $campus->load('school');
        $schools = School::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Campuses/Edit', [
            'campus' => $campus,
            'schools' => $schools,
            'isSuperLibrarian' => auth()->user()?->hasRole('super-librarian') ?? false,
            'lang' => app()->getLocale(),
        ]);
    }

    /**
     * Update the specified campus.
     */
    public function update(CampusRequest $request, Campus $campus)
    {
        $campus->update($request->validated());

        return Redirect::route('campuses.index')
            ->with('flash', ['message' => 'Campus updated successfully.', 'type' => 'success']);
    }

    /**
     * Remove the specified campus.
     */
    public function destroy(Campus $campus)
    {
        $campus->delete();

        return Redirect::route('campuses.index')
            ->with('flash', ['message' => 'Campus deleted successfully.', 'type' => 'success']);
    }

    /**
     * Export campuses as CSV.
     */
    public function export()
    {
        $csv = (new \App\Exports\CampusExport())->toCsvString();
        $filename = 'campuses_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Import campuses from a CSV file.
     */
    public function import(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        try {
            $result = (new \App\Imports\CampusImport())->importFromPath(
                $validated['import_file']->getRealPath()
            );

            $message = "Import complete. Created: {$result['created']}, Updated: {$result['updated']}, Failed: {$result['failed']}.";

            if ($result['failed'] > 0) {
                $sampleErrors = implode(' | ', array_slice($result['errors'], 0, 3));

                return Redirect::route('campuses.index')->with('flash', [
                    'error' => $message.' '.$sampleErrors,
                    'type' => 'error',
                ]);
            }

            return Redirect::route('campuses.index')->with('flash', [
                'message' => $message,
                'type' => 'success',
            ]);
        } catch (\Exception $e) {
            return Redirect::route('campuses.index')->with('flash', [
                'error' => 'Import failed: '.$e->getMessage(),
                'type' => 'error',
            ]);
        }
    }
}
