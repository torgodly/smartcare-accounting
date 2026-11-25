<?php

namespace App\Http\Requests;

use App\Models\PurchaseGroup;
use App\Services\Regions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseGroupRequest extends FormRequest
{
    /**
     * Keep only A–Z and 0–9 in the code, uppercased, max 4, default G.
     */
    protected function prepareForValidation(): void
    {
        $code = substr((string) preg_replace('/[^A-Z0-9]/', '', strtoupper((string) $this->input('code'))), 0, 4);

        $group = $this->route('group');

        $this->merge([
            'code' => $code === '' ? 'G' : $code,
            'region' => Regions::lockedFor($this) ?? ($this->input('region') ?: ($group?->region ?? Regions::defaultFor($this))),
            'kind' => $this->input('kind') ?: ($group?->kind ?? PurchaseGroup::KIND_PURCHASE),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'regex:/^[A-Z0-9]{1,4}$/'],
            'region' => ['required', Rule::in(Regions::keys())],
            'kind' => ['required', Rule::in(array_keys(PurchaseGroup::KIND_LABELS))],
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
