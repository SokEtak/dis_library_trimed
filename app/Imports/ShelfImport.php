<?php

namespace App\Imports;

use App\Models\Shelf;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use League\Csv\Reader;

class ShelfImport
{
    /**
     * Columns accepted from CSV input.
     */
    private const ACCEPTED_COLUMNS = [
        'code',
        'campus_id',
        'bookcase_id',
    ];

    /**
     * Import shelves from a CSV file path.
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

                    $shelf = Shelf::query()->where('code', $payload['code'])->first();
                    if ($shelf) {
                        $shelf->fill($payload)->save();
                        $result['updated']++;
                    } else {
                        Shelf::create($payload);
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
            'code' => $this->requiredString($row, 'code'),
            'campus_id' => $this->requiredInt($row, 'campus_id'),
            'bookcase_id' => $this->requiredInt($row, 'bookcase_id'),
        ];

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
}
