<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\Setting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Attendance rules (spec 5.2 and 5.3).
 */
class AttendanceService
{
    /**
     * The employee's shift, falling back to the default work hours.
     *
     * @param  array{work_start: string, work_end: string}|null  $workHours
     * @return array{start: string, end: string}
     */
    public function shiftFor(Employee $employee, ?array $workHours = null): array
    {
        $workHours ??= Setting::workHours();

        return [
            'start' => self::time($employee->shift_start) ?? $workHours['work_start'],
            'end' => self::time($employee->shift_end) ?? $workHours['work_end'],
        ];
    }

    /**
     * Save one day. A null status clears the day.
     */
    public function save(Employee $employee, string $date, ?string $status, ?string $checkIn = null, ?string $checkOut = null, ?string $note = null): ?AttendanceRecord
    {
        if ($status === null) {
            AttendanceRecord::query()->where('employee_id', $employee->id)->where('date', $date)->delete();

            return null;
        }

        $attributes = ['status' => $status, 'check_in' => null, 'check_out' => null, 'note' => null];

        if ($status === 'present') {
            if ($employee->attendance_mode === Employee::MODE_TIME) {
                $shift = $this->shiftFor($employee);
                $attributes['check_in'] = self::time($checkIn) ?? $shift['start'];
                $attributes['check_out'] = self::time($checkOut) ?? $shift['end'];
            }
        } else {
            $attributes['note'] = filled($note) ? trim((string) $note) : null;
        }

        return AttendanceRecord::query()->updateOrCreate(
            ['employee_id' => $employee->id, 'date' => $date],
            $attributes,
        );
    }

    /**
     * Mark everyone without a status on the date as present (rule 5.2.4).
     */
    public function markAll(string $date): int
    {
        $month = Months::ofDate($date);
        $workHours = Setting::workHours();

        $employees = Employee::query()
            ->where('attendance_mode', '!=', Employee::MODE_NONE)
            ->where('start_month', '<=', $month)
            ->whereDoesntHave('attendanceRecords', fn ($query) => $query->where('date', $date))
            ->get();

        DB::transaction(function () use ($employees, $date, $workHours): void {
            foreach ($employees as $employee) {
                $shift = $this->shiftFor($employee, $workHours);
                $timed = $employee->attendance_mode === Employee::MODE_TIME;

                AttendanceRecord::query()->create([
                    'employee_id' => $employee->id,
                    'date' => $date,
                    'status' => 'present',
                    'check_in' => $timed ? $shift['start'] : null,
                    'check_out' => $timed ? $shift['end'] : null,
                ]);
            }
        });

        return $employees->count();
    }

    /**
     * All records of the month for the given employees.
     *
     * @param  Collection<int, Employee>  $employees
     * @return list<array{employee_id: int, date: string, status: string, check_in: string|null, check_out: string|null, note: string|null}>
     */
    public function monthRecords(Collection $employees, string $month): array
    {
        return array_values(AttendanceRecord::query()
            ->whereIn('employee_id', $employees->pluck('id'))
            ->whereBetween('date', [$month.'-01', $month.'-31'])
            ->orderBy('date')
            ->get()
            ->map(fn (AttendanceRecord $record): array => self::present($record))
            ->all());
    }

    /**
     * @return array{employee_id: int, date: string, status: string, check_in: string|null, check_out: string|null, note: string|null}
     */
    public static function present(AttendanceRecord $record): array
    {
        return [
            'employee_id' => $record->employee_id,
            'date' => substr($record->date, 0, 10),
            'status' => $record->status,
            'check_in' => self::time($record->check_in),
            'check_out' => self::time($record->check_out),
            'note' => $record->note,
        ];
    }

    /**
     * Normalise "08:00:00" or "8:00" to "08:00"; empty values become null.
     */
    public static function time(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        if (preg_match('/^(\d{1,2}):(\d{2})/', trim($value), $matches) !== 1) {
            return null;
        }

        return sprintf('%02d:%s', (int) $matches[1], $matches[2]);
    }
}
