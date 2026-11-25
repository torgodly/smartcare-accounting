<?php

namespace App\Http\Requests;

use App\Services\Regions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustodyRequest extends FormRequest
{
    /**
     * A regional account can only open custodies in its own region.
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
            'holder_name' => ['required', 'string', 'max:120'],
            'title' => ['nullable', 'string', 'max:160'],
            'region' => ['required', Rule::in(Regions::keys())],
            'treasury_id' => ['required', 'integer', Regions::exists($this, 'treasuries')],
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999'],
            'date' => ['required', 'date_format:Y-m-d'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'holder_name.required' => 'اكتب اسم مستلم العهدة',
            'treasury_id.required' => 'اختر الخزينة',
            'amount.required' => 'اكتب قيمة العهدة',
            'amount.gt' => 'اكتب قيمة العهدة',
            'amount.numeric' => 'اكتب قيمة العهدة',
            'date.required' => 'اختر التاريخ',
        ];
    }
}
