<?php

namespace App\Exports;

use App\Models\Bookcase;
use League\Csv\Writer;

class BookcaseExport
{
    /**
     * Columns exported for bookcases table.
     */
    private const HEADERS = [
        'id',
        'code',
        'campus_id',
    ];

    public function toCsvString(): string
    {
        $writer = Writer::createFromString('');
        $writer->insertOne(self::HEADERS);

        Bookcase::query()
            ->select(self::HEADERS)
            ->orderBy('id')
            ->chunk(500, function ($bookcases) use ($writer): void {
                foreach ($bookcases as $bookcase) {
                    $writer->insertOne([
                        $bookcase->id,
                        $bookcase->code,
                        $bookcase->campus_id,
                    ]);
                }
            });

        return $writer->toString();
    }
}
