<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\User;
use Inertia\Inertia;

class HomeController extends Controller
{
    /**
     * Display the main application dashboard (Index/Welcome page).
     */
    public function index()
    {
        // Fetch counts from the database
        $bookCount = Book::where([
            'is_deleted' => '0',
            'type' => 'physical',
        ])->count();

        $ebookCount = Book::where([
            'is_deleted' => '0',
            'type' => 'ebook',
        ])->count();

        $userCount = User::where([
            'isActive' => '1',
        ])->count();

        // Render the Inertia component with data
        return Inertia::render('welcome', [
            'bookCount' => $bookCount,
            'ebookCount' => $ebookCount,
            'userCount' => $userCount,
        ]);
    }

    /**
     * Render the library type dashboard.
     */
    public function libraryTypeDashboard()
    {
        return Inertia::render('Client/Library/DashboardType');
    }
}
