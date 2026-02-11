<?php

namespace Database\Factories;

use App\Models\Bookcase;
use App\Models\Campus;
use App\Models\Shelf;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShelfFactory extends Factory
{
    protected $model = Shelf::class;

    public function definition()
    {
        return [
            'code' => $this->faker->unique()->bothify('SH-###'),
            'campus_id' => Campus::factory(),
            'bookcase_id' => Bookcase::factory(),
        ];
    }
}
