<?php

namespace Database\Seeders;

use App\Models\Bookcase;
use App\Models\Shelf;
use Illuminate\Database\Seeder;

class ShelfSeeder extends Seeder
{
    public function run(): void
    {
        $bookcases = Bookcase::all();

        foreach ($bookcases as $bookcase) {
            for ($i = 1; $i <= 5; $i++) {
                Shelf::create([
                    'code' => $bookcase->code.$i, // A1, A2, ...
                    'bookcase_id' => $bookcase->id,
                    'campus_id' => $bookcase->campus_id,
                ]);
            }
        }
    }
}
