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
        'id',
        'book_id',
        'book_ids',
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
                    $attributes = $payload;
                    unset($attributes['book_ids'], $attributes['id']);

                    $bookloan = null;

                    if (! empty($payload['id'])) {
                        $bookloan = BookLoan::query()->find($payload['id']);
                    }

                    if (! $bookloan) {
                        $bookloan = BookLoan::query()
                            ->where('book_id', $payload['book_id'])
                            ->where('user_id', $payload['user_id'])
                            ->where('campus_id', $payload['campus_id'])
                            ->first();
                    }

                    if ($bookloan) {
                        $bookloan->fill($attributes)->save();
                        if (! empty($payload['book_ids']) && is_array($payload['book_ids'])) {
                            $bookloan->books()->sync($payload['book_ids']);
                        } elseif (! empty($payload['book_id'])) {
                            $bookloan->books()->sync([(int) $payload['book_id']]);
                        }
                        $result['updated']++;
                    } else {
                        $createdLoan = BookLoan::create($attributes);
                        if (! empty($payload['book_ids']) && is_array($payload['book_ids'])) {
                            $createdLoan->books()->sync($payload['book_ids']);
                        } elseif (! empty($payload['book_id'])) {
                            $createdLoan->books()->sync([(int) $payload['book_id']]);
                        }
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
        $bookIds = $this->parseBookIds($row['book_ids'] ?? null);
        $primaryBookId = $bookIds[0] ?? $this->nullableInt($row, 'book_id');

        if ($primaryBookId === null) {
            throw new InvalidArgumentException('book_id or book_ids is required.');
        }

        $payload = [
            'id' => $this->nullableInt($row, 'id'),
            'book_id' => $primaryBookId,
            'book_ids' => $bookIds !== [] ? $bookIds : [$primaryBookId],
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
     * @return array<int, int>
     */
    private function parseBookIds(mixed $value): array
    {
        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        return collect(preg_split('/[|,]/', $value) ?: [])
            ->map(fn ($id) => trim((string) $id))
            ->filter(fn ($id) => $id !== '')
            ->map(function ($id) {
                if (! is_numeric($id)) {
                    throw new InvalidArgumentException('book_ids must contain integers separated by commas or pipes.');
                }

                return (int) $id;
            })
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();
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
