<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;
use League\Csv\Reader;
use Spatie\Permission\Models\Role;

class UserImport
{
    /**
     * Columns accepted from CSV input.
     */
    private const ACCEPTED_COLUMNS = [
        'id',
        'name',
        'email',
        'password',
        'campus_id',
        'isVerified',
        'isActive',
        'roles',
    ];

    /**
     * Import users from a CSV file path.
     *
     * @return array{created:int,updated:int,failed:int,errors:array<int,string>}
     */
    public function importFromPath(string $path): array
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

        $availableRoles = Role::query()->pluck('name')->toArray();

        DB::transaction(function () use ($reader, $availableRoles, &$result): void {
            foreach ($reader->getRecords() as $index => $row) {
                try {
                    $payload = $this->normalizeRow($row, $availableRoles);

                    $user = User::query()->where('email', $payload['email'])->first();

                    if ($user) {
                        $updatePayload = [
                            'name' => $payload['name'],
                            'campus_id' => $payload['campus_id'],
                            'isVerified' => $payload['isVerified'],
                            'isActive' => $payload['isActive'],
                        ];

                        if ($payload['password'] !== null) {
                            $updatePayload['password'] = Hash::make($payload['password']);
                        }

                        $user->fill($updatePayload)->save();

                        if ($payload['roles'] !== null) {
                            $user->syncRoles($payload['roles']);
                        }

                        $result['updated']++;

                        continue;
                    }

                    if ($payload['password'] === null) {
                        throw new InvalidArgumentException('password is required for new users.');
                    }

                    $created = User::create([
                        'name' => $payload['name'],
                        'email' => $payload['email'],
                        'password' => Hash::make($payload['password']),
                        'campus_id' => $payload['campus_id'],
                        'isVerified' => $payload['isVerified'],
                        'isActive' => $payload['isActive'],
                    ]);

                    if ($payload['roles'] !== null) {
                        $created->syncRoles($payload['roles']);
                    }

                    $result['created']++;
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
     * @param array<int, string> $availableRoles
     * @return array<string, mixed>
     */
    private function normalizeRow(array $row, array $availableRoles): array
    {
        $roles = $this->nullableRoles($row, 'roles');

        if ($roles !== null) {
            $unknownRoles = array_values(array_diff($roles, $availableRoles));
            if ($unknownRoles !== []) {
                throw new InvalidArgumentException('Unknown roles: '.implode(', ', $unknownRoles));
            }
        }

        return [
            'name' => $this->requiredString($row, 'name'),
            'email' => $this->requiredEmail($row, 'email'),
            'password' => $this->nullableString($row, 'password'),
            'campus_id' => $this->nullableInt($row, 'campus_id'),
            'isVerified' => $this->nullableBoolAsInt($row, 'isVerified') ?? 0,
            'isActive' => $this->nullableBoolAsInt($row, 'isActive') ?? 1,
            'roles' => $roles,
        ];
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
    private function requiredEmail(array $row, string $key): string
    {
        $value = $this->requiredString($row, $key);

        if (filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            throw new InvalidArgumentException($key.' must be a valid email address.');
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

    /**
     * @param array<string, mixed> $row
     * @return array<int, string>|null
     */
    private function nullableRoles(array $row, string $key): ?array
    {
        $value = $this->nullableString($row, $key);
        if ($value === null) {
            return null;
        }

        $parts = preg_split('/[|,]/', $value) ?: [];
        $roles = array_values(array_unique(array_filter(array_map('trim', $parts), fn ($role) => $role !== '')));

        return $roles === [] ? null : $roles;
    }
}
