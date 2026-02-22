<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::query()->latest()->get();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'flash' => [
                'message' => session('flash.message') ?? session('message'),
                'error' => session('flash.error'),
            ],
        ]);
    }

    public function create()
    {
        return redirect()->route('categories.index', ['dialog' => 'create']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('categories', 'name')],
        ]);

        $category = Category::create($validated);
        $message = 'Category created successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'data' => $category,
            ], 201);
        }

        return redirect()->route('categories.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    public function edit(Category $category)
    {
        return redirect()->route('categories.index', [
            'dialog' => 'edit',
            'id' => $category->id,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
        ]);

        $category->update($validated);
        $message = 'Category updated successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'data' => $category->fresh(),
            ]);
        }

        return redirect()->route('categories.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
    }

    public function show(Request $request, Category $category)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'data' => $category,
            ]);
        }

        return redirect()->route('categories.index', [
            'dialog' => 'view',
            'id' => $category->id,
        ]);
    }

    public function destroy(Request $request, Category $category)
    {
        if ($category->books()->exists()) {
            $message = 'Cannot delete category because it is referenced by books.';

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                ], 422);
            }

            return redirect()->route('categories.index')->with('flash', [
                'error' => $message,
                'type' => 'error',
            ]);
        }

        $category->delete();
        $message = 'Category deleted successfully.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
            ]);
        }

        return redirect()->route('categories.index')->with('flash', [
            'message' => $message,
            'type' => 'success',
        ]);
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

