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
use App\Services\Regions;
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
        return $this->grid($request, $recurring, PurchaseGroup::KIND_PURCHASE);
    }

    /**
     * The expense groups grid.
     */
    public function expenses(Request $request, RecurringInvoices $recurring): Response
    {
        return $this->grid($request, $recurring, PurchaseGroup::KIND_EXPENSE);
    }

    /**
     * Groups of one kind in the selected region with the month's totals.
     */
    private function grid(Request $request, RecurringInvoices $recurring, string $kind): Response
    {
        $month = $this->selectedMonth($request);
        $recurring->ensureFor($month);

        $groups = PurchaseGroup::query()
            ->inRegion(Regions::current($request))
            ->where('kind', $kind)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->with(['invoices' => fn ($query) => $query->where('month', $month)])
            ->get();

        return Inertia::render('Purchases/Index', [
            'kind' => $kind,
            'groups' => $groups->map(fn (PurchaseGroup $group): array => [
                ...self::presentGroup($group),
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
            ->with(['receipt', 'treasury', 'custody'])
            ->orderBy('sequence')
            ->get();

        return Inertia::render('Purchases/Show', [
            'group' => self::presentGroup($group),
            'treasuries' => TreasuryController::options($group->region),
            'custodies' => CustodyController::openOptions($group->region),
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

        return redirect()->route($group->kind === PurchaseGroup::KIND_EXPENSE ? 'expenses.index' : 'purchase-groups.index', ['month' => $this->selectedMonth($request)]);
    }

    /**
     * @return array{id: int, name: string, code: string, region: string, region_label: string, kind: string}
     */
    public static function presentGroup(PurchaseGroup $group): array
    {
        return [
            'id' => $group->id,
            'name' => $group->name,
            'code' => $group->code,
            'region' => $group->region,
            'region_label' => Regions::LABELS[$group->region] ?? $group->region,
            'kind' => $group->kind,
        ];
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
