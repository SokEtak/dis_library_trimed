<?php

namespace App\Http\Requests\Book;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StoreBookRequest extends FormRequest
{
    public function authorize()
    {
        return $this->user()->hasAnyRole(['staff', 'admin']);
    }

    protected function prepareForValidation()
    {
        $campusId = Auth::user()->campus_id;
        if ($this->input('type') === 'physical' && ! $campusId) {
            throw ValidationException::withMessages([
                'campus_id' => 'User must have a valid campus ID for physical books.',
            ]);
        }

        $this->merge([
            'campus_id' => $this->input('campus_id', $campusId),
            'user_id' => $this->input('user_id', Auth::id()),
        ]);

        // If published_at is provided, ensure it's treated as a year
        if ($this->has('published_at') && ! empty($this->published_at)) {
            $this->merge([
                'published_at' => (int) $this->published_at,
            ]);
        }

        // set visibility to true for ebook to make sure it works correctly
        if ($this->input('type') === 'ebook') {
            $this->merge([
                'is_available' => true,
            ]);
        }

    }

    public function rules()
    {
        $isEbook = $this->input('type', 'physical') === 'ebook';

        return [
            'type' => ['required', 'in:physical,ebook'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'page_count' => ['required', 'integer', 'min:1'],
            'publisher' => ['required', 'string', 'max:255'],
            'language' => ['required', 'in:en,kh'],
            'program' => 'nullable|in:Cambodia,American',
            'published_at' => ['nullable', 'integer', 'digits:4', 'min:1000', 'max:2025'],
            'author' => ['nullable', 'string', 'max:255'],
            'flip_link' => ['nullable', 'url', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:10',
                Rule::unique('books', 'code'),
            ],
            'isbn' => [
                'nullable',
                'string',
                'size:13',
                Rule::unique('books', 'isbn'),
            ],
            'view' => ['required', 'integer', 'min:0'],
            'is_available' => [$isEbook ? 'nullable' : 'required', 'boolean'],
            'downloadable' => [$isEbook ? 'required' : 'nullable', 'boolean'],
            'cover' => ['nullable', 'image', 'mimes:jpeg,png', 'max:5120'],
            'pdf_url' => ['nullable', 'mimes:pdf', 'max:30720'],
            'category_id' => ['required', 'exists:categories,id'],
            'subcategory_id' => ['nullable', 'exists:sub_categories,id'],
            'shelf_id' => [$isEbook ? 'nullable' : 'required_if:type,physical', 'exists:shelves,id'],
            'bookcase_id' => [$isEbook ? 'nullable' : 'required_if:type,physical', 'exists:bookcases,id'],
            'grade_id' => ['nullable', 'exists:grades,id'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'campus_id' => [$isEbook ? 'nullable' : 'required', 'exists:campuses,id'],
        ];
    }

    public function messages()
    {
        return [
            'type.required' => 'Book type is required.',
            'type.in' => 'Book type must be physical or ebook.',
            'title.required' => 'Book title is required.',
            'page_count.required' => 'Page count is required.',
            'page_count.min' => 'Page count must be at least 1.',
            'publisher.required' => 'Publisher name is required.',
            'language.required' => 'Language is required.',
            'program.required' => 'Program is required.',
            'code.required' => 'Book code is required.',
            'code.unique' => 'This book code is already in use.',
            'isbn.size' => 'ISBN must be exactly 13 characters.',
            'isbn.unique' => 'This ISBN is already in use, please choose another one.',
            'cover.image' => 'Cover must be a valid JPEG or PNG image.',
            'cover.max' => 'Cover image must not exceed 5MB.',
            'pdf_url.mimes' => 'File must be a valid PDF.',
            'pdf_url.max' => 'PDF file must not exceed 30MB.',
            'category_id.required' => 'Category is required.',
            'shelf_id.required_if' => 'Shelf is required for physical books.',
            'bookcase_id.required_if' => 'Bookcase is required for physical books.',
            'grade_id.exists' => 'Selected grade is invalid.',
            'subject_id.exists' => 'Selected subject is invalid.',
            'campus_id.required' => 'Campuses is required for physical books.',
            'campus_id.exists' => 'Selected campus is invalid.',
            'published_at.integer' => 'The published year must be a valid number.',
            'published_at.digits' => 'The published year must be exactly 4 digits.',
            'published_at.min' => 'The published year must be at least 1000.',
            'published_at.max' => 'The published year cannot be greater than 2025.',
        ];
    }
}
