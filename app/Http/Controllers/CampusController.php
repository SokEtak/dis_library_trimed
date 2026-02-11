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
}
