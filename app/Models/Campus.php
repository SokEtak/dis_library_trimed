<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Campus extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'address',
        'contact',
        'email',
        'website',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function books()
    {
        return $this->hasMany(Book::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function bookloans()
    {
        return $this->hasMany(BookLoan::class);
    }

    public function shelves()
    {
        return $this->hasMany(Shelf::class);
    }

    public function bookcases()
    {
        return $this->hasMany(Bookcase::class);
    }
}
