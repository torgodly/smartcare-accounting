<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use App\Services\Regions;

class UpdateInvoiceRequest extends StoreInvoiceRequest
{
    /**
     * Without a new treasury or custody the invoice keeps the one it has.
     */
    protected function prepareForValidation(): void
    {
        $invoice = $this->route('invoice');

        if ($invoice instanceof Invoice && ! $this->filled('treasury_id') && ! $this->filled('custody_id')) {
            $this->merge(['treasury_id' => $invoice->treasury_id, 'custody_id' => $invoice->custody_id]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $rules = $this->invoiceRules();

        // A settled invoice may stay on its (now closed) custody.
        $invoice = $this->route('invoice');
        if ($invoice instanceof Invoice && $invoice->custody_id !== null && (int) $this->input('custody_id') === $invoice->custody_id) {
            $rules['custody_id'] = ['nullable', 'required_without:treasury_id', 'integer', Regions::exists($this, 'custodies')];
        }

        return $rules;
    }
}
