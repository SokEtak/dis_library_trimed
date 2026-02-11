<?php

namespace Database\Factories;

use App\Models\Campus;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

class CampusFactory extends Factory
{
    protected $model = Campus::class;

    public function definition()
    {
        return [
            'school_id' => School::factory(),
            'name' => $this->faker->company.' Campus',
            'code' => $this->faker->unique()->bothify('CMP-###'),
            'address' => $this->faker->address(),
            'contact' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'website' => $this->faker->url(),
        ];
    }
}
