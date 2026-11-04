<?php

namespace App\Http\Requests;

use App\Services\Months;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'job_title' => ['nullable', 'string', 'max:120'],
            'base_salary' => ['required', 'numeric', 'min:0', 'max:9999999999'],
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
            'start_month.required' => 'اختر شهر بداية الاحتساب',
        ];
    }
}
