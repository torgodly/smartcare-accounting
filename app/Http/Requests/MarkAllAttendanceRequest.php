<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkAllAttendanceRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d'],
        ];
    }
}
