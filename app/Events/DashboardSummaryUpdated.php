<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardSummaryUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public string $source;

    public string $updatedAt;

    public function __construct(string $source = 'system')
    {
        $this->source = $source;
        $this->updatedAt = now()->toIso8601String();
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('public.summary'),
            new PrivateChannel('dashboard.summary'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'dashboard.summary.updated';
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
