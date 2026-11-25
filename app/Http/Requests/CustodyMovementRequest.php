<?php

namespace App\Http\Requests;

use App\Services\Regions;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Top-up, replenish and close all take a date, an optional note and an optional treasury;
 * only the top-up takes an amount.
 */
class CustodyMovementRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $rules = [
            'date' => ['required', 'date_format:Y-m-d'],
            'note' => ['nullable', 'string', 'max:255'],
            'treasury_id' => ['nullable', 'integer', Regions::exists($this, 'treasuries')],
        ];

        if ($this->routeIs('custodies.top-up')) {
            $rules['amount'] = ['required', 'numeric', 'gt:0', 'max:9999999999'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'اكتب المبلغ',
            'amount.gt' => 'اكتب المبلغ',
            'amount.numeric' => 'اكتب المبلغ',
            'date.required' => 'اختر التاريخ',
        ];
    }
}
