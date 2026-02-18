<?php

namespace App\Exports;

use App\Models\Campus;
use League\Csv\Writer;

class CampusExport
{
    /**
     * Columns exported for campuses table.
     */
    private const HEADERS = [
        'id',
        'school_id',
        'name',
        'code',
        'address',
        'contact',
        'email',
        'website',
    ];

    public function toCsvString(): string
    {
        $writer = Writer::createFromString('');
        $writer->insertOne(self::HEADERS);

        Campus::query()
            ->select(self::HEADERS)
            ->orderBy('id')
            ->chunk(500, function ($campuses) use ($writer): void {
                foreach ($campuses as $campus) {
                    $writer->insertOne([
                        $campus->id,
                        $campus->school_id,
                        $campus->name,
                        $campus->code,
                        $campus->address,
                        $campus->contact,
                        $campus->email,
                        $campus->website,
                    ]);
                }
            });

        return $writer->toString();
    }
}
