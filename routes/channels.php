<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('admin.book-loan-requests', function ($user) {
    return $user->hasAnyRole(['admin', 'staff']);
});

Broadcast::channel('book-loan-requests.user.{userId}', function ($user, int $userId) {
    return (int) $user->id === $userId || $user->hasAnyRole(['admin', 'staff']);
});

Broadcast::channel('dashboard.summary', function ($user) {
    return $user->hasAnyRole(['admin', 'staff']);
});
