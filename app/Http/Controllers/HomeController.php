<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\PurchaseGroup;
use App\Services\Money;
use App\Services\PayrollCalculator;
use App\Services\RecurringInvoices;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Month summary of the three modules.
     */
    public function index(Request $request, PayrollCalculator $calculator, RecurringInvoices $recurring): Response
    {
        $month = $this->selectedMonth($request);
        $recurring->ensureFor($month);

        $employees = Employee::query()->get();
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

        $invoices = Invoice::query()->where('month', $month)->get(['id', 'price', 'type', 'receipt_id']);

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
                'groups' => PurchaseGroup::query()->count(),
                ...PurchaseGroupController::summary($invoices),
            ],
            'attendance' => [
                'absent_days' => $absentDays,
                'excused_days' => $excusedDays,
                'deduction' => Money::fromCents($absenceCents),
            ],
        ]);
    }
}
