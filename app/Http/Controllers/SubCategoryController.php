<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubCategoryController extends Controller
{
    public function index()
    {
        $subcategories = SubCategory::with('category:id,name')->get();

        return Inertia::render('SubCategories/Index', [
            'subcategories' => $subcategories,
            'flash' => ['message' => session('message')],
        ]);
    }

    public function show(SubCategory $subcategory)
    {
        return Inertia::render('SubCategories/Show', [
            'subcategory' => $subcategory->load('category:id,name'),
            'flash' => ['message' => session('message')],
        ]);
    }

    public function create()
    {
        $categories = Category::select('id', 'name')->get();

        return Inertia::render('SubCategories/Create', [
            'categories' => $categories,
            'flash' => ['message' => session('message')],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:sub_categories,name',
            'category_id' => 'required|exists:categories,id',
        ]);
        SubCategory::create($validated);

        return redirect()->route('subcategories.index')->with('message', 'Subcategory created successfully.');
    }

    public function edit(SubCategory $subcategory)
    {
        $categories = Category::select('id', 'name')->get();

        return Inertia::render('SubCategories/Edit', [
            'subcategory' => $subcategory->load('category:id,name'),
            'categories' => $categories,
            'flash' => ['message' => session('message')],
        ]);
    }

    public function update(Request $request, SubCategory $subcategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ]);

        $subcategory->update($validated);

        return redirect()->route('subcategories.index')->with('message', 'Subcategory updated successfully.');
    }

    public function destroy(SubCategory $subcategory)
    {
        // Check for related records in the books table using the correct foreign key
        if ($subcategory->books()->where('subcategory_id', $subcategory->id)->exists()) {
            return redirect()->route('subcategories.index')->with('message', 'Cannot delete subcategory because it is referenced by books.');
        }

        $subcategory->delete();

        return redirect()->route('subcategories.index')->with('message', 'Subcategory deleted successfully.');
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
