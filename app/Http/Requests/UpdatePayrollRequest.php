<?php

namespace App\Http\Requests;

use App\Services\PaymentMethods;
use App\Services\Regions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePayrollRequest extends FormRequest
{
    /**
     * Treat empty money inputs as zero.
     */
    protected function prepareForValidation(): void
    {
        foreach (['bonus', 'manual_deduction', 'paid_amount'] as $key) {
            if ($this->input($key) === null || $this->input($key) === '') {
                $this->merge([$key => 0]);
            }
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'bonus' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'manual_deduction' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'paid_amount' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'treasury_id' => ['nullable', Rule::requiredIf(fn (): bool => (float) $this->input('paid_amount') > 0), 'integer', Regions::exists($this, 'treasuries')],
            'payment_method' => ['nullable', Rule::in(PaymentMethods::keys())],
            'account_number' => ['nullable', 'string', 'max:64'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'treasury_id.required' => 'اختر الخزينة التي صُرف منها الراتب',
        ];
    }
}
