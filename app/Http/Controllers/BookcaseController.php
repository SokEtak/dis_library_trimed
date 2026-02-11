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

        // dd( $bookcases->toArray() );
        return Inertia::render('Bookcases/Index', [
            'bookcases' => $bookcases,
        ]);
    }

    /**
     * Show the form for creating a new bookcase.
     */
    public function create()
    {
        return Inertia::render('Bookcases/Create');
    }

    /**
     * Store a newly created bookcase.
     */
    public function store(StoreBookcaseRequest $request): RedirectResponse
    {
        Bookcase::create($request->validated() + ['campus_id' => Auth::user()->campus_id]);

        return redirect()->route('bookcases.index')->with('message', 'Bookcase created successfully.');
    }

    /**
     * Display the specified bookcase.
     */
    public function show(Bookcase $bookcase)
    {

        $bookcase = Bookcase::forCurrentCampusWithBooks()->findOrFail($bookcase->id);

        return Inertia::render('Bookcases/Show', [
            'bookcase' => $bookcase,
            'flash' => ['message' => session('message')],
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

        return Inertia::render('Bookcases/Edit', [
            'bookcase' => $bookcase,
            'flash' => ['message' => session('message')],
        ]);
    }

    /**
     * Update the specified bookcase.
     */
    public function update(Request $request, Bookcase $bookcase): RedirectResponse
    {
        $bookcase->update($request->validate([
            'code' => 'required|string|max:255',
        ]));

        return redirect()->route('bookcases.index')->with('message', 'Bookcase updated successfully.');
    }
}
