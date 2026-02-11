<?php

namespace App\Http\Requests\Campus;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CampusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $campus = $this->route('campus'); // null on create, Campus model on update

        return [
            // Required
            'school_id' => 'required|exists:schools,id',
            'name' => 'required|string|max:150',
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('campuses', 'code')->ignore($campus?->id),
            ],

            // Optional (nullable in DB + form)
            'address' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:20|regex:/^(\+?[0-9]{1,4})?[0]?[0-9]{8,9}$/',
            'email' => [
                'nullable',
                'email',
                'max:100',
                Rule::unique('campuses', 'email')->ignore($campus?->id),
            ],
            'website' => 'nullable|url|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            // Required
            'school_id.required' => 'សូមជ្រើសរើសសាលារៀន។',
            'school_id.exists' => 'សាលារៀនដែលបានជ្រើសមិនត្រឹមត្រូវ។',
            'name.required' => 'ឈ្មោះមណ្ឌលត្រូវតែបំពេញ។',
            'name.max' => 'ឈ្មោះមណ្ឌលមិនអាចលើសពី ១៥០ តួអក្សរ។',
            'code.required' => 'កូដមណ្ឌលត្រូវតែបំពេញ។',
            'code.max' => 'កូដមណ្ឌលមិនអាចលើសពី ២០ តួអក្សរ។',
            'code.unique' => 'កូដមណ្ឌលនេះត្រូវបានប្រើប្រាស់រួចហើយ។',

            // Optional
            'contact.regex' => 'ទម្រង់លេខទូរស័ព្ទមិនត្រឹមត្រូវ។ សូមប្រើលេខទូរស័ព្ទជាសកលដូចជា +85512345678 ឬលេខក្នុងស្រុកដូចជា 012345678។',
            'email.email' => 'សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវ។',
            'email.max' => 'អ៊ីមែលមិនអាចលើសពី ១០០ តួអក្សរ។',
            'email.unique' => 'អ៊ីមែលនេះត្រូវបានប្រើប្រាស់រួចហើយ។',
            'website.url' => 'សូមបញ្ចូល URL ត្រឹមត្រូវ (រួម http:// ឬ https://)។',
        ];
    }
}
