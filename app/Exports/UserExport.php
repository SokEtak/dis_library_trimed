<?php

namespace App\Exports;

use App\Models\User;
use League\Csv\Writer;

class UserExport
{
    /**
     * Columns exported for users table.
     */
    private const HEADERS = [
        'id',
        'name',
        'email',
        'campus_id',
        'isVerified',
        'isActive',
        'roles',
    ];

    public function toCsvString(): string
    {
        $writer = Writer::createFromString('');
        $writer->insertOne(self::HEADERS);

        User::query()
            ->with('roles:id,name')
            ->select([
                'id',
                'name',
                'email',
                'campus_id',
                'isVerified',
                'isActive',
            ])
            ->orderBy('id')
            ->chunk(500, function ($users) use ($writer): void {
                foreach ($users as $user) {
                    $writer->insertOne([
                        $user->id,
                        $user->name,
                        $user->email,
                        $user->campus_id,
                        $user->isVerified ? 1 : 0,
                        $user->isActive ? 1 : 0,
                        $user->roles->pluck('name')->implode('|'),
                    ]);
                }
            });

        return $writer->toString();
    }
}
