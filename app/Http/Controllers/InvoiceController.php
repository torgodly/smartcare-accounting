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
use Illuminate\Validation\ValidationException;
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
            ...self::source($data),
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
        $source = self::source($data);

        if ($invoice->isSettled() && (bccomp((string) $data['price'], (string) $invoice->price, 2) !== 0 || $source['custody_id'] !== $invoice->custody_id)) {
            throw ValidationException::withMessages(['price' => 'تم تعويض هذه الفاتورة في العهدة، لا يمكن تغيير السعر أو مصدر الدفع']);
        }

        $invoice->update([
            'title' => $data['title'],
            'price' => $data['price'],
            ...$source,
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
     * The invoice's funding: a treasury directly, or a custody (whose treasury pays on renewal).
     *
     * @param  array<string, mixed>  $data
     * @return array{treasury_id: int|null, custody_id: int|null}
     */
    private static function source(array $data): array
    {
        $custodyId = isset($data['custody_id']) ? (int) $data['custody_id'] : null;

        return [
            'treasury_id' => $custodyId === null && isset($data['treasury_id']) ? (int) $data['treasury_id'] : null,
            'custody_id' => $custodyId,
        ];
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
            'treasury_id' => $invoice->treasury_id,
            'custody_id' => $invoice->custody_id,
            'source_label' => $invoice->custody_id !== null
                ? 'عهدة: '.($invoice->custody?->label() ?? '')
                : ($invoice->treasury?->name ?? ''),
            'settled' => $invoice->isSettled(),
            'created_at' => $invoice->created_at?->toDateString(),
            'receipt' => $invoice->receipt !== null
                ? ['id' => $invoice->receipt->id, 'url' => $invoice->receipt->url()]
                : null,
        ];
    }
}
