<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use League\Csv\Reader;

class BooksSeeder extends Seeder
{
    private function toNullIfEmpty($value)
    {
        // Convert empty strings, '?', and other placeholder values to NULL
        if ($value === null || $value === '' || trim($value ?? '') === '?' || trim($value ?? '') === '') {
            return null;
        }
        return $value;
    }

    private function toIntOrNull($value)
    {
        // First check if it's a placeholder or empty
        $value = $this->toNullIfEmpty($value);
        if ($value === null) {
            return null;
        }
        
        // Try to convert to int
        $intVal = (int)$value;
        // If the conversion results in 0 and the original value wasn't "0", return null
        if ($intVal === 0 && (string)$value !== '0') {
            return null;
        }
        return $intVal;
    }

    public function run(): void
    {
        // Path to CSV file
        $csvPath = 'g:\\.shortcut-targets-by-id\\1W1eJft_pV42Y-Oh0jD4uDz65MMsP4BYA\\Sok Etak\\systems\\system data backup\\books.csv';
        
        // Check if file exists
        if (!file_exists($csvPath)) {
            $this->command->error("CSV file not found at: {$csvPath}");
            return;
        }

        // Read CSV file
        $csv = Reader::createFromPath($csvPath, 'r');
        $csv->setHeaderOffset(0);
        $records = $csv->getRecords();

        $successCount = 0;
        $errorCount = 0;

        // Get default category_id (1)
        $defaultCategoryId = 1; // Default to category ID 1

        foreach ($records as $record) {
            // Filter out empty rows
            if (empty(trim($record['id'] ?? ''))) {
                continue;
            }

            try {
                $bookData = [
                    'id' => (int)$record['id'],
                    'title' => $record['title'] ?? '',
                    'description' => $this->toNullIfEmpty($record['description'] ?? null),
                    'page_count' => $this->toIntOrNull($record['page_count'] ?? null),
                    'publisher' => $record['publisher'] ?? '',
                    'language' => $this->toNullIfEmpty($record['language'] ?? null) ?? 'kh',
                    'published_at' => $this->toNullIfEmpty($record['published_at'] ?? null),
                    'cover' => $this->toNullIfEmpty($record['cover'] ?? null),
                    'pdf_url' => $this->toNullIfEmpty($record['pdf_url'] ?? null),
                    'flip_link' => $this->toNullIfEmpty($record['flip_link'] ?? null),
                    'view' => $this->toIntOrNull($record['view'] ?? null) ?? 0,
                    'is_available' => (int)($record['is_available'] === '1' || $record['is_available'] === 'true'),
                    'author' => $this->toNullIfEmpty($record['author'] ?? null),
                    'code' => $this->toNullIfEmpty($record['code'] ?? null) ?? 'CODE-' . uniqid(),
                    'isbn' => $this->toNullIfEmpty($record['isbn'] ?? null),
                    'type' => $this->toNullIfEmpty($record['type'] ?? null) ?? 'physical',
                    'downloadable' => (int)($record['downloadable'] === '1' || $record['downloadable'] === 'true'),
                    'user_id' => 1, // Set user_id to 1 for all records
                    'category_id' => $this->toIntOrNull($record['category_id'] ?? null) ?? $defaultCategoryId,
                    'subcategory_id' => $this->toIntOrNull($record['subcategory_id'] ?? null),
                    'shelf_id' => $this->toIntOrNull($record['shelf_id'] ?? null),
                    'subject_id' => $this->toIntOrNull($record['subject_id'] ?? null),
                    'grade_id' => $this->toIntOrNull($record['grade_id'] ?? null),
                    'is_deleted' => (int)($record['is_deleted'] === '1' || $record['is_deleted'] === 'true'),
                    'bookcase_id' => $this->toIntOrNull($record['bookcase_id'] ?? null),
                    'campus_id' => $this->toIntOrNull($record['campus_id'] ?? null),
                    'program' => $this->toNullIfEmpty($record['program'] ?? null),
                    'created_at' => $this->toNullIfEmpty($record['created_at'] ?? null) ?? now(),
                    'updated_at' => $this->toNullIfEmpty($record['updated_at'] ?? null) ?? now(),
                ];

                \DB::table('books')->updateOrInsert(
                    ['id' => $bookData['id']],
                    $bookData
                );

                $successCount++;
            } catch (\Exception $e) {
                $errorCount++;
                $this->command->error("Error inserting book ID {$record['id']}: " . $e->getMessage());
            }
        }

        $this->command->info("✓ Successfully imported {$successCount} books with user_id = 1 ({$errorCount} errors)");
    }
}
