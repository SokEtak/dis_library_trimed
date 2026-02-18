<?php

namespace App\Imports;

use App\Models\Book;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use League\Csv\Reader;

class BookImport
{
    /**
     * Columns accepted from CSV input.
     */
    private const ACCEPTED_COLUMNS = [
        'title',
        'description',
        'page_count',
        'publisher',
        'published_at',
        'language',
        'program',
        'cover',
        'pdf_url',
        'flip_link',
        'view',
        'is_available',
        'author',
        'code',
        'isbn',
        'type',
        'downloadable',
        'user_id',
        'category_id',
        'subcategory_id',
        'shelf_id',
        'subject_id',
        'campus_id',
        'bookcase_id',
        'grade_id',
        'is_deleted',
    ];

    /**
     * Import books from a CSV file path.
     *
     * @return array{created:int,updated:int,failed:int,errors:array<int,string>}
     */
    public function importFromPath(string $path, ?int $defaultUserId = null): array
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

        DB::transaction(function () use ($reader, $defaultUserId, &$result): void {
            foreach ($reader->getRecords() as $index => $row) {
                try {
                    $payload = $this->normalizeRow($row, $defaultUserId);

                    $book = Book::query()->where('code', $payload['code'])->first();
                    if ($book) {
                        $book->fill($payload)->save();
                        $result['updated']++;
                    } else {
                        Book::create($payload);
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
    private function normalizeRow(array $row, ?int $defaultUserId): array
    {
        $payload = [
            'title' => $this->requiredString($row, 'title'),
            'description' => $this->nullableString($row, 'description'),
            'page_count' => $this->requiredInt($row, 'page_count'),
            'publisher' => $this->requiredString($row, 'publisher'),
            'published_at' => $this->nullableYear($row, 'published_at'),
            'language' => $this->nullableString($row, 'language') ?? 'kh',
            'program' => $this->nullableString($row, 'program'),
            'cover' => $this->nullableString($row, 'cover'),
            'pdf_url' => $this->nullableString($row, 'pdf_url'),
            'flip_link' => $this->nullableString($row, 'flip_link'),
            'view' => $this->nullableInt($row, 'view') ?? 0,
            'is_available' => $this->nullableBoolAsInt($row, 'is_available') ?? 0,
            'author' => $this->nullableString($row, 'author'),
            'code' => $this->requiredString($row, 'code'),
            'isbn' => $this->nullableString($row, 'isbn'),
            'type' => $this->nullableString($row, 'type') ?? 'physical',
            'downloadable' => $this->nullableBoolAsInt($row, 'downloadable') ?? 0,
            'user_id' => $this->nullableInt($row, 'user_id') ?? $defaultUserId,
            'category_id' => $this->requiredInt($row, 'category_id'),
            'subcategory_id' => $this->nullableInt($row, 'subcategory_id'),
            'shelf_id' => $this->nullableInt($row, 'shelf_id'),
            'subject_id' => $this->nullableInt($row, 'subject_id'),
            'campus_id' => $this->nullableInt($row, 'campus_id'),
            'bookcase_id' => $this->nullableInt($row, 'bookcase_id'),
            'grade_id' => $this->nullableInt($row, 'grade_id'),
            'is_deleted' => $this->nullableBoolAsInt($row, 'is_deleted') ?? 0,
        ];

        if ($payload['user_id'] === null) {
            throw new InvalidArgumentException('user_id is required when no default user is provided.');
        }

        if (! in_array($payload['language'], ['kh', 'en'], true)) {
            throw new InvalidArgumentException('language must be kh or en.');
        }

        if ($payload['program'] !== null && ! in_array($payload['program'], ['Cambodia', 'American'], true)) {
            throw new InvalidArgumentException('program must be Cambodia or American.');
        }

        if (! in_array($payload['type'], ['physical', 'ebook'], true)) {
            throw new InvalidArgumentException('type must be physical or ebook.');
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
    private function nullableYear(array $row, string $key): ?int
    {
        $value = $this->nullableInt($row, $key);

        if ($value === null) {
            return null;
        }

        if ($value < 1000 || $value > 9999) {
            throw new InvalidArgumentException($key.' must be a 4-digit year.');
        }

        return $value;
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
