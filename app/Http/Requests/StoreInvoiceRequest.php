<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use App\Services\Months;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'month' => ['required', 'string', function (string $attribute, mixed $value, Closure $fail): void {
                if (! Months::isValid($value)) {
                    $fail('الشهر غير صحيح');
                }
            }],
            ...$this->invoiceRules(),
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    protected function invoiceRules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'price' => ['required', 'numeric', 'gt:0', 'max:9999999999'],
            'reason' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', Rule::in([Invoice::TYPE_ONCE, Invoice::TYPE_RECURRING])],
            'receipt_id' => ['nullable', 'uuid', 'exists:receipts,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'اكتب عنوان الفاتورة',
            'price.required' => 'اكتب السعر',
            'price.gt' => 'اكتب السعر',
            'price.numeric' => 'اكتب السعر',
            'type.required' => 'اختر نوع الفاتورة',
        ];
    }
}
