<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\UpdateInvoiceRequest;
use App\Models\Invoice;
use App\Models\PurchaseGroup;
use App\Models\Receipt;
use App\Services\ReceiptStorage;
use App\Services\SerialNumber;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    /**
     * Add an invoice to the group for the month.
     */
    public function store(StoreInvoiceRequest $request, PurchaseGroup $group, SerialNumber $serials): RedirectResponse
    {
        $data = $request->validated();

        $serials->createInvoice($group, $data['month'], [
            'title' => $data['title'],
            'price' => $data['price'],
            'reason' => $data['reason'] ?? null,
            'type' => $data['type'],
            'receipt_id' => $data['receipt_id'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        Inertia::flash('success', 'تمت إضافة الفاتورة');

        return back();
    }

    /**
     * Update an invoice; a replaced receipt file is deleted.
     */
    public function update(UpdateInvoiceRequest $request, Invoice $invoice, ReceiptStorage $storage): RedirectResponse
    {
        $data = $request->validated();
        $previousReceiptId = $invoice->receipt_id;

        $invoice->update([
            'title' => $data['title'],
            'price' => $data['price'],
            'reason' => $data['reason'] ?? null,
            'type' => $data['type'],
            'receipt_id' => $data['receipt_id'] ?? null,
        ]);

        if ($previousReceiptId !== null && $previousReceiptId !== $invoice->receipt_id) {
            $storage->delete(Receipt::query()->find($previousReceiptId));
        }

        Inertia::flash('success', 'تم الحفظ');

        return back();
    }

    /**
     * Delete an invoice and its receipt file.
     */
    public function destroy(Invoice $invoice, ReceiptStorage $storage): RedirectResponse
    {
        $receipt = $invoice->receipt;

        $invoice->delete();
        $storage->delete($receipt);

        Inertia::flash('success', 'تم حذف الفاتورة');

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    public static function present(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'serial' => $invoice->serial,
            'title' => $invoice->title,
            'price' => (float) $invoice->price,
            'reason' => $invoice->reason,
            'type' => $invoice->type,
            'is_auto' => $invoice->is_auto,
            'month' => $invoice->month,
            'created_at' => $invoice->created_at?->toDateString(),
            'receipt' => $invoice->receipt !== null
                ? ['id' => $invoice->receipt->id, 'url' => $invoice->receipt->url()]
                : null,
        ];
    }
}
