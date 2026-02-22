<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SubCategoryController extends Controller
{
    public function index()
    {
        $subcategories = SubCategory::with('category:id,name')->latest()->get();
        $categories = Category::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('SubCategories/Index', [
            'subcategories' => $subcategories,
            'categories' => $categories,
            'flash' => [
                'message' => session('flash.message') ?? session('message'),
                'error' => session('flash.error'),
            ],
        ]);
    }

    public function show(Request $request, SubCategory $subcategory)
    {
        $subcategory->load('category:id,name');

        if ($request->expectsJson()) {
            return response()->json([
                'data' => $subcategory,
            ]);
        }

        return redirect()->route('subcategories.index', [
            'dialog' => 'view',
            'id' => $subcategory->id,
        ]);
    }

    public function create()
    {
        return redirect()->route('subcategories.index', ['dialog' => 'create']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('sub_categories', 'name')],
            'category_id' => ['required', 'exists:categories,id'],
        ]);

        $subcategory = SubCategory::create($validated)->load('category:id,name');
        $message = 'Subcategory created successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'data' => $subcategory,
            ], 201);
        }

        return redirect()->route('subcategories.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    public function edit(SubCategory $subcategory)
    {
        return redirect()->route('subcategories.index', [
            'dialog' => 'edit',
            'id' => $subcategory->id,
        ]);
    }

    public function update(Request $request, SubCategory $subcategory)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('sub_categories', 'name')->ignore($subcategory->id),
            ],
            'category_id' => ['required', 'exists:categories,id'],
        ]);

        $subcategory->update($validated);
        $subcategory->load('category:id,name');
        $message = 'Subcategory updated successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'data' => $subcategory,
            ]);
        }

        return redirect()->route('subcategories.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    public function destroy(Request $request, SubCategory $subcategory)
    {
        if ($subcategory->books()->exists()) {
            $message = 'Cannot delete subcategory because it is referenced by books.';

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                ], 422);
            }

            return redirect()->route('subcategories.index')->with('flash', [
                'error' => $message,
                'type' => 'error',
            ]);
        }

        $subcategory->delete();
        $message = 'Subcategory deleted successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
            ]);
        }

        return redirect()->route('subcategories.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    /**
     * Export subcategories as CSV.
     */
    public function export()
    {
        $csv = (new \App\Exports\SubCategoryExport())->toCsvString();
        $filename = 'subcategories_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Import subcategories from a CSV file.
     */
    public function import(Request $request)
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        try {
            $result = (new \App\Imports\SubCategoryImport())->importFromPath(
                $validated['import_file']->getRealPath()
            );

            $message = "Import complete. Created: {$result['created']}, Updated: {$result['updated']}, Failed: {$result['failed']}.";

            if ($result['failed'] > 0) {
                $sampleErrors = implode(' | ', array_slice($result['errors'], 0, 3));

                return redirect()->route('subcategories.index')->with('flash', [
                    'error' => $message.' '.$sampleErrors,
                ]);
            }

            return redirect()->route('subcategories.index')->with('flash', [
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return redirect()->route('subcategories.index')->with('flash', [
                'error' => 'Import failed: '.$e->getMessage(),
            ]);
        }
    }
}

