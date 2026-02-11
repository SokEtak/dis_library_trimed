<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Campus;
use App\Models\Category;
use App\Models\Bookcase;
use App\Models\Shelf;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;

class BookSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('id', 1)->first();
        if (! $user) {
            return; // no user to attach books to
        }

        $category = Category::first() ?? Category::create(['name' => 'General']);
        $campusId = Campus::first()?->id;

        // Gather existing bookcase and shelf IDs to pick from randomly
        $bookcaseIds = Bookcase::pluck('id')->all();
        $shelfIds = Shelf::pluck('id')->all();
        $gradeIds = Grade::pluck('id')->all();
        $subjectIds = Subject::pluck('id')->all();

        // Use factory for all book creation logic
        Book::factory()
            ->count(300)
            ->make()
            ->each(function ($book) use ($user, $category, $campusId, $bookcaseIds, $shelfIds, $gradeIds, $subjectIds) {
                $book->user_id = $user->id;
                $book->category_id = $category->id;
                $book->campus_id = $campusId;
                $book->is_deleted = rand(0,1);
                

                // Only assign bookcase and shelf for physical books
                if (($book->type ?? 'physical') === 'physical') {
                    if (!empty($bookcaseIds)) {
                        $book->bookcase_id = $bookcaseIds[array_rand($bookcaseIds)];
                    } else {
                        $book->bookcase_id = null;
                    }

                    if (!empty($shelfIds)) {
                        $book->shelf_id = $shelfIds[array_rand($shelfIds)];
                    } else {
                        $book->shelf_id = null;
                    }
                } else {
                    $book->bookcase_id = null;
                    $book->shelf_id = null;
                }

                // Assign random grade and subject if available
                if (!empty($gradeIds)) {
                    $book->grade_id = $gradeIds[array_rand($gradeIds)];
                } else {
                    $book->grade_id = null;
                }

                if (!empty($subjectIds)) {
                    $book->subject_id = $subjectIds[array_rand($subjectIds)];
                } else {
                    $book->subject_id = null;
                }

                $book->save();
            });
    }
}
