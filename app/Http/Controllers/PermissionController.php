<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index()
    {
        $permissions = Permission::select('id', 'name')
            ->paginate(10);

        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian') ?? false,
        ]);
    }

    public function create()
    {
        return Inertia::render('Permissions/Create', [
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian') ?? false,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|unique:permissions,name',
        ]);

        Permission::create(['name' => $validated['name']]);

        return redirect()->route('permissions.index')
            ->with('success', 'Permissions created successfully.');
    }

    public function show(Permission $permission)
    {
        return Inertia::render('Permissions/Show', [
            'permission' => $permission,
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian') ?? false,
        ]);
    }

    public function edit(Permission $permission)
    {
        return Inertia::render('Permissions/Edit', [
            'permission' => $permission,
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian') ?? false,
        ]);
    }

    public function update(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => 'required|unique:permissions,name,'.$permission->id,
        ]);

        $permission->update(['name' => $validated['name']]);

        return redirect()->route('permissions.index')
            ->with('success', 'Permissions updated successfully.');
    }
}
