<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActivityLogStreamUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public int $activityId;

    public string $source;

    public string $updatedAt;

    public function __construct(int $activityId, string $source = 'activity-log')
    {
        $this->activityId = $activityId;
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
