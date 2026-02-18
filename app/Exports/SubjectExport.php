<?php

namespace App\Exports;

use App\Models\Subject;
use League\Csv\Writer;

class SubjectExport
{
    /**
     * Columns exported for subjects table.
     */
    private const HEADERS = [
        'id',
        'name',
    ];

    public function toCsvString(): string
    {
        $writer = Writer::createFromString('');
        $writer->insertOne(self::HEADERS);

        Subject::query()
            ->select(self::HEADERS)
            ->orderBy('id')
            ->chunk(500, function ($subjects) use ($writer): void {
                foreach ($subjects as $subject) {
                    $writer->insertOne([
                        $subject->id,
                        $subject->name,
                    ]);
                }
            });

        return $writer->toString();
    }
}
