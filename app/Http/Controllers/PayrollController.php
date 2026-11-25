<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePayrollRequest;
use App\Models\Employee;
use App\Models\PayrollRecord;
use App\Models\Treasury;
use App\Services\Money;
use App\Services\Months;
use App\Services\PaymentMethods;
use App\Services\PayrollCalculator;
use App\Services\Regions;
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
        $employees = Employee::query()->inRegion(Regions::current($request))->ordered()->get();
        $payroll = $calculator->forEmployees($employees, $month);

        return Inertia::render('Salaries/Index', [
            'rows' => $employees->map(fn (Employee $employee): array => [
                'employee' => self::presentEmployee($employee),
                'payroll' => $payroll[$employee->id],
            ])->values(),
            'totals' => PayrollCalculator::totals($payroll),
            'treasuries' => TreasuryController::options(Regions::current($request)),
        ]);
    }

    /**
     * Upsert the month's payroll record.
     */
    public function update(UpdatePayrollRequest $request, Employee $employee, string $month): RedirectResponse
    {
        $this->ensureMonth($employee, $month);

        $record = $this->recordFor($employee, $month);
        $record->fill($request->validated());

        if ((float) $record->paid_amount > 0) {
            $record->payment_method ??= $employee->payment_method;
        } else {
            $record->treasury_id = null;
        }

        $record->save();

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
        $record->treasury_id ??= Treasury::defaultFor($employee->region)?->id;

        if ($record->treasury_id === null) {
            abort(422, 'أضف خزينة لمنطقة '.Regions::LABELS[$employee->region].' أولاً');
        }

        $record->paid_amount = number_format($total, 2, '.', '');
        $record->payment_method ??= $employee->payment_method;
        $record->account_number ??= $employee->account_number;
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
            'region' => $employee->region,
            'region_label' => Regions::LABELS[$employee->region] ?? $employee->region,
            'payment_method' => $employee->payment_method,
            'payment_method_label' => PaymentMethods::label($employee->payment_method),
            'account_number' => $employee->account_number,
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
