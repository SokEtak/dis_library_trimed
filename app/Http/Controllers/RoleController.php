<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')
            ->select('id', 'name')
            ->withCount('permissions')
            ->get();
        //        dd($roles->toArray());

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian') ?? false,
        ]);
    }

    public function create()
    {
        return Inertia::render('Roles/Create', [
            'permissions' => Permission::all(),
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian') ?? false,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create(['name' => $validated['name']]);
        $role->syncPermissions($validated['permissions'] ?? []);

        return redirect()->route('roles.index')
            ->with('success', 'Role created successfully.');
    }

    public function show(Role $role)
    {
        //        dd($role->toArray());
        return Inertia::render('Roles/Show', [
            'role' => $role->load('permissions:id,name'),
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian') ?? false,
        ]);
    }

    public function edit(Role $role)
    {
        return Inertia::render('Roles/Edit', [
            'role' => $role->load('permissions:id,name'),
            'permissions' => Permission::all(),
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian') ?? false,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|unique:roles,name,'.$role->id,
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->update([
            'name' => $validated['name'],
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        return redirect()->route('roles.index')
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
