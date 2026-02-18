<?php

namespace App\Exports;

use App\Models\Shelf;
use League\Csv\Writer;

class ShelfExport
{
    /**
     * Columns exported for shelves table.
     */
    private const HEADERS = [
        'id',
        'code',
        'campus_id',
        'bookcase_id',
    ];

    public function toCsvString(): string
    {
        $writer = Writer::createFromString('');
        $writer->insertOne(self::HEADERS);

        Shelf::query()
            ->select(self::HEADERS)
            ->orderBy('id')
            ->chunk(500, function ($shelves) use ($writer): void {
                foreach ($shelves as $shelf) {
                    $writer->insertOne([
                        $shelf->id,
                        $shelf->code,
                        $shelf->campus_id,
                        $shelf->bookcase_id,
                    ]);
                }
            });

        return $writer->toString();
    }
}
