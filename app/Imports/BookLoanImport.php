<?php

namespace App\Imports;

use App\Models\BookLoan;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use League\Csv\Reader;

class BookLoanImport
{
    /**
     * Columns accepted from CSV input.
     */
    private const ACCEPTED_COLUMNS = [
        'book_id',
        'user_id',
        'campus_id',
        'return_date',
        'returned_at',
        'status',
        'is_deleted',
    ];

    /**
     * Import bookloans from a CSV file path.
     *
     * @return array{created:int,updated:int,failed:int,errors:array<int,string>}
     */
    public function importFromPath(string $path): array
    {
        $reader = Reader::createFromPath($path, 'r');
        $reader->setHeaderOffset(0);

        $headers = $reader->getHeader();
        $unknown = array_diff($headers, self::ACCEPTED_COLUMNS);

        if ($unknown !== []) {
            throw new InvalidArgumentException('Unsupported columns: '.implode(', ', $unknown));
        }

        $result = [
            'created' => 0,
            'updated' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        DB::transaction(function () use ($reader, &$result): void {
            foreach ($reader->getRecords() as $index => $row) {
                try {
                    $payload = $this->normalizeRow($row);

                    $bookloan = BookLoan::query()
                        ->where('book_id', $payload['book_id'])
                        ->where('user_id', $payload['user_id'])
                        ->where('campus_id', $payload['campus_id'])
                        ->first();

                    if ($bookloan) {
                        $bookloan->fill($payload)->save();
                        $result['updated']++;
                    } else {
                        BookLoan::create($payload);
                        $result['created']++;
                    }
                } catch (\Throwable $e) {
                    $result['failed']++;
                    $result['errors'][] = 'Row '.($index + 2).': '.$e->getMessage();
                }
            }
        });

        return $result;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function normalizeRow(array $row): array
    {
        $payload = [
            'book_id' => $this->requiredInt($row, 'book_id'),
            'user_id' => $this->requiredInt($row, 'user_id'),
            'campus_id' => $this->requiredInt($row, 'campus_id'),
            'return_date' => $this->requiredString($row, 'return_date'),
            'returned_at' => $this->nullableString($row, 'returned_at'),
            'status' => $this->requiredString($row, 'status'),
            'is_deleted' => $this->nullableBoolAsInt($row, 'is_deleted') ?? 0,
        ];

        if (! in_array($payload['status'], ['processing', 'returned', 'canceled'], true)) {
            throw new InvalidArgumentException('status must be processing, returned, or canceled.');
        }

        return $payload;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function requiredString(array $row, string $key): string
    {
        $value = isset($row[$key]) ? trim((string) $row[$key]) : '';

        if ($value === '') {
            throw new InvalidArgumentException($key.' is required.');
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function nullableString(array $row, string $key): ?string
    {
        if (! array_key_exists($key, $row) || trim((string) $row[$key]) === '') {
            return null;
        }

        return trim((string) $row[$key]);
    }

    /**
     * @param array<string, mixed> $row
     */
    private function requiredInt(array $row, string $key): int
    {
        $value = $this->nullableInt($row, $key);

        if ($value === null) {
            throw new InvalidArgumentException($key.' is required.');
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function nullableInt(array $row, string $key): ?int
    {
        if (! array_key_exists($key, $row) || trim((string) $row[$key]) === '') {
            return null;
        }

        if (! is_numeric($row[$key])) {
            throw new InvalidArgumentException($key.' must be an integer.');
        }

        return (int) $row[$key];
    }

    /**
     * @param array<string, mixed> $row
     */
    private function nullableBoolAsInt(array $row, string $key): ?int
    {
        if (! array_key_exists($key, $row) || trim((string) $row[$key]) === '') {
            return null;
        }

        $value = strtolower(trim((string) $row[$key]));

        if (in_array($value, ['1', 'true', 'yes'], true)) {
            return 1;
        }

        if (in_array($value, ['0', 'false', 'no'], true)) {
            return 0;
        }

        throw new InvalidArgumentException($key.' must be a boolean (0/1, true/false, yes/no).');
    }
}
