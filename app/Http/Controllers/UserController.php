<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\Campus;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        $users = User::active()
            ->with(['campus', 'roles'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at,
                    'avatar' => $user->avatar,
                    'campus' => $user->campus ? ['id' => $user->campus->id, 'name' => $user->campus->name] : null,
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                    'isVerified' => $user->isVerified,
                    'isActive' => $user->isActive,
                ];
            });

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => Role::all()->pluck('name')->toArray(),
            'permissions' => Permission::all()->pluck('name')->toArray(),
            'campuses' => array_merge(Campus::all()->pluck('name')->toArray(), ['None']),
            'flash' => session()->get('flash'),
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian'),
            'lang' => app()->getLocale(),
        ]);
    }

    public function show(string $identifier)
    {
        $user = User::where('id', $identifier)
            ->orWhere('name', $identifier)
            ->firstOrFail();

        if (! $user->isActive) {
            abort(404);
        }

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'created_at' => $user->created_at,
            'avatar' => $user->avatar,
            'campus' => $user->campus ? ['id' => $user->campus->id, 'name' => $user->campus->name] : null,
            'roles' => $user->roles->pluck('name')->toArray(),
            'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
            'isVerified' => $user->isVerified,
            'isActive' => $user->isActive,
        ];

        return Inertia::render('Users/Show', [
            'user' => $userData,
            'flash' => session()->get('flash'),
            'isSuperLibrarian' => auth()->user()->hasRole('super-librarian'),
            'lang' => app()->getLocale(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Users/Create', [
            'roles' => Role::all()->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                ];
            })->toArray(),
            'permissions' => Permission::all()->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                ];
            })->toArray(),
            'campuses' => Campus::all()->map(function ($campus) {
                return [
                    'id' => $campus->id,
                    'name' => $campus->name,
                ];
            })->toArray(),
            'flash' => session()->get('flash'),
            'lang' => app()->getLocale(),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();
        $validated['campus_id'] = auth()->user()->campus_id; // Set campus_id to the creator's campus_id
        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $avatarPath = asset(Storage::url($path)); // includes current domain
        }
        // Create user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'avatar' => $avatarPath,
            'campus_id' => $validated['campus_id'] ?? null,
            'isVerified' => $validated['isVerified'] ?? false,
            'isActive' => $validated['isActive'] ?? true,
        ]);

        // Assign roles and permissions
        $user->syncRoles($validated['roles']);
        // $user->syncPermissions($validated['permissions']);

        return redirect()->route('users.index')->with('flash', [
            'message' => 'User created successfully.',
            'type' => 'success',
        ]);
    }

    public function edit(User $user)
    {
        if (! $user->isActive) {
            abort(404);
        }

        // Load the user's current roles and permissions
        $user->load('roles', 'permissions');

        return Inertia::render('Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'campus_id' => $user->campus_id,
                'roles' => $user->roles->pluck('name')->toArray(),
                'permissions' => $user->permissions->pluck('name')->toArray(),
                'isVerified' => $user->isVerified,
                'isActive' => $user->isActive,
            ],
            'roles' => Role::all()->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                ];
            })->toArray(),
            'permissions' => Permission::all()->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                ];
            })->toArray(),
            'campuses' => Campus::all()->map(function ($campus) {
                return [
                    'id' => $campus->id,
                    'name' => $campus->name,
                ];
            })->toArray(),
            'flash' => session()->get('flash'),
            'lang' => app()->getLocale(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {

        if (! $user->isActive) {
            abort(404);
        }

        $validated = $request->validated();

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'campus_id' => $validated['campus_id'] ?? null,
            'isVerified' => $validated['isVerified'] ?? $user->isVerified,
            'isActive' => $validated['isActive'] ?? $user->isActive,
        ];

        // Handle password update (only if a new password is provided)
        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        // Handle avatar update
        if ($request->hasFile('avatar')) {
            // Delete old avatar if it exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            // Store new avatar
            $updateData['avatar'] = $request->file('avatar')->store('avatars', 'public');
        } elseif ($request->input('remove_avatar')) {
            // Delete old avatar if it exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            // Set avatar to null
            $updateData['avatar'] = null;
        }

        // Update user
        $user->update($updateData);

        // Sync roles and permissions
        $user->syncRoles($validated['roles'] ?? []);
        $user->syncPermissions($validated['permissions'] ?? []);

        return redirect()->route('users.index')->with('flash', [
            'message' => 'User updated successfully.',
            'type' => 'success',
        ]);
    }
}
