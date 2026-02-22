<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // This migration uses generated columns + index introspection tuned for MySQL.
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Normalize historical duplicates: keep newest pending row and close older ones.
        DB::statement(
            "UPDATE book_loan_requests AS r
            INNER JOIN (
                SELECT book_id, requester_id, MAX(id) AS keep_id
                FROM book_loan_requests
                WHERE status = 'pending'
                GROUP BY book_id, requester_id
                HAVING COUNT(*) > 1
            ) AS d
                ON d.book_id = r.book_id
                AND d.requester_id = r.requester_id
            SET r.status = 'rejected',
                r.approver_id = NULL,
                r.decided_at = COALESCE(r.decided_at, NOW()),
                r.updated_at = NOW()
            WHERE r.status = 'pending'
                AND r.id <> d.keep_id"
        );

        if (! Schema::hasColumn('book_loan_requests', 'pending_guard')) {
            Schema::table('book_loan_requests', function (Blueprint $table): void {
                // NULL for non-pending rows allows historical duplicates of non-pending states.
                $table->unsignedTinyInteger('pending_guard')
                    ->nullable()
                    ->storedAs("CASE WHEN status = 'pending' THEN 1 ELSE NULL END");
            });
        }

        if (! $this->hasMysqlIndex('book_loan_requests', 'book_loan_requests_pending_unique')) {
            Schema::table('book_loan_requests', function (Blueprint $table): void {
                $table->unique(['book_id', 'requester_id', 'pending_guard'], 'book_loan_requests_pending_unique');
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        if ($this->hasMysqlIndex('book_loan_requests', 'book_loan_requests_pending_unique')) {
            Schema::table('book_loan_requests', function (Blueprint $table): void {
                $table->dropUnique('book_loan_requests_pending_unique');
            });
        }

        if (Schema::hasColumn('book_loan_requests', 'pending_guard')) {
            Schema::table('book_loan_requests', function (Blueprint $table): void {
                $table->dropColumn('pending_guard');
            });
        }
    }

    private function hasMysqlIndex(string $tableName, string $indexName): bool
    {
        $database = DB::connection()->getDatabaseName();

        $result = DB::selectOne(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
            [$database, $tableName, $indexName]
        );

        return $result !== null;
    }
};

