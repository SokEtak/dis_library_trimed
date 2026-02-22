<?php

namespace App\Http\Requests\BookLoan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BookLoanRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->input('book_id') === 'none') {
            $this->merge(['book_id' => null]);
        }

        if ($this->has('book_ids')) {
            $bookIds = collect($this->input('book_ids', []))
                ->filter(fn ($id) => $id !== null && $id !== '' && $id !== 'none')
                ->values()
                ->all();

            $this->merge(['book_ids' => $bookIds]);
        }
    }

    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'return_date' => 'required|date',
            'returned_at' => 'nullable|date',
            'book_ids' => 'required_without:book_id|array|min:1',
            'book_ids.*' => 'integer|distinct|exists:books,id',
            'book_id' => 'nullable|integer|exists:books,id',
            'user_id' => 'required|exists:users,id',
            'status' => 'required|in:processing,canceled,returned',
        ];
    }

    public function validatedWithExtras()
    {
        $validated = $this->validated();
        $bookIds = collect($validated['book_ids'] ?? [])
            ->when(
                isset($validated['book_id']) && $validated['book_id'] !== null,
                fn ($collection) => $collection->push($validated['book_id'])
            )
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $validated['book_ids'] = $bookIds;
        $validated['book_id'] = $bookIds[0] ?? null;
        $validated['campus_id'] = Auth::user()->campus_id;

        return $validated;
    }
}
