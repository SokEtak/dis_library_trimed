<?php

namespace App\Events;

use App\Models\BookLoanRequest;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookLoanRequestUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public array $loanRequest;

    public function __construct(BookLoanRequest $loanRequest)
    {
        $loanRequest->loadMissing(['book:id,title', 'requester:id,name', 'approver:id,name']);

        $this->loanRequest = [
            'id' => $loanRequest->id,
            'book_id' => $loanRequest->book_id,
            'book_title' => $loanRequest->book?->title,
            'requester_id' => $loanRequest->requester_id,
            'requester_name' => $loanRequest->requester?->name,
            'approver_id' => $loanRequest->approver_id,
            'approver_name' => $loanRequest->approver?->name,
            'status' => $loanRequest->status,
            'decided_at' => optional($loanRequest->decided_at)->toIso8601String(),
        ];
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.book-loan-requests'),
            new PrivateChannel("book-loan-requests.user.{$this->loanRequest['requester_id']}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'book-loan-request.updated';
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
