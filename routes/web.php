<?php

use App\Http\Controllers\BookcaseController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\BookLoanController;
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
        'throttle:20,2',
    ])
    ->name('library.show');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
