<?php

use App\Http\Controllers\BookcaseController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\BookLoanController;
use App\Http\Controllers\BookLoanRequestController;
use App\Http\Controllers\CampusController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\ShelvesController;
use App\Http\Controllers\SubCategoryController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/library-type-dashboard', [HomeController::class, 'libraryTypeDashboard'])
    ->name('library-type-dashboard');
Route::get('admin/dashboard', [DashboardController::class, 'index'])->name('dashboard')->middleware();

// -----Admin------
Route::middleware(['auth', 'role:staff|admin'])
    ->prefix('admin/library')
    ->group(function () {
        // Books import/export
        Route::get('books/export', [BookController::class, 'export'])->name('books.export');
        Route::post('books/import', [BookController::class, 'import'])->name('books.import');

        // Bookcases import/export
        Route::get('bookcases/export', [BookcaseController::class, 'export'])->name('bookcases.export');
        Route::post('bookcases/import', [BookcaseController::class, 'import'])->name('bookcases.import');

        // Categories import/export
        Route::get('categories/export', [CategoryController::class, 'export'])->name('categories.export');
        Route::post('categories/import', [CategoryController::class, 'import'])->name('categories.import');

        // SubCategories import/export
        Route::get('subcategories/export', [SubCategoryController::class, 'export'])->name('subcategories.export');
        Route::post('subcategories/import', [SubCategoryController::class, 'import'])->name('subcategories.import');

        // Shelves import/export
        Route::get('shelves/export', [ShelvesController::class, 'export'])->name('shelves.export');
        Route::post('shelves/import', [ShelvesController::class, 'import'])->name('shelves.import');

        // Campuses import/export
        Route::get('campuses/export', [CampusController::class, 'export'])->name('campuses.export');
        Route::post('campuses/import', [CampusController::class, 'import'])->name('campuses.import');

        // BookLoans import/export
        Route::get('bookloans/export', [BookLoanController::class, 'export'])->name('bookloans.export');
        Route::post('bookloans/import', [BookLoanController::class, 'import'])->name('bookloans.import');
        Route::patch('loan-requests/{loanRequest}/decision', [BookLoanRequestController::class, 'decide'])
            ->name('bookloans.requests.decide');

        Route::resources([
            'books' => BookController::class,
            'bookcases' => BookcaseController::class,
            'bookloans' => BookLoanController::class,
            'shelves' => ShelvesController::class,
            'categories' => CategoryController::class,
            'subcategories' => SubCategoryController::class,
            'users' => UserController::class,
            'roles' => RoleController::class,
            'permissions' => PermissionController::class,
            'campuses' => CampusController::class,
            'schools' => SchoolController::class,
        ]);
        // Restore soft-deleted books
        Route::post('books/{book}/restore', [BookController::class, 'restore'])->name('books.restore');
    });

// -----Library------

// Global Physical Library
Route::get('/global/library', [LibraryController::class, 'globalLibrary'])
    ->middleware('auth')
    ->name('global library');

// Local Physical Library
Route::get('/local/library', [LibraryController::class, 'localLibrary'])
    ->middleware('auth')
    ->name('local library');

// Global eBook Library
Route::get('/e-library', [LibraryController::class, 'globalEbooks'])
    ->middleware('auth')
    ->name('global e-library');

// Show Library (Single Book View)
Route::get('/library/{book}', [LibraryController::class, 'show'])
    ->middleware([
        'auth',
        // 'throttle:20,2',
    ])
    ->name('library.show');

Route::post('/library/{book}/loan-requests', [BookLoanRequestController::class, 'store'])
    ->middleware('auth')
    ->name('library.loan-requests.store');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
