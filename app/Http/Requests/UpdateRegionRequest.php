<?php

namespace App\Http\Requests;

use App\Services\Regions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRegionRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'region' => ['required', Rule::in([...Regions::keys(), Regions::ALL])],
        ];
    }
}
