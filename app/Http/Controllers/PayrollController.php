<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePayrollRequest;
use App\Models\Employee;
use App\Models\PayrollRecord;
use App\Services\Money;
use App\Services\Months;
use App\Services\PayrollCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    /**
     * The salaries page.
     */
    public function index(Request $request, PayrollCalculator $calculator): Response
    {
        $month = $this->selectedMonth($request);
        $employees = Employee::query()->ordered()->get();
        $payroll = $calculator->forEmployees($employees, $month);

        return Inertia::render('Salaries/Index', [
            'rows' => $employees->map(fn (Employee $employee): array => [
                'employee' => self::presentEmployee($employee),
                'payroll' => $payroll[$employee->id],
            ])->values(),
            'totals' => PayrollCalculator::totals($payroll),
        ]);
    }

    /**
     * Upsert the month's payroll record.
     */
    public function update(UpdatePayrollRequest $request, Employee $employee, string $month): RedirectResponse
    {
        $this->ensureMonth($employee, $month);

        $record = $this->recordFor($employee, $month);
        $record->fill($request->validated())->save();

        Inertia::flash('success', 'تم الحفظ');

        return back();
    }

    /**
     * Pay the full total of the month.
     */
    public function payFull(Employee $employee, string $month, PayrollCalculator $calculator): RedirectResponse
    {
        $this->ensureMonth($employee, $month);

        $total = $calculator->forMonth($employee, $month)['total'];

        $record = $this->recordFor($employee, $month);
        $record->paid_amount = number_format($total, 2, '.', '');
        $record->save();

        Inertia::flash('success', 'تم تسجيل دفع '.Money::format($total).' د.ل لـ '.$employee->name);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    public static function presentEmployee(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'name' => $employee->name,
            'job_title' => $employee->job_title,
            'base_salary' => (float) $employee->base_salary,
            'start_month' => $employee->start_month,
            'attendance_mode' => $employee->attendance_mode,
            'shift_start' => $employee->shift_start !== null ? substr($employee->shift_start, 0, 5) : null,
            'shift_end' => $employee->shift_end !== null ? substr($employee->shift_end, 0, 5) : null,
            'absence_day_rate' => $employee->absence_day_rate !== null ? (float) $employee->absence_day_rate : null,
            'day_rate' => Money::fromCents(PayrollCalculator::dayRateCents($employee)),
        ];
    }

    /**
     * The month's record, snapshotting the base salary on first save.
     */
    private function recordFor(Employee $employee, string $month): PayrollRecord
    {
        return PayrollRecord::query()->firstOrNew(
            ['employee_id' => $employee->id, 'month' => $month],
            ['base_salary' => $employee->base_salary],
        );
    }

    /**
     * Reject invalid months and months before the employee started.
     */
    private function ensureMonth(Employee $employee, string $month): void
    {
        abort_unless(Months::isValid($month), 404);

        if ($month < $employee->start_month) {
            abort(422, 'لم يبدأ احتساب راتب هذا الموظف في هذا الشهر');
        }
    }
}
