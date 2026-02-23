<?php

namespace App\Events;

use App\Models\Book;
use App\Models\BookLoan;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Spatie\Activitylog\Models\Activity;

class ActivityLogStreamUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public array $activity;

    public int $activityId;

    public string $source;

    public string $updatedAt;

    public function __construct(Activity $activity, string $source = 'activity-log')
    {
        $activity->loadMissing(['causer:id,name,email']);

        $properties = $activity->properties?->toArray() ?? [];
        $attributes = data_get($properties, 'attributes', []);
        $old = data_get($properties, 'old', []);
        $attributes = is_array($attributes) ? $attributes : [];
        $old = is_array($old) ? $old : [];

        $changedColumns = collect(array_keys(array_merge($old, $attributes)))
            ->filter(function (string $key) use ($attributes, $old): bool {
                $newValueExists = array_key_exists($key, $attributes);
                $oldValueExists = array_key_exists($key, $old);

                if (! $newValueExists || ! $oldValueExists) {
                    return true;
                }

                return $attributes[$key] !== $old[$key];
            })
            ->values()
            ->take(5)
            ->all();

        $subjectType = match ($activity->subject_type) {
            Book::class => 'Book',
            BookLoan::class => 'Loan',
            default => 'Entity',
        };

        $subjectLabel = match ($subjectType) {
            'Book' => (string) ($attributes['title'] ?? $old['title'] ?? "Book #{$activity->subject_id}"),
            'Loan' => "Loan #{$activity->subject_id}",
            default => "Entity #{$activity->subject_id}",
        };

        $this->activity = [
            'id' => (int) $activity->id,
            'event' => (string) ($activity->event ?: $activity->description ?: 'updated'),
            'subject_type' => $subjectType,
            'subject_label' => (string) $subjectLabel,
            'causer_name' => $activity->causer?->name ?? 'System',
            'changes' => $changedColumns !== [] ? implode(', ', $changedColumns) : 'No field changes',
            'created_at' => optional($activity->created_at)->toIso8601String(),
        ];

        $this->activityId = (int) $activity->id;
        $this->source = $source;
        $this->updatedAt = now()->toIso8601String();
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('activity.logs'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'activity.logs.updated';
    }

    public function broadcastConnections(): array
    {
        $hasReverbCredentials = ! empty(config('broadcasting.connections.reverb.key'))
            && ! empty(config('broadcasting.connections.reverb.secret'))
            && ! empty(config('broadcasting.connections.reverb.app_id'));

        if ($hasReverbCredentials) {
            return ['reverb'];
        }

        $default = (string) config('broadcasting.default', 'log');

        return [$default === 'reverb' ? 'log' : $default];
    }
}
