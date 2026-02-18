<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookLoanRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'requester_id',
        'approver_id',
        'campus_id',
        'status',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'decided_at' => 'datetime',
        ];
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }
}
