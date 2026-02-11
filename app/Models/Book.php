<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Book extends Model
{
    use HasFactory;

    protected $guarded = [];

    // Include relationships in queries by default
    protected $with = [
        'user:id,name,isVerified,avatar',
        'category:id,name',
        'subcategory:id,name',
        'shelf:id,code',
        'grade:id,name',
        'subject:id,name',
        'bookcase:id,code',
        'campus:id,name',
    ];

    // Select columns based on schema
    protected static $selectColumns = [
        'id',
        'title',
        'description',
        'page_count',
        'publisher',
        'language',
        'program',
        'published_at',
        'cover',
        'pdf_url',
        'flip_link',
        'view',
        'is_available',
        'author',
        'code',
        'isbn',
        'type',
        'downloadable',
        'user_id',
        'category_id',
        'subcategory_id',
        'bookcase_id',
        'shelf_id',
        'subject_id',
        'grade_id',
        'campus_id',
        'is_deleted',
        'created_at',
        'updated_at',
    ];

    // Casts for specific fields
    protected $casts = [
        'is_available' => 'boolean',
        'is_deleted' => 'boolean',
        'published_at' => 'integer',
        'downloadable' => 'integer',
    ];

    // used by bookcase
    public function scopePhysicalAndActiveForCampus($query)
    {
        return $query->where([
            'type' => 'physical',
            'is_deleted' => 0,
            'campus_id' => Auth::user()->campus_id,
        ]);
    }

    // Scope for active base on pms , campus , book type-used by ebook(global,local and admin)
    public function scopeActive($query, $book_type, $scope = 'local')
    {
        $conditions = [];
        $conditions['is_deleted'] = 0;

        // For regular, handle global and local scope
        if (Auth::user()->hasAnyRole(['regular-user']) && $scope == 'local') {
            $conditions['campus_id'] = Auth::user()->campus_id;
        }
        // global no need to filter

        if (Auth::user()->hasAnyRole(['staff'])) {
            if ($scope == 'local') {
                $conditions['campus_id'] = Auth::user()->campus_id;
            }
        }
        // For role_id = 3, no campus_id filter (access all campuses)

        // Filter book type (missing, deleted, physical, e-book)
        if ($book_type !== null) {
            if ($book_type === 'del') {
                $conditions['is_deleted'] = 1; // For deleted books
            } elseif ($book_type === 'miss') {
                $conditions['is_available'] = 0; // For missing books (not found at bookcase/shelf)
            } else {
                $conditions['type'] = $book_type; // Filter by type (e.g., 'physical', 'ebook')
                $conditions['is_available'] = 1;
            }
        }
        // When $book_type is null, no is_available or type filters are applied

        return $query->where($conditions)->select(self::$selectColumns);
    }

    //  Scope to fetch related books based on category or user.
    public function scopeRelatedBooks($query, Book $book)
    {
        return $query
            ->where(function ($query) use ($book) {
                $query->where('category_id', $book->category_id)
                    ->orWhere('user_id', $book->user_id);
            })
            ->where('id', '!=', $book->id)
            ->where('is_deleted', false)
                    ->inRandomOrder()
                    ->take(20)
            ->with(['user', 'category', 'subcategory', 'shelf', 'subject', 'grade'])
            ->get()
            ->map(function ($relatedBook) {
                return [
                    'id' => $relatedBook->id,
                    'title' => $relatedBook->title,
                    'cover' => $relatedBook->cover,
                    'user' => $relatedBook->user ? [
                        'name' => $relatedBook->user->name,
                        'isVerified' => $relatedBook->user->isVerified ?? false,
                    ] : null,
                ];
            });
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bookcase()
    {
        return $this->belongsTo(Bookcase::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory()
    {
        return $this->belongsTo(SubCategory::class, 'subcategory_id');
    }

    public function shelf()
    {
        return $this->belongsTo(Shelf::class, 'shelf_id');
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function campus()
    {
        return $this->belongsTo(Campus::class, 'campus_id');
    }
}
