<?php

namespace Database\Factories;

use App\Models\Bookcase;
use App\Models\Campus;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookcaseFactory extends Factory
{
    protected $model = Bookcase::class;

    public function definition()
    {
        return [
            'code' => $this->faker->unique()->bothify('BC-###'),
            'campus_id' => Campus::factory(),
        ];
    }
}
