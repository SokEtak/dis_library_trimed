<?php

namespace Database\Seeders;

use App\Models\Bookcase;
use Illuminate\Database\Seeder;

class BookcaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (range('A', 'G') as $name) {
            Bookcase::create([
                'code' => $name,
                'campus_id' => 1,
            ]);
        }
    }
}
