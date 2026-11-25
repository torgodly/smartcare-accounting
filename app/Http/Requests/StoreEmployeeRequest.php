<?php

namespace App\Http\Requests;

use App\Services\Months;
use App\Services\PaymentMethods;
use App\Services\Regions;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    /**
     * Missing region and payment method keep the employee's values (or the defaults for a new one).
     */
    protected function prepareForValidation(): void
    {
        $employee = $this->route('employee');

        $this->merge([
            'region' => Regions::lockedFor($this) ?? ($this->input('region') ?: ($employee?->region ?? Regions::defaultFor($this))),
            'payment_method' => $this->input('payment_method') ?: ($employee?->payment_method ?? PaymentMethods::CASH),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'job_title' => ['nullable', 'string', 'max:120'],
            'region' => ['required', Rule::in(Regions::keys())],
            'base_salary' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'payment_method' => ['required', Rule::in(PaymentMethods::keys())],
            'account_number' => ['nullable', 'string', 'max:64'],
            'start_month' => ['required', 'string', function (string $attribute, mixed $value, Closure $fail): void {
                if (! Months::isValid($value)) {
                    $fail('اختر شهر بداية الاحتساب');
                }
            }],
            'absence_day_rate' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'اكتب اسم الموظف',
            'base_salary.required' => 'اكتب الراتب الأساسي',
            'region.required' => 'اختر المنطقة',
            'payment_method.required' => 'اختر نوع الخلاص',
            'start_month.required' => 'اختر شهر بداية الاحتساب',
        ];
    }
}
