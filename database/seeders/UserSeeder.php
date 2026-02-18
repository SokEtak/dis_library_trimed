<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {   
        $admin=User::create([
            'name' => 'Sok Etak',
            'email' => 'soketak@diu.edu.kh',
            'password' => bcrypt('168916891689'),
            'campus_id' => 1,

        ]);
        $admin->assignRole('admin');
        // User::factory()->count(10)->create();
    }
}
