<?php

// app/Http/Controllers/SchoolController.php

namespace App\Http\Controllers;

use App\Http\Requests\School\StoreSchoolRequest;
use App\Http\Requests\School\UpdateSchoolRequest;
use App\Models\School;
use Inertia\Inertia;

class SchoolController extends Controller
{
    public function index()
    {
        $schools = School::select('id', 'name', 'code', 'email', 'contact', 'address', 'website')
            ->orderBy('name')
            ->paginate(10);

        return Inertia::render('Schools/Index', [
            'schools' => $schools,
            'flash' => session('flash'),
            'isSuperLibrarian' => auth()->user()?->hasRole('super-librarian') ?? false,
            'lang' => app()->getLocale(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Schools/Create', [
            'isSuperLibrarian' => auth()->user()?->hasRole('super-librarian') ?? false,
            'lang' => app()->getLocale(),
        ]);
    }

    public function store(StoreSchoolRequest $request)
    {
        School::create($request->validated());

        return redirect()->route('schools.index')
            ->with('flash', ['message' => 'School created successfully.', 'type' => 'success']);
    }

    public function show(School $school)
    {
        return Inertia::render('Schools/Show', [
            'school' => $school,
            'isSuperLibrarian' => auth()->user()?->hasRole('super-librarian') ?? false,
            'lang' => app()->getLocale(),
        ]);
    }

    public function edit(School $school)
    {
        return Inertia::render('Schools/Edit', [
            'school' => $school,
            'isSuperLibrarian' => auth()->user()?->hasRole('super-librarian') ?? false,
            'lang' => app()->getLocale(),
        ]);
    }

    public function update(UpdateSchoolRequest $request, School $school)
    {
        $school->update($request->validated());

        return redirect()->route('schools.index')
            ->with('flash', ['message' => 'School updated successfully.', 'type' => 'success']);
    }

    public function destroy(School $school)
    {
        $school->delete();

        return redirect()->route('schools.index')
            ->with('flash', ['message' => 'School deleted successfully.', 'type' => 'success']);
    }
}
