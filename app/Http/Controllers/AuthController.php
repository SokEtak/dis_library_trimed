<?php

namespace App\Http\Controllers;

use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function googleRedirect()
    {
        return Socialite::driver('google')
            ->scopes(['openid', 'email', 'profile'])
            ->redirect();
    }

    /**
     * Handle the callback from Google authentication.
     */
    public function googleCallback()
    {
        // ⚠️ WARNING: Remove setHttpClient and the Guzzle import for production
        $googleUser = Socialite::driver('google')
            ->stateless()
            ->setHttpClient(new Client(['verify' => false]))
            ->user();

        $email = $googleUser->getEmail();

        // Check if email domain matches @diu.edu.kh
        if (! $email || ! str_ends_with($email, '@diu.edu.kh')) {
            return response('⚠️ Danger: Only @diu.edu.kh emails are allowed!', 403);
        }

        // Update or create user with Spatie pms assignment
        $user = User::updateOrCreate(
            ['google_id' => $googleUser->getId()],
            [
                'name' => $googleUser->getName(),
                'email' => $email,
                'avatar' => $googleUser->getAvatar(),
                'password' => Hash::make(Str::random(24)),
                'campus_id' => 1,
            ]
        );

        // Assign 'regular-user' pms if no roles are assigned
        if (! $user->hasAnyRole(['regular-user', 'staff', 'admin'])) {
            $user->assignRole('regular-user');
        }

        Auth::login($user);

        return redirect()->route('home');
    }

    /**
     * Redirect the user to the Facebook authentication page.
     */
    //    public function facebookRedirect()
    //    {
    //        return Socialite::driver('facebook')
    //            ->scopes(['email'])
    //            ->redirect();
    //    }
    //
    //    /**
    //     * Handle the callback from Facebook authentication.
    //     */
    //    public function facebookCallback()
    //    {
    //        // ⚠️ WARNING: Remove setHttpClient and the Guzzle import for production
    //        $facebookUser = Socialite::driver('facebook')
    //            ->stateless()
    //            ->setHttpClient(new Client(['verify' => false]))
    //            ->user();
    //
    //        // Handle missing email
    //        $email = $facebookUser->getEmail() ?? $facebookUser->getId().'@facebook.local';
    //
    //        // Find or create local user
    //        $user = User::updateOrCreate(
    //            ['facebook_id' => $facebookUser->getId()],
    //            [
    //                'name' => $facebookUser->getName(),
    //                'email' => $email,
    //                'avatar' => $facebookUser->getAvatar(),
    //                'password' => Hash::make(Str::random(24)),
    //            ]
    //        );
    //
    //        Auth::login($user);
    //
    //        return redirect()->route('home')->with('success', 'Welcome '.$user->name.'!');
    //    }
    //
    //    /**
    //     * Redirect the user to GitHub authentication page.
    //     */
    //    public function githubRedirect()
    //    {
    //        return Socialite::driver('github')->redirect();
    //    }
    //
    //    /**
    //     * Handle callback from GitHub.
    //     */
    //    public function githubCallback()
    //    {
    //        $githubUser = Socialite::driver('github')
    //            ->stateless()
    //            ->setHttpClient(new Client(['verify' => false]))
    //            ->user();
    //
    //        $email = $githubUser->getEmail() ?? ($githubUser->getId() . '@github.local');
    //
    //        // 1️⃣ Check if user already exists by email
    //        $existingUser = User::where('email', $email)->first();
    //
    //        if ($existingUser) {
    //            // Attach github_id if missing
    //            if (!$existingUser->github_id) {
    //                $existingUser->github_id = $githubUser->getId();
    //                $existingUser->save();
    //            }
    //
    //            // Ensure role
    //            if (!$existingUser->hasAnyRole(['regular-user', 'staff', 'admin'])) {
    //                $existingUser->assignRole('regular-user');
    //            }
    //
    //            Auth::login($existingUser);
    //            return redirect()->route('home')->with('success', 'Welcome back '.$existingUser->name.'!');
    //        }
    //
    //        // 2️⃣ No existing email — create new user
    //        $user = User::create([
    //            'name' => $githubUser->getName() ?? $githubUser->getNickname(),
    //            'email' => $email,
    //            'avatar' => $githubUser->getAvatar(),
    //            'password' => Hash::make(Str::random(24)),
    //            'campus_id' => 1,
    //            'github_id' => $githubUser->getId(),
    //        ]);
    //
    //        // Assign role if no roles exist yet
    //        if (!$user->hasAnyRole(['regular-user', 'staff', 'admin'])) {
    //            $user->assignRole('regular-user');
    //        }
    //
    //        Auth::login($user);
    //
    //        return redirect()->route('home')->with('success', 'Welcome '.$user->name.'!');
    //    }
}
