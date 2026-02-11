<?php

namespace Database\Seeders;

use App\Models\Grade;
use Illuminate\Database\Seeder;

class GradeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Grade::create(['name' => '1']);
        Grade::create(['name' => '2']);
        Grade::create(['name' => '3']);
        Grade::create(['name' => '4']);
        Grade::create(['name' => '5']);
        Grade::create(['name' => '6']);
        Grade::create(['name' => '7']);
        Grade::create(['name' => '8']);
        Grade::create(['name' => '9']);
        Grade::create(['name' => '10']);
        Grade::create(['name' => '11']);
        Grade::create(['name' => '12']);
    
    }
}
