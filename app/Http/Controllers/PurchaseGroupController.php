<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseGroupRequest;
use App\Http\Requests\UpdatePurchaseGroupRequest;
use App\Models\Invoice;
use App\Models\PurchaseGroup;
use App\Models\Receipt;
use App\Services\Money;
use App\Services\ReceiptStorage;
use App\Services\RecurringInvoices;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseGroupController extends Controller
{
    /**
     * The purchase groups grid.
     */
    public function index(Request $request, RecurringInvoices $recurring): Response
    {
        $month = $this->selectedMonth($request);
        $recurring->ensureFor($month);

        $groups = PurchaseGroup::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->with(['invoices' => fn ($query) => $query->where('month', $month)])
            ->get();

        return Inertia::render('Purchases/Index', [
            'groups' => $groups->map(fn (PurchaseGroup $group): array => [
                'id' => $group->id,
                'name' => $group->name,
                'code' => $group->code,
                ...self::summary($group->invoices),
            ])->values(),
        ]);
    }

    /**
     * One group's invoices for the month.
     */
    public function show(Request $request, PurchaseGroup $group, RecurringInvoices $recurring): Response
    {
        $month = $this->selectedMonth($request);
        $recurring->ensureFor($month);

        $invoices = $group->invoices()
            ->where('month', $month)
            ->with('receipt')
            ->orderBy('sequence')
            ->get();

        return Inertia::render('Purchases/Show', [
            'group' => ['id' => $group->id, 'name' => $group->name, 'code' => $group->code],
            'invoices' => $invoices->map(fn (Invoice $invoice): array => InvoiceController::present($invoice))->values(),
            'summary' => self::summary($invoices),
        ]);
    }

    /**
     * Create a group and open it.
     */
    public function store(StorePurchaseGroupRequest $request): RedirectResponse
    {
        $group = PurchaseGroup::query()->create($request->validated());

        Inertia::flash('success', 'تمت إضافة المجموعة');

        return redirect()->route('purchase-groups.show', ['group' => $group, 'month' => $this->selectedMonth($request)]);
    }

    /**
     * Rename a group or change its code (old serials stay as they are).
     */
    public function update(UpdatePurchaseGroupRequest $request, PurchaseGroup $group): RedirectResponse
    {
        $group->update($request->validated());

        Inertia::flash('success', 'تم الحفظ');

        return back();
    }

    /**
     * Delete a group with every invoice in every month and their receipt files.
     */
    public function destroy(Request $request, PurchaseGroup $group, ReceiptStorage $storage): RedirectResponse
    {
        $receiptIds = $group->invoices()->whereNotNull('receipt_id')->pluck('receipt_id');

        DB::transaction(function () use ($group): void {
            $group->invoices()->update(['recurring_root_id' => null]);
            $group->delete();
        });

        Receipt::query()->whereIn('id', $receiptIds)->get()->each(fn (Receipt $receipt) => $storage->delete($receipt));

        Inertia::flash('success', 'تم حذف المجموعة');

        return redirect()->route('purchase-groups.index', ['month' => $this->selectedMonth($request)]);
    }

    /**
     * Month totals of a set of invoices.
     *
     * @param  iterable<Invoice>  $invoices
     * @return array{total: float, count: int, recurring: int, once: int, missing_receipts: int, with_receipts: int}
     */
    public static function summary(iterable $invoices): array
    {
        $total = 0;
        $count = $recurring = $missing = 0;

        foreach ($invoices as $invoice) {
            $count++;
            $total += Money::toCents($invoice->price);
            $recurring += $invoice->type === Invoice::TYPE_RECURRING ? 1 : 0;
            $missing += $invoice->receipt_id === null ? 1 : 0;
        }

        return [
            'total' => Money::fromCents($total),
            'count' => $count,
            'recurring' => $recurring,
            'once' => $count - $recurring,
            'missing_receipts' => $missing,
            'with_receipts' => $count - $missing,
        ];
    }
}
