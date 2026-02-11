<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

class Bookcase extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'campus_id'];

    public $timestamps = false;

    public function scopeForCurrentCampusWithBooks($query)
    {
        return $query->where('campus_id', Auth::user()->campus_id)
            ->with([
                'books' => fn ($q) => $q->physicalAndActiveForCampus()
                    ->select(['id', 'title', 'code', 'is_available', 'bookcase_id']),
            ])
            ->withCount([
                'books as total_books_count',
                'books as active_books_count' => fn ($q) => $q->physicalAndActiveForCampus(),
            ]);
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class, 'bookcase_id');
    }

    public function shelves(): HasMany
    {
        return $this->hasMany(Shelf::class, 'bookcase_id');
    }

    public function campus()
    {
        return $this->belongsTo(Campus::class);
    }
}
