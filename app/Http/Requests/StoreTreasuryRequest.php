<?php

namespace App\Http\Requests;

use App\Services\Regions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTreasuryRequest extends FormRequest
{
    /**
     * A regional account can only create treasuries in its own region.
     */
    protected function prepareForValidation(): void
    {
        if (Regions::lockedFor($this) !== null) {
            $this->merge(['region' => Regions::lockedFor($this)]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'region' => ['required', Rule::in(Regions::keys())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'اكتب اسم الخزينة',
            'region.required' => 'اختر المنطقة',
        ];
    }
}
