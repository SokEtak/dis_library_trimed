<?php

namespace Database\Factories;

use App\Models\BookLoan;
use App\Models\Book;
use App\Models\User;
use App\Models\Campus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class BookLoanFactory extends Factory
{
    protected $model = BookLoan::class;

    public function definition(): array
    {
        // Pick random related IDs from existing records
        $bookId = Book::inRandomOrder()->value('id');
        // Ensure we pick a random user that is NOT the first user (usually admin)
        $firstUserId = User::orderBy('id')->value('id');
        $userId = User::where('id', '!=', $firstUserId)->inRandomOrder()->value('id') ?? $firstUserId;
        $campusId = Campus::inRandomOrder()->value('id');

        $loanDate = $this->faker->dateTimeBetween('-60 days', 'now');
        $dueDate = (clone $loanDate)->modify('+'. $this->faker->numberBetween(7, 30) .' days');
        // Use statuses that match the migration enum: processing, returned, canceled
        $status = $this->faker->randomElement(['processing', 'returned', 'canceled']);

        return [
            'book_id' => $bookId,
            'user_id' => $userId,
            'campus_id' => $campusId,
            'status' => $status,
            'return_date' => Carbon::instance($dueDate)->toDateString(),
            'returned_at' => $status === 'returned' ? Carbon::instance($dueDate)->subDays($this->faker->numberBetween(0, 7))->toDateTimeString() : null,
            'is_deleted' => false,
        ];
    }
}
