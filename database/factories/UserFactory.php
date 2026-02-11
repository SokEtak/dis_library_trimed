<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'campus_id' => 1,
            'avatar' => fake()->imageUrl(width: 400, height: 400, category: 'people', randomize: true, word: 'user'),
            'isVerified' => rand(0, 1) ? true : false,
            'isActive' => true,
        ];
    }

    /**
     * Assign a random role after creating a user.
     */
    public function configure()
    {
        return $this->afterCreating(function ($user) {
            $roles = ['regular-user'];
            $role = $roles[array_rand($roles)];
            $user->assignRole($role);
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
