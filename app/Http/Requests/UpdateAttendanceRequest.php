<?php

namespace App\Http\Requests;

use App\Models\AttendanceRecord;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['present', 'nullable', Rule::in(AttendanceRecord::STATUSES)],
            'check_in' => ['nullable', 'date_format:H:i'],
            'check_out' => ['nullable', 'date_format:H:i'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
