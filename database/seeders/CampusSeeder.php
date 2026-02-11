<?php

namespace Database\Seeders;

use App\Models\Campus;
use App\Models\School;
use Illuminate\Database\Seeder;

class CampusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure there's at least one school for campuses to belong to
        $school = School::first() ?? School::create([
            'name' => 'Default School',
            'code' => 'DEFSC',
        ]);

        // Create a default campus if none exist
        Campus::first() || Campus::create([
            'school_id' => $school->id,
            'name' => 'DIU',
            'code' => 'diu',
            'address' => '123 Main St',
            'contact' => null,
            'email' => null,
            'website' => null,
        ]);
    }
}
