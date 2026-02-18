<?php

namespace App\Exports;

use App\Models\BookLoan;
use League\Csv\Writer;

class BookLoanExport
{
    /**
     * Columns exported for bookloans table.
     */
    private const HEADERS = [
        'id',
        'book_id',
        'user_id',
        'campus_id',
        'return_date',
        'returned_at',
        'status',
        'is_deleted',
        'created_at',
        'updated_at',
    ];

    public function toCsvString(): string
    {
        $writer = Writer::createFromString('');
        $writer->insertOne(self::HEADERS);

        BookLoan::query()
            ->select(self::HEADERS)
            ->orderBy('id')
            ->chunk(500, function ($bookloans) use ($writer): void {
                foreach ($bookloans as $bookloan) {
                    $writer->insertOne([
                        $bookloan->id,
                        $bookloan->book_id,
                        $bookloan->user_id,
                        $bookloan->campus_id,
                        $bookloan->return_date,
                        $bookloan->returned_at,
                        $bookloan->status,
                        (int) $bookloan->is_deleted,
                        optional($bookloan->created_at)->toDateTimeString(),
                        optional($bookloan->updated_at)->toDateTimeString(),
                    ]);
                }
            });

        return $writer->toString();
    }
}
