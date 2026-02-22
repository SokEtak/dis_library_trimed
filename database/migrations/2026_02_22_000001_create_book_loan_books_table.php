<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('book_loan_books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_loan_id')->constrained('book_loans')->cascadeOnDelete();
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['book_loan_id', 'book_id']);
            $table->index('book_id');
        });

        $now = now();

        DB::table('book_loans')
            ->select(['id', 'book_id'])
            ->whereNotNull('book_id')
            ->orderBy('id')
            ->chunkById(500, function ($loans) use ($now): void {
                $rows = [];

                foreach ($loans as $loan) {
                    $rows[] = [
                        'book_loan_id' => (int) $loan->id,
                        'book_id' => (int) $loan->book_id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if ($rows !== []) {
                    DB::table('book_loan_books')->upsert(
                        $rows,
                        ['book_loan_id', 'book_id'],
                        ['updated_at']
                    );
                }
            }, 'id');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('book_loan_books');
    }
};
