<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {   
        //repalce with your level subjects(Math,...)
        $subjects = [
            'គណិតវិទ្យា',
            'ភាសាខ្មែរ',
            'ភាសាអង់គ្លេស',
            'វិទ្យាសាស្ត្រ',
            'សង្គមវិទ្យា',
            'កីឡា',
            'រូបវិទ្យា',
            'ជីវវិទ្យា',
            'ភាសាបារាំង',
            'ផែនដីវិទ្យា',   
            'សីលធម៌-ពលរដ្ធ',      
        ];

        foreach ($subjects as $subject) {
            Subject::create([
                'name' => $subject,
            ]);
        }
    }
}
