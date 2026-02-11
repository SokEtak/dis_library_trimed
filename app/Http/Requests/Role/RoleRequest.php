<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $roleId = $this->route('pms')?->id ?? null; // Get the pms ID from the route for updates

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($roleId)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ];
    }

    /**
     * Get custom error messages for validation.
     */
    public function messages(): array
    {
        return [
            'name.required' => [
                'en' => 'The pms name is required.',
                'kh' => 'ឈ្មោះតួនាទីគឺត្រូវបានទាមទារ។',
            ],
            'name.unique' => [
                'en' => 'This pms name is already taken.',
                'kh' => 'ឈ្មោះតួនាទីនេះត្រូវបានប្រើរួចហើយ។',
            ],
            'name.max' => [
                'en' => 'The pms name may not be greater than 255 characters.',
                'kh' => 'ឈ្មោះតួនាទីមិនត្រូវលើសពី ២៥៥ តួអក្សរទេ។',
            ],
            'permissions.array' => [
                'en' => 'The permissions must be an array.',
                'kh' => 'សិទ្ធិត្រូវតែជាសំណុំទិន្នន័យ។',
            ],
            'permissions.*.exists' => [
                'en' => 'One or more selected permissions are invalid.',
                'kh' => 'សិទ្ធិមួយ ឬច្រើនដែលបានជ្រើសរើសមិនត្រឹមត្រូវទេ។',
            ],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    public function prepareForValidation()
    {
        // Ensure permissions is an array if not provided
        $this->merge([
            'permissions' => $this->input('permissions', []),
        ]);
    }
}
