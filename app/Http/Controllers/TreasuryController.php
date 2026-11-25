<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTreasuryRequest;
use App\Http\Requests\UpdateTreasuryRequest;
use App\Models\Treasury;
use App\Services\Money;
use App\Services\Regions;
use App\Services\TreasuryLedger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TreasuryController extends Controller
{
    /**
     * Treasuries of the selected region with their balances.
     */
    public function index(Request $request, TreasuryLedger $ledger): Response
    {
        $treasuries = Treasury::query()->inRegion(Regions::current($request))->ordered()->get();
        $balances = $ledger->balances($treasuries->modelKeys());

        return Inertia::render('Treasuries/Index', [
            'treasuries' => $treasuries->map(fn (Treasury $treasury): array => [
                ...self::present($treasury),
                'balance' => Money::fromCents($balances[$treasury->id]),
            ])->values(),
            'total' => Money::fromCents(array_sum($balances)),
            'allTreasuries' => self::options(Regions::lockedFor($request) ?? Regions::ALL),
        ]);
    }

    /**
     * One treasury's ledger for the month.
     */
    public function show(Request $request, Treasury $treasury, TreasuryLedger $ledger): Response
    {
        $month = $this->selectedMonth($request);

        return Inertia::render('Treasuries/Show', [
            'treasury' => [
                ...self::present($treasury),
                'balance' => Money::fromCents($ledger->balance($treasury)),
                'can_delete' => ! $treasury->hasActivity(),
            ],
            'ledger' => $ledger->month($treasury, $month),
            'allTreasuries' => self::options(Regions::lockedFor($request) ?? Regions::ALL),
        ]);
    }

    /**
     * Create a treasury.
     */
    public function store(StoreTreasuryRequest $request): RedirectResponse
    {
        Treasury::query()->create($request->validated());

        Inertia::flash('success', 'تمت إضافة الخزينة');

        return back();
    }

    /**
     * Rename a treasury or move it to the other region.
     */
    public function update(UpdateTreasuryRequest $request, Treasury $treasury): RedirectResponse
    {
        $treasury->update($request->validated());

        Inertia::flash('success', 'تم الحفظ');

        return back();
    }

    /**
     * Delete a treasury that was never used.
     */
    public function destroy(Request $request, Treasury $treasury): RedirectResponse
    {
        if ($treasury->hasActivity()) {
            Inertia::flash('error', 'لا يمكن حذف خزينة عليها حركات');

            return back();
        }

        $treasury->delete();

        Inertia::flash('success', 'تم حذف الخزينة');

        return redirect()->route('treasuries.index', ['month' => $this->selectedMonth($request)]);
    }

    /**
     * @return array{id: int, name: string, region: string, region_label: string}
     */
    public static function present(Treasury $treasury): array
    {
        return [
            'id' => $treasury->id,
            'name' => $treasury->name,
            'region' => $treasury->region,
            'region_label' => Regions::LABELS[$treasury->region] ?? $treasury->region,
        ];
    }

    /**
     * Every treasury for selects, optionally limited to a region.
     *
     * @return list<array{id: int, name: string, region: string, region_label: string}>
     */
    public static function options(string $region = Regions::ALL): array
    {
        return Treasury::query()
            ->inRegion($region)
            ->ordered()
            ->get()
            ->map(fn (Treasury $treasury): array => self::present($treasury))
            ->values()
            ->all();
    }
}
