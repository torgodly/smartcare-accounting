<?php

namespace App\Http\Requests;

use App\Services\Regions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTreasuryTransactionRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['deposit', 'withdrawal', 'transfer'])],
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999'],
            'date' => ['required', 'date_format:Y-m-d'],
            'note' => ['nullable', 'string', 'max:255'],
            'to_treasury_id' => [
                'nullable',
                'required_if:type,transfer',
                'integer',
                Regions::exists($this, 'treasuries'),
                Rule::notIn([$this->route('treasury')?->id]),
            ],
        ];
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
            'to_treasury_id.required_if' => 'اختر الخزينة المحوَّل إليها',
            'to_treasury_id.not_in' => 'اختر خزينة أخرى',
        ];
    }
}
