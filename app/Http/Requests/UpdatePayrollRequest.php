<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
