<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReceiptRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'image', 'max:15360'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'فشل رفع الصورة',
            'file.file' => 'فشل رفع الصورة',
            'file.image' => 'فشل رفع الصورة',
            'file.uploaded' => 'فشل رفع الصورة',
            'file.max' => 'فشل رفع الصورة: الحجم أكبر من 15 ميغابايت',
        ];
    }
}
