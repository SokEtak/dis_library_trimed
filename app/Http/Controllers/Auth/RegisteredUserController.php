<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        // append campus
        $campus = Campus::all(['id', 'name', 'code']);

        return Inertia::render('auth/register', ['campus' => $campus]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                'unique:'.User::class,
                function ($attribute, $value, $fail) {
                    $allowedDomain = 'diu.edu.kh';
                    if (! str_ends_with($value, '@'.$allowedDomain)) {
                        $fail("Only Dewey Organization's email addresses are allowed to register.");
                    }
                },
            ],
            'campus_id' => 'required|exists:campuses,id',
            'code' => 'required|exists:campuses,code',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // Max 5MB
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $imageUrl = null;
        if ($request->hasFile('avatar')) {
            try {
                // Store the file and get the relative path
                $imagePath = $request->file('avatar')->store('avatars', 'public');

                // Set visibility to public
                Storage::disk('public')->setVisibility($imagePath, 'public');

                // Generate the full URL
                $imageUrl = Storage::disk('public')->url($imagePath);

            } catch (\Exception $e) {
                \Log::error('Failed to upload avatar to R2: '.$e->getMessage());

                return back()->withErrors(['avatar' => 'Failed to upload avatar. Please try again later.']);
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'avatar' => $imageUrl, // Store the full URL
            'campus_id' => $request->campus_id,
        ]);

        $user->assignRole('regular-user'); // Assign the pms

        event(new Registered($user));

        Auth::login($user);

        return redirect()->intended(route('home', absolute: false));
    }
}
