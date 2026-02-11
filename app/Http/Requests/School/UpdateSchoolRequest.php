<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $school = $this->route('school');

        return [
            // === REQUIRED (only if sent) ===
            'name' => 'sometimes|required|string|max:150',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('schools', 'code')->ignore($school->id),
            ],

            // === OPTIONAL ===
            'address' => 'sometimes|nullable|string|max:255',
            'contact' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
                'regex:/^(\+855[0-9]{8,9}|[0][0-9]{8,9})$/',
            ],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:100',
                Rule::unique('schools', 'email')->ignore($school->id),
            ],
            'website' => 'sometimes|nullable|url|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            // Required
            'name.required' => 'ឈ្មោះសាលារៀនត្រូវតែបំពេញ។',
            'name.max' => 'ឈ្មោះសាលារៀនមិនអាចលើសពី ១៥០ តួអក្សរ។',

            'code.required' => 'កូដសាលារៀនត្រូវតែបំពេញ។',
            'code.max' => 'កូដសាលារៀនមិនអាចលើសពី ២០ តួអក្សរ។',
            'code.unique' => 'កូដសាលារៀននេះត្រូវបានប្រើប្រាស់រួចហើយ។',

            // Optional
            'contact.regex' => 'ទម្រង់លេខទូរស័ព្ទមិនត្រឹមត្រូវ។ '
                .'សូមប្រើ: +855xxxxxxxx (12-13 ខ្ទង់) ឬ 0xxxxxxxx (9-10 ខ្ទង់)។',

            'email.email' => 'សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវ។',
            'email.max' => 'អ៊ីមែលមិនអាចលើសពី ១០០ តួអក្សរ។',
            'email.unique' => 'អ៊ីមែលនេះត្រូវបានប្រើប្រាស់រួចហើយ។',

            'website.url' => 'សូមបញ្ចូល URL ត្រឹមត្រូវ (រួម http:// ឬ https://)។',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'ឈ្មោះសាលា',
            'code' => 'កូដសាលា',
            'address' => 'អាសយដ្ឋាន',
            'contact' => 'លេខទំនាក់ទំនង',
            'email' => 'អ៊ីមែល',
            'website' => 'គេហទំព័រ',
        ];
    }
}
