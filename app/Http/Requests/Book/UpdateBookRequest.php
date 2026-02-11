<?php

namespace App\Http\Requests\Book;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UpdateBookRequest extends FormRequest
{
    public function authorize()
    {
        return $this->user()->hasAnyRole(['staff', 'admin']);
    }

    protected function prepareForValidation()
    {
        $campusId = Auth::user()->campus_id;
        $book = $this->route('book');
        $type = $this->input('type', $book->type ?? 'physical'); // Fallback to book's type

        if ($type === 'physical' && ! $campusId) {
            throw ValidationException::withMessages([
                'campus_id' => 'User must have a valid campus ID for physical books.',
            ]);
        }

        $this->merge([
            'type' => $type,
            'campus_id' => $this->input('campus_id', $campusId),
            'user_id' => $this->input('user_id', Auth::id()),
        ]);

        if ($this->has('published_at') && ! empty($this->published_at)) {
            $this->merge(['published_at' => (int) $this->published_at]);
        }

        if ($type === 'ebook') {
            $this->merge(['is_available' => true]);
        }
    }

    public function rules()
    {
        $bookId = $this->route('book')->id;
        $isEbook = $this->input('type', $this->route('book')->type ?? 'physical') === 'ebook';

        return [
            'type' => ['sometimes', 'in:physical,ebook'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'page_count' => ['sometimes', 'integer', 'min:1'],
            'publisher' => ['sometimes', 'string', 'max:255'],
            'language' => ['sometimes', 'in:en,kh'],
            'program' => ['sometimes', 'in:Cambodia,American'],
            'published_at' => ['sometimes', 'integer', 'digits:4', 'min:1000', 'max:2025'],
            'author' => ['sometimes', 'string', 'max:255'],
            'flip_link' => ['sometimes', 'url', 'max:255'],
            'code' => [
                'sometimes',
                'string',
                'max:10',
                Rule::unique('books', 'code')->ignore($bookId),
            ],
            'isbn' => [
                'sometimes',
                'string',
                'size:13',
                Rule::unique('books', 'isbn')->ignore($bookId),
            ],
            'view' => ['sometimes', 'integer', 'min:0'],
            'is_available' => [$isEbook ? 'nullable' : 'required_if:type,physical', 'boolean'],
            'downloadable' => [$isEbook ? 'required' : 'nullable', 'boolean'],
            'cover' => ['sometimes', 'image', 'mimes:jpeg,png', 'max:5120'],
            'pdf_url' => [$isEbook ? 'sometimes' : 'nullable', 'mimes:pdf', 'max:30720'],
            'category_id' => ['sometimes', 'exists:categories,id'],
            'subcategory_id' => ['sometimes', 'exists:sub_categories,id'],
            'shelf_id' => [$isEbook ? 'nullable' : 'required_if:type,physical', 'exists:shelves,id'],
            'bookcase_id' => [$isEbook ? 'nullable' : 'required_if:type,physical', 'exists:bookcases,id'],
            'grade_id' => ['sometimes', 'exists:grades,id'],
            'subject_id' => ['sometimes', 'exists:subjects,id'],
            'campus_id' => [$isEbook ? 'nullable' : 'required_if:type,physical', 'exists:campuses,id'],
        ];
    }

    public function messages()
    {
        return [
            'type.in' => 'Book type must be physical or ebook.',
            'title.max' => 'Book title cannot exceed 255 characters.',
            'page_count.min' => 'Page count must be at least 1.',
            'publisher.max' => 'Publisher name cannot exceed 255 characters.',
            'language.in' => 'Language must be English or Khmer.',
            'program.in' => 'Program must be Cambodia or American.',
            'code.max' => 'Book code cannot exceed 10 characters.',
            'code.unique' => 'This book code is already in use.',
            'isbn.size' => 'ISBN must be exactly 13 characters.',
            'isbn.unique' => 'This ISBN is already in use, please choose another one.',
            'view.integer' => 'View count must be an integer.',
            'view.min' => 'View count must be at least 0.',
            'is_available.required_if' => 'Availability is required for physical books.',
            'is_available.boolean' => 'Availability must be a boolean value.',
            'downloadable.required' => 'Downloadable status is required for e-books.',
            'downloadable.boolean' => 'Downloadable status must be a boolean value.',
            'cover.image' => 'Cover must be a valid JPEG or PNG image.',
            'cover.mimes' => 'Cover must be a JPEG or PNG image.',
            'cover.max' => 'Cover image must not exceed 5MB.',
            'pdf_url.mimes' => 'File must be a valid PDF.',
            'pdf_url.max' => 'PDF file must not exceed 30MB.',
            'category_id.exists' => 'Selected category is invalid.',
            'subcategory_id.exists' => 'Selected subcategory is invalid.',
            'shelf_id.required_if' => 'Shelf is required for physical books.',
            'shelf_id.exists' => 'Selected shelf is invalid.',
            'bookcase_id.required_if' => 'Bookcase is required for physical books.',
            'bookcase_id.exists' => 'Selected bookcase is invalid.',
            'grade_id.exists' => 'Selected grade is invalid.',
            'subject_id.exists' => 'Selected subject is invalid.',
            'campus_id.required_if' => 'Campuses is required for physical books.',
            'campus_id.exists' => 'Selected campus is invalid.',
            'published_at.integer' => 'The published year must be a valid number.',
            'published_at.digits' => 'The published year must be exactly 4 digits.',
            'published_at.min' => 'The published year must be at least 1000.',
            'published_at.max' => 'The published year cannot be greater than 2025.',
        ];
    }
}
