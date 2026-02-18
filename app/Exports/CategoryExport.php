<?php

namespace App\Exports;

use App\Models\Category;
use League\Csv\Writer;

class CategoryExport
{
    /**
     * Columns exported for categories table.
     */
    private const HEADERS = [
        'id',
        'name',
    ];

    public function toCsvString(): string
    {
        $writer = Writer::createFromString('');
        $writer->insertOne(self::HEADERS);

        Category::query()
            ->select(self::HEADERS)
            ->orderBy('id')
            ->chunk(500, function ($categories) use ($writer): void {
                foreach ($categories as $category) {
                    $writer->insertOne([
                        $category->id,
                        $category->name,
                    ]);
                }
            });

        return $writer->toString();
    }
}
