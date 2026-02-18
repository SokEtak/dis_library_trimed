<?php

namespace App\Exports;

use App\Models\SubCategory;
use League\Csv\Writer;

class SubCategoryExport
{
    /**
     * Columns exported for subcategories table.
     */
    private const HEADERS = [
        'id',
        'name',
    ];

    public function toCsvString(): string
    {
        $writer = Writer::createFromString('');
        $writer->insertOne(self::HEADERS);

        SubCategory::query()
            ->select(self::HEADERS)
            ->orderBy('id')
            ->chunk(500, function ($subcategories) use ($writer): void {
                foreach ($subcategories as $subcategory) {
                    $writer->insertOne([
                        $subcategory->id,
                        $subcategory->name,
                    ]);
                }
            });

        return $writer->toString();
    }
}
