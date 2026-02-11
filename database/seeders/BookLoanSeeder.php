<?php

namespace Database\Seeders;

use App\Models\BookLoan;
use App\Models\Book;
use App\Models\User;
use App\Models\Campus;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Carbon\Carbon;

class BookLoanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Minimal guard: require at least one book, user and campus
        if (Book::count() === 0 || User::count() === 0 || Campus::count() === 0) {
            return;
        }

        // Use factory to generate loans (factory handles randomness)
        BookLoan::factory()->count(100)->create();
    }
}
