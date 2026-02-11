<?php

namespace Database\Factories;

use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BookFactory extends Factory
{
    protected $model = Book::class;

    public function definition(): array
    {
        $i = $this->faker->unique()->numberBetween(1, 10000);
        $isKhmer = $this->faker->boolean;
        $isCambodia = $this->faker->boolean;

        return [
            'title' => $isKhmer ? "សៀវភៅគំរូ $i ជាភាសាខ្មែរ" : "Sample Book Title $i in English",
            'description' => "This is a sample description for book $i.",
            'page_count' => $this->faker->numberBetween(100, 500),
            'publisher' => 'Default Publisher',
            'published_at' => $this->faker->numberBetween(1990, 2023),
            'language' => $isKhmer ? 'kh' : 'en',
            'program' => $isCambodia ? 'Cambodia' : 'American',
            'cover' => 'https://images.unsplash.com/photo-1718358344038-1ad1c32e5812?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'pdf_url' => null,
            'flip_link' => null,
            'view' => $this->faker->numberBetween(0, 1000),
            'is_available' => 1,
            'author' => 'Author '.$i,
            'code' => strtoupper(Str::random(8)),
            'isbn' => str_pad((string) (1000000000000 + $i), 13, '0', STR_PAD_LEFT),
            'type' => $this->faker->randomElement(['physical', 'ebook']),
            'downloadable' => 0,
            // 'user_id', 'category_id', 'campus_id', 'bookcase_id', 'shelf_id' should be set in seeder for relational integrity
            'user_id' => null,
            'category_id' => null,
            'campus_id' => null,
            'bookcase_id' => null,
            'shelf_id' => null,
        ];
    }
}
