<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetTransaction;
use App\Models\Book;
use App\Models\Bookcase;
use App\Models\BookLoan;
// use App\Models\Building;
use App\Models\Campus;
use App\Models\Category;
// use App\Models\Department;
// use App\Models\Room;
use App\Models\School;
use App\Models\Shelf;
use App\Models\Subcategory;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        if (! Auth::user()->hasAnyRole(['staff', 'admin'])) {
            abort(403);
        }

        return $this->index($request);
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        //        $isAdmin  = $user->hasRole('admin');
        $campusId = $user->campus_id;
        // ===================================================================
        // 1. BOOK STATS
        // ===================================================================
        $booksQuery = Book::where('is_deleted', 0)
            ->when($campusId, fn ($q) => $q->where('campus_id', $campusId));

        $ebookCount = (clone $booksQuery)->where('type', 'ebook')->count();
        $physicalBookCount = (clone $booksQuery)->where('type', 'physical')->count();
        $trashBookCount = Book::where('is_deleted', true)
            ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
            ->count();

        $today = now()->timezone('Asia/Phnom_Penh')->toDateString();

        $missingBookCount = BookLoan::where('is_deleted', 0)
            ->where('status', 'processing') // still borrowed
            ->whereDate('return_date', '<', $today) // overdue = missing
            ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
            ->count();

        $categoryCount = Category::count();
        $subcategoryCount = Subcategory::count();

        // ===================================================================
        // 2. LOAN STATS
        // ===================================================================

        // Active loans (return date >= today)
        $bookLoansCount = BookLoan::where('is_deleted', 0)
            ->where('return_date', '>=', $today)
            ->where('status', 'processing')
            ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
            ->count();

        // Overdue loans
        $overdueLoansCount = BookLoan::where('is_deleted', 0)
            ->where('return_date', '<', $today)
            ->where('status', 'processing')
            ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
            ->count();
        // ===================================================================
        // 3. OTHER STATS
        // ===================================================================
        // fix it or add new field into the migration file
        // $totalAssets = Asset::count();

        // $totalAssetCategory = \App\Models\AssetCategory::count();
        // $totalAssetSubCategory = \App\Models\AssetSubCategory::count();

        // $totalRooms = Room::count();
        // $totalSchools = School::count();

        // additional counts used by dashboard UI
        $bookcaseCount = Bookcase::when($campusId, fn ($q) => $q->where('campus_id', $campusId))->count();
        $shelfCount = Shelf::when($campusId, fn ($q) => $q->where('campus_id', $campusId))->count();
        // $assetCategoryCount = AssetCategory::count();
        // $assetTransactionCount = AssetTransaction::count();
        // $supplierCount = Supplier::count();
        $roleCount = Role::count();
        $permissionCount = Permission::count();
        $campusCount = Campus::count();
        // $buildingCount = Building::count();
        // $departmentCount = Department::count();

        // ===================================================================
        // 4. RETURN DATA TO FRONTEND
        // ===================================================================
        return Inertia::render('dashboard', [
            'bookStats' => [
                'ebookCount' => $ebookCount,
                'physicalBookCount' => $physicalBookCount,
                'missingBookCount' => $missingBookCount,
                'trashBookCount' => $trashBookCount,
                'bookLoansCount' => $bookLoansCount,
                'overdueLoansCount' => $overdueLoansCount,
            ],

            // 'assetStats' => [
            //     'totalAssets' => $totalAssets,
            // ],

            // 'schoolStats' => [
            //     'totalSchools' => $totalSchools,
            //     'totalRooms' => $totalRooms,
            // ],

            'userStats' => [
                'totalUsers' => User::count(),
            ],

            'extraStats' => [
                'categoryCount' => $categoryCount,
                'subcategoryCount' => $subcategoryCount,
                'bookcaseCount' => $bookcaseCount,
                'shelfCount' => $shelfCount,
                // 'assetCategoryCount' => $assetCategoryCount,
                // 'assetTransactionCount' => $assetTransactionCount,
                // 'supplierCount' => $supplierCount,
                'roleCount' => $roleCount,
                'permissionCount' => $permissionCount,
                'campusCount' => $campusCount,
                // 'buildingCount' => $buildingCount,
                // 'departmentCount' => $departmentCount,
            ],
        ]);
    }
}
