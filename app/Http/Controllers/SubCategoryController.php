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
}
