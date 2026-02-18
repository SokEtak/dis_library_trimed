<?php

namespace App\Exports;

use App\Models\Book;
use League\Csv\Writer;

class BookExport
{
    /**
     * Columns exported for books table.
     */
    private const HEADERS = [
        'id',
        'title',
        'description',
        'page_count',
        'publisher',
        'published_at',
        'language',
        'program',
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
        'shelf_id',
        'subject_id',
        'campus_id',
        'bookcase_id',
        'grade_id',
        'is_deleted',
        'created_at',
        'updated_at',
    ];

    public function toCsvString(): string
    {
        $writer = Writer::createFromString('');
        $writer->insertOne(self::HEADERS);

        Book::query()
            ->select(self::HEADERS)
            ->orderBy('id')
            ->chunk(500, function ($books) use ($writer): void {
                foreach ($books as $book) {
                    $writer->insertOne([
                        $book->id,
                        $book->title,
                        $book->description,
                        $book->page_count,
                        $book->publisher,
                        $book->published_at,
                        $book->language,
                        $book->program,
                        $book->cover,
                        $book->pdf_url,
                        $book->flip_link,
                        $book->view,
                        (int) $book->is_available,
                        $book->author,
                        $book->code,
                        $book->isbn,
                        $book->type,
                        (int) $book->downloadable,
                        $book->user_id,
                        $book->category_id,
                        $book->subcategory_id,
                        $book->shelf_id,
                        $book->subject_id,
                        $book->campus_id,
                        $book->bookcase_id,
                        $book->grade_id,
                        (int) $book->is_deleted,
                        optional($book->created_at)->toDateTimeString(),
                        optional($book->updated_at)->toDateTimeString(),
                    ]);
                }
            });

        return $writer->toString();
    }
}
