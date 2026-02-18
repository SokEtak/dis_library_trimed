<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::all();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'flash' => ['message' => session('message')],
        ]);
    }

    public function create()
    {
        return Inertia::render('Categories/Create', [
            'flash' => ['message' => session('message')],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:categories,name',
        ]);

        Category::create($validated);

        return redirect()->route('categories.index')->with('message', 'Category created successfully.');
    }

    public function edit(Category $category)
    {
        return Inertia::render('Categories/Edit', [
            'category' => $category,
            'flash' => ['message' => session('message')],
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category->update($validated);

        return redirect()->route('categories.index')->with('message', 'Category updated successfully.');
    }

    public function show(Category $category)
    {
        return Inertia::render('Categories/Show', [
            'category' => $category,
            'flash' => ['message' => session('message')],
        ]);
    }

    public function destroy(Category $category)
    {
        // Optional: Check for related books to prevent deletion if referenced
        // for safety delete
        if ($category->books()->exists()) {
            return redirect()->route('categories.index')->with('message', 'Cannot delete category because it is referenced by books.');
        }

        $category->delete();

        return redirect()->route('categories.index')->with('message', 'Category deleted successfully.');
    }

    /**
     * Export categories as CSV.
     */
    public function export()
    {
        $csv = (new \App\Exports\CategoryExport())->toCsvString();
        $filename = 'categories_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Import categories from a CSV file.
     */
    public function import(Request $request)
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        try {
            $result = (new \App\Imports\CategoryImport())->importFromPath(
                $validated['import_file']->getRealPath()
            );

            $message = "Import complete. Created: {$result['created']}, Updated: {$result['updated']}, Failed: {$result['failed']}.";

            if ($result['failed'] > 0) {
                $sampleErrors = implode(' | ', array_slice($result['errors'], 0, 3));

                return redirect()->route('categories.index')->with('flash', [
                    'error' => $message.' '.$sampleErrors,
                ]);
            }

            return redirect()->route('categories.index')->with('flash', [
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return redirect()->route('categories.index')->with('flash', [
                'error' => 'Import failed: '.$e->getMessage(),
            ]);
        }
    }
}
