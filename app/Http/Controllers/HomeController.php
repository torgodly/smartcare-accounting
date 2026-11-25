<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Custody;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\PurchaseGroup;
use App\Models\Treasury;
use App\Services\CustodyService;
use App\Services\Money;
use App\Services\PayrollCalculator;
use App\Services\RecurringInvoices;
use App\Services\Regions;
use App\Services\TreasuryLedger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Month summary of the three modules.
     */
    public function index(Request $request, PayrollCalculator $calculator, RecurringInvoices $recurring, TreasuryLedger $ledger, CustodyService $custodies): Response
    {
        $month = $this->selectedMonth($request);
        $recurring->ensureFor($month);
        $region = Regions::current($request);

        $employees = Employee::query()->inRegion($region)->get();
        $rows = array_filter($calculator->forEmployees($employees, $month), fn (array $row): bool => $row['started']);
        $totals = PayrollCalculator::totals($rows);

        $absenceCents = 0;
        $absentDays = 0;
        foreach ($rows as $row) {
            $absenceCents += Money::toCents($row['absence_deduction']);
            $absentDays += $row['absent_days'];
        }

        $trackedIds = $employees
            ->filter(fn (Employee $employee): bool => $employee->tracksAttendance() && $employee->start_month <= $month)
            ->pluck('id');

        $excusedDays = AttendanceRecord::query()
            ->whereIn('employee_id', $trackedIds)
            ->whereIn('status', ['excuse', 'leave'])
            ->whereBetween('date', [$month.'-01', $month.'-31'])
            ->count();

        $invoices = Invoice::query()
            ->where('month', $month)
            ->whereHas('group', fn ($query) => $query->inRegion($region))
            ->with('group:id,kind')
            ->get(['id', 'purchase_group_id', 'price', 'type', 'receipt_id']);
        [$expenseInvoices, $purchaseInvoices] = $invoices->partition(fn (Invoice $invoice): bool => $invoice->group->kind === PurchaseGroup::KIND_EXPENSE);

        $treasuries = Treasury::query()->inRegion($region)->ordered()->get();
        $balances = $ledger->balances($treasuries->modelKeys());

        $openCustodies = Custody::query()->inRegion($region)->where('status', Custody::STATUS_OPEN)->pluck('id')->all();
        $custodyStates = $custodies->states($openCustodies);

        return Inertia::render('Home', [
            'salaries' => [
                'employees' => count($rows),
                'total' => $totals['total'],
                'paid' => $totals['paid'],
                'remaining' => $totals['remaining'],
                'unpaid' => count(array_filter($rows, fn (array $row): bool => $row['status'] === PayrollCalculator::STATUS_UNPAID)),
                'partial' => count(array_filter($rows, fn (array $row): bool => $row['status'] === PayrollCalculator::STATUS_PARTIAL)),
            ],
            'purchases' => [
                'groups' => PurchaseGroup::query()->inRegion($region)->where('kind', PurchaseGroup::KIND_PURCHASE)->count(),
                ...PurchaseGroupController::summary($purchaseInvoices),
            ],
            'expenses' => [
                'groups' => PurchaseGroup::query()->inRegion($region)->where('kind', PurchaseGroup::KIND_EXPENSE)->count(),
                ...PurchaseGroupController::summary($expenseInvoices),
            ],
            'treasuries' => [
                'items' => $treasuries->map(fn (Treasury $treasury): array => [
                    ...TreasuryController::present($treasury),
                    'balance' => Money::fromCents($balances[$treasury->id]),
                ])->values(),
                'total' => Money::fromCents(array_sum($balances)),
            ],
            'custodies' => [
                'open' => count($openCustodies),
                'cash' => Money::fromCents(array_sum(array_map(fn (array $state): int => Money::toCents($state['cash']), $custodyStates))),
                'pending' => Money::fromCents(array_sum(array_map(fn (array $state): int => Money::toCents($state['pending']), $custodyStates))),
            ],
            'attendance' => [
                'absent_days' => $absentDays,
                'excused_days' => $excusedDays,
                'deduction' => Money::fromCents($absenceCents),
            ],
        ]);
    }
}
