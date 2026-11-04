<?php

namespace App\Http\Requests;

use App\Models\Employee;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceSettingsRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'work_start' => ['required', 'date_format:H:i'],
            'work_end' => ['required', 'date_format:H:i'],
            'employees' => ['array'],
            'employees.*.id' => ['required', 'integer', 'exists:employees,id'],
            'employees.*.attendance_mode' => ['required', Rule::in([Employee::MODE_TIME, Employee::MODE_NOTIME, Employee::MODE_NONE])],
            'employees.*.shift_start' => ['nullable', 'date_format:H:i'],
            'employees.*.shift_end' => ['nullable', 'date_format:H:i'],
            'employees.*.absence_day_rate' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'work_start.required' => 'اكتب بداية الدوام',
            'work_end.required' => 'اكتب نهاية الدوام',
        ];
    }
}
