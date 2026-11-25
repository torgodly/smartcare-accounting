<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use App\Services\Months;
use App\Services\Regions;
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
            'treasury_id' => ['nullable', 'required_without:custody_id', 'prohibits:custody_id', 'integer', Regions::exists($this, 'treasuries')],
            'custody_id' => ['nullable', 'required_without:treasury_id', 'integer', Regions::exists($this, 'custodies')->where('status', 'open')],
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
            'treasury_id.required_without' => 'اختر مصدر الدفع (خزينة أو عهدة)',
            'custody_id.required_without' => 'اختر مصدر الدفع (خزينة أو عهدة)',
            'treasury_id.prohibits' => 'اختر خزينة أو عهدة، وليس الاثنين',
            'custody_id.exists' => 'هذه العهدة مغلقة',
        ];
    }
}
