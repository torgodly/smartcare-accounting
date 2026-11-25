<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustodyMovementRequest;
use App\Http\Requests\StoreCustodyRequest;
use App\Http\Requests\UpdateCustodyRequest;
use App\Models\Custody;
use App\Models\CustodyMovement;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\PurchaseGroup;
use App\Services\CustodyService;
use App\Services\Money;
use App\Services\Regions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustodyController extends Controller
{
    /**
     * Custodies of the selected region, open first.
     */
    public function index(Request $request, CustodyService $custodies): Response
    {
        $region = Regions::current($request);

        $list = Custody::query()
            ->inRegion($region)
            ->with('treasury')
            ->orderByRaw("case when status = 'open' then 0 else 1 end")
            ->orderByDesc('id')
            ->get();

        $states = $custodies->states($list->modelKeys());

        return Inertia::render('Custodies/Index', [
            'custodies' => $list->map(fn (Custody $custody): array => [
                ...self::present($custody),
                ...$states[$custody->id],
            ])->values(),
            'treasuries' => TreasuryController::options($region),
            'holders' => Employee::query()->inRegion($region)->ordered()->pluck('name')->values(),
        ]);
    }

    /**
     * One custody: its position, invoices and movements.
     */
    public function show(Request $request, Custody $custody, CustodyService $custodies): Response
    {
        $custody->load('treasury');

        $invoices = $custody->invoices()
            ->with(['receipt', 'group', 'settlement'])
            ->orderByRaw('case when custody_movement_id is null then 0 else 1 end')
            ->orderByDesc('month')
            ->orderByDesc('id')
            ->get();

        $movements = $custody->movements()->with('treasury')->orderByDesc('date')->orderByDesc('id')->get();

        return Inertia::render('Custodies/Show', [
            'custody' => [...self::present($custody), ...$custodies->state($custody)],
            'invoices' => $invoices->map(fn (Invoice $invoice): array => [
                ...InvoiceController::present($invoice),
                'group' => ['id' => $invoice->group->id, 'name' => $invoice->group->name, 'code' => $invoice->group->code, 'kind' => $invoice->group->kind],
                'settled_on' => $invoice->settlement?->date,
            ])->values(),
            'movements' => $movements->map(fn (CustodyMovement $movement): array => [
                'id' => $movement->id,
                'type' => $movement->type,
                'type_label' => CustodyMovement::LABELS[$movement->type],
                'amount' => (float) $movement->amount,
                'date' => $movement->date,
                'note' => $movement->note,
                'treasury' => $movement->treasury->name.' ('.(Regions::LABELS[$movement->treasury->region] ?? '').')',
            ])->values(),
            'groups' => PurchaseGroup::query()
                ->inRegion($custody->region)
                ->orderBy('kind')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (PurchaseGroup $group): array => PurchaseGroupController::presentGroup($group))
                ->values(),
            'treasuries' => TreasuryController::options(Regions::lockedFor($request) ?? Regions::ALL),
        ]);
    }

    /**
     * Open a custody and issue the float from the treasury.
     */
    public function store(StoreCustodyRequest $request, CustodyService $custodies): RedirectResponse
    {
        $custody = $custodies->open($request->validated(), $request->user()?->id);

        Inertia::flash('success', 'تم صرف العهدة لـ '.$custody->holder_name);

        return redirect()->route('custodies.show', ['custody' => $custody, 'month' => $this->selectedMonth($request)]);
    }

    /**
     * Rename the holder or the custody's purpose.
     */
    public function update(UpdateCustodyRequest $request, Custody $custody): RedirectResponse
    {
        $custody->update($request->validated());

        Inertia::flash('success', 'تم الحفظ');

        return back();
    }

    /**
     * Increase the float.
     */
    public function topUp(CustodyMovementRequest $request, Custody $custody, CustodyService $custodies): RedirectResponse
    {
        $data = $request->validated();
        $movement = $custodies->topUp($custody, Money::toCents($data['amount']), $data['date'], $data['note'] ?? null, $request->user()?->id, $data['treasury_id'] ?? null);

        Inertia::flash('success', 'تمت زيادة العهدة بـ '.Money::format((float) $movement->amount).' د.ل');

        return back();
    }

    /**
     * Renew the custody: the treasury pays back what the invoices spent.
     */
    public function replenish(CustodyMovementRequest $request, Custody $custody, CustodyService $custodies): RedirectResponse
    {
        $data = $request->validated();
        $movement = $custodies->replenish($custody, $data['date'], $data['note'] ?? null, $request->user()?->id, $data['treasury_id'] ?? null);

        Inertia::flash('success', 'تم تجديد العهدة بـ '.Money::format((float) $movement->amount).' د.ل');

        return back();
    }

    /**
     * Close the custody and settle the remaining cash.
     */
    public function close(CustodyMovementRequest $request, Custody $custody, CustodyService $custodies): RedirectResponse
    {
        $data = $request->validated();
        $custodies->close($custody, $data['date'], $data['note'] ?? null, $request->user()?->id);

        Inertia::flash('success', 'تم إغلاق العهدة');

        return back();
    }

    /**
     * Delete a custody that has no invoices (its movements go with it).
     */
    public function destroy(Request $request, Custody $custody): RedirectResponse
    {
        if ($custody->invoices()->exists()) {
            Inertia::flash('error', 'لا يمكن حذف عهدة عليها فواتير');

            return back();
        }

        $custody->delete();

        Inertia::flash('success', 'تم حذف العهدة');

        return redirect()->route('custodies.index', ['month' => $this->selectedMonth($request)]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function present(Custody $custody): array
    {
        return [
            'id' => $custody->id,
            'holder_name' => $custody->holder_name,
            'title' => $custody->title,
            'label' => $custody->label(),
            'region' => $custody->region,
            'region_label' => Regions::LABELS[$custody->region] ?? $custody->region,
            'status' => $custody->status,
            'closed_on' => $custody->closed_on,
            'treasury' => TreasuryController::present($custody->treasury),
            'opened_on' => $custody->created_at?->toDateString(),
        ];
    }

    /**
     * Open custodies for the invoice source select.
     *
     * @return list<array{id: int, label: string, region: string}>
     */
    public static function openOptions(string $region = Regions::ALL): array
    {
        return Custody::query()
            ->inRegion($region)
            ->where('status', Custody::STATUS_OPEN)
            ->orderBy('holder_name')
            ->get()
            ->map(fn (Custody $custody): array => ['id' => $custody->id, 'label' => $custody->label(), 'region' => $custody->region])
            ->values()
            ->all();
    }
}
