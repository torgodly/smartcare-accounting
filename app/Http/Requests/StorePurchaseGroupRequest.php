<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseGroupRequest extends FormRequest
{
    /**
     * Keep only A–Z and 0–9 in the code, uppercased, max 4, default G.
     */
    protected function prepareForValidation(): void
    {
        $code = substr((string) preg_replace('/[^A-Z0-9]/', '', strtoupper((string) $this->input('code'))), 0, 4);

        $this->merge(['code' => $code === '' ? 'G' : $code]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'regex:/^[A-Z0-9]{1,4}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'اكتب اسم المجموعة',
        ];
    }
}
