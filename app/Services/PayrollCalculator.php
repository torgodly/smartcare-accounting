<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\PayrollRecord;
use Illuminate\Support\Collection;

/**
 * Salary math (spec 5.1). All sums run on integer cents.
 *
 * @phpstan-type PayrollRow array{
 *     employee_id: int,
 *     month: string,
 *     started: bool,
 *     has_record: bool,
 *     base: float,
 *     bonus: float,
 *     manual_deduction: float,
 *     absent_days: int,
 *     day_rate: float,
 *     absence_deduction: float,
 *     deduction: float,
 *     due: float,
 *     carry: float,
 *     total: float,
 *     paid: float,
 *     remaining: float,
 *     status: string,
 *     note: string|null,
 * }
 */
class PayrollCalculator
{
    public const MAX_MONTHS = 240;

    public const STATUS_PAID = 'paid';

    public const STATUS_PARTIAL = 'partial';

    public const STATUS_UNPAID = 'unpaid';

    public const STATUS_NOT_STARTED = 'not_started';

    /** @var array<int, array<string, PayrollRecord>> */
    private array $records = [];

    /** @var array<int, array<string, int>> */
    private array $absences = [];

    /**
     * Compute one employee's salary for a month.
     *
     * @return PayrollRow
     */
    public function forMonth(Employee $employee, string $month): array
    {
        return $this->forEmployees(collect([$employee]), $month)[$employee->id];
    }

    /**
     * Compute the month for many employees with two queries in total.
     *
     * @param  Collection<int, Employee>  $employees
     * @return array<int, PayrollRow>
     */
    public function forEmployees(Collection $employees, string $month): array
    {
        $this->load($employees, $month);

        $rows = [];

        foreach ($employees as $employee) {
            $series = $this->series($employee, $month);
            $rows[$employee->id] = $series[$month] ?? $this->notStarted($employee, $month);
        }

        return $rows;
    }

    /**
     * Every month from the start month to $until, newest first.
     *
     * @return list<PayrollRow>
     */
    public function history(Employee $employee, string $until, int $limit = 36): array
    {
        $this->load(collect([$employee]), $until);

        return array_slice(array_reverse(array_values($this->series($employee, $until))), 0, $limit);
    }

    /**
     * Twelve month tiles for the month picker.
     *
     * @param  Collection<int, Employee>  $employees
     * @return list<array{month: string, total: float, paid: float, remaining: float, employees: int, state: string}>
     */
    public function yearSummary(Collection $employees, int $year): array
    {
        $last = sprintf('%04d-12', $year);
        $this->load($employees, $last);

        $perEmployee = [];
        foreach ($employees as $employee) {
            $perEmployee[$employee->id] = $this->series($employee, $last);
        }

        $current = Months::current();
        $tiles = [];

        for ($number = 1; $number <= 12; $number++) {
            $month = sprintf('%04d-%02d', $year, $number);
            $total = $paid = $remaining = 0;
            $count = 0;

            foreach ($perEmployee as $series) {
                if (! isset($series[$month])) {
                    continue;
                }

                $count++;
                $total += Money::toCents($series[$month]['total']);
                $paid += Money::toCents($series[$month]['paid']);
                $remaining += Money::toCents($series[$month]['remaining']);
            }

            $state = match (true) {
                $count === 0 => 'none',
                $remaining <= 0 => 'paid',
                $month > $current => 'upcoming',
                $paid > 0 => 'partial',
                default => 'unpaid',
            };

            $tiles[] = [
                'month' => $month,
                'total' => Money::fromCents($total),
                'paid' => Money::fromCents($paid),
                'remaining' => Money::fromCents($remaining),
                'employees' => $count,
                'state' => $state,
            ];
        }

        return $tiles;
    }

    /**
     * Sum the money columns of started rows.
     *
     * @param  iterable<PayrollRow>  $rows
     * @return array{base: float, bonus: float, deduction: float, carry: float, total: float, paid: float, remaining: float}
     */
    public static function totals(iterable $rows): array
    {
        $keys = ['base', 'bonus', 'deduction', 'carry', 'total', 'paid', 'remaining'];
        $sums = array_fill_keys($keys, 0);

        foreach ($rows as $row) {
            if (! $row['started']) {
                continue;
            }

            foreach ($keys as $key) {
                $sums[$key] += Money::toCents($row[$key]);
            }
        }

        return array_map(fn (int $cents): float => Money::fromCents($cents), $sums);
    }

