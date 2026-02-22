<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        // Clean up historical duplicate pending rows first.
        DB::statement(
            "UPDATE book_loan_requests
            SET status = 'rejected',
                approver_id = NULL,
                decided_at = COALESCE(decided_at, CURRENT_TIMESTAMP),
                updated_at = CURRENT_TIMESTAMP
            WHERE status = 'pending'
                AND id NOT IN (
                    SELECT MAX(id)
                    FROM book_loan_requests
                    WHERE status = 'pending'
                    GROUP BY book_id, requester_id
                )"
        );

        DB::statement(
            "CREATE UNIQUE INDEX IF NOT EXISTS book_loan_requests_pending_unique
            ON book_loan_requests (book_id, requester_id)
            WHERE status = 'pending'"
        );
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS book_loan_requests_pending_unique');
    }
};