    /**
     * The absence deduction for one day, in cents.
     */
    public static function dayRateCents(Employee $employee, ?int $baseCents = null): int
    {
        if ($employee->absence_day_rate !== null) {
            return Money::toCents($employee->absence_day_rate);
        }

        return (int) round(($baseCents ?? Money::toCents($employee->base_salary)) / 30);
    }

    /**
     * Load payroll and absence rows for the employees up to $until.
     *
     * @param  Collection<int, Employee>  $employees
     */
    private function load(Collection $employees, string $until): void
    {
        $ids = $employees->pluck('id')->all();

        $this->records = [];
        $this->absences = [];

        PayrollRecord::query()
            ->whereIn('employee_id', $ids)
            ->where('month', '<=', $until)
            ->get()
            ->each(function (PayrollRecord $record): void {
                $this->records[$record->employee_id][$record->month] = $record;
            });

        AttendanceRecord::query()
            ->whereIn('employee_id', $ids)
            ->where('status', 'absent')
            ->where('date', '<', Months::firstDay(Months::add($until, 1))->toDateString())
            ->get(['employee_id', 'date'])
            ->each(function (AttendanceRecord $record): void {
                $month = Months::ofDate($record->date);
                $this->absences[$record->employee_id][$month] = ($this->absences[$record->employee_id][$month] ?? 0) + 1;
            });
    }

    /**
     * Walk from the start month to $until, carrying unpaid amounts forward.
     *
     * @return array<string, PayrollRow>
     */
    private function series(Employee $employee, string $until): array
    {
        if ($until < $employee->start_month) {
            return [];
        }

        $from = $employee->start_month;
        if (Months::diff($from, $until) >= self::MAX_MONTHS) {
            $from = Months::add($until, -(self::MAX_MONTHS - 1));
        }

        $rows = [];
        $carry = 0;

        for ($month = $from; $month <= $until; $month = Months::add($month, 1)) {
            $row = $this->computeMonth($employee, $month, $carry);
            $carry = Money::toCents($row['remaining']);
            $rows[$month] = $row;
        }

        return $rows;
    }

    /**
     * @return PayrollRow
     */
    private function computeMonth(Employee $employee, string $month, int $carry): array
    {
        $record = $this->records[$employee->id][$month] ?? null;

        $base = Money::toCents($record !== null ? $record->base_salary : $employee->base_salary);
        $bonus = Money::toCents($record?->bonus);
        $manual = Money::toCents($record?->manual_deduction);
        $paid = Money::toCents($record?->paid_amount);

        $dayRate = self::dayRateCents($employee, $base);
        $absentDays = $employee->tracksAttendance() ? ($this->absences[$employee->id][$month] ?? 0) : 0;
        $absence = $absentDays * $dayRate;

        $due = $base + $bonus - $manual - $absence;
        $total = $due + $carry;
        $remaining = $total - $paid;

        return [
            'employee_id' => $employee->id,
            'month' => $month,
            'started' => true,
            'has_record' => $record !== null,
            'base' => Money::fromCents($base),
            'bonus' => Money::fromCents($bonus),
            'manual_deduction' => Money::fromCents($manual),
            'absent_days' => $absentDays,
            'day_rate' => Money::fromCents($dayRate),
            'absence_deduction' => Money::fromCents($absence),
            'deduction' => Money::fromCents($manual + $absence),
            'due' => Money::fromCents($due),
            'carry' => Money::fromCents($carry),
            'total' => Money::fromCents($total),
            'paid' => Money::fromCents($paid),
            'remaining' => Money::fromCents($remaining),
            'status' => self::status($remaining, $paid),
            'note' => $record?->note,
        ];
    }

    /**
     * Status rule 7, on cents.
     */
    private static function status(int $remaining, int $paid): string
    {
        if ($remaining <= 0) {
            return self::STATUS_PAID;
        }

        return $paid > 0 ? self::STATUS_PARTIAL : self::STATUS_UNPAID;
    }

    /**
     * @return PayrollRow
     */
    private function notStarted(Employee $employee, string $month): array
    {
        $base = Money::toCents($employee->base_salary);

        return [
            'employee_id' => $employee->id,
            'month' => $month,
            'started' => false,
            'has_record' => false,
            'base' => Money::fromCents($base),
            'bonus' => 0.0,
            'manual_deduction' => 0.0,
            'absent_days' => 0,
            'day_rate' => Money::fromCents(self::dayRateCents($employee, $base)),
            'absence_deduction' => 0.0,
            'deduction' => 0.0,
            'due' => 0.0,
            'carry' => 0.0,
            'total' => 0.0,
            'paid' => 0.0,
            'remaining' => 0.0,
            'status' => self::STATUS_NOT_STARTED,
            'note' => null,
        ];
    }
}
