<?php

namespace App\Http\Controllers;

use App\Http\Requests\MarkAllAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Models\Employee;
use App\Services\AttendanceService;
use App\Services\Money;
use App\Services\Months;
use App\Services\PayrollCalculator;
use Carbon\Exceptions\InvalidFormatException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * The attendance page (daily table or monthly calendar).
     */
    public function index(Request $request, AttendanceService $attendance): Response
    {
        $month = $this->selectedMonth($request);
        $all = Employee::query()->ordered()->get();

        $employees = $all
            ->filter(fn (Employee $employee): bool => $employee->tracksAttendance() && $employee->start_month <= $month)
            ->values();

        $records = $attendance->monthRecords($employees, $month);

        $daysInMonth = Months::daysIn($month);
        $day = (int) $request->query('day', $month === Months::current() ? (int) now()->format('d') : 1);
        $day = max(1, min($daysInMonth, $day));

        $selectedEmployee = (int) $request->query('employee', (string) ($employees->first()->id ?? 0));
        if (! $employees->contains('id', $selectedEmployee)) {
            $selectedEmployee = $employees->first()->id ?? null;
        }

        return Inertia::render('Attendance/Index', [
            'view' => $request->query('view') === 'month' ? 'month' : 'day',
            'day' => $day,
            'selectedEmployee' => $selectedEmployee,
            'employees' => $employees->map(fn (Employee $employee): array => [
                ...PayrollController::presentEmployee($employee),
                'shift' => $attendance->shiftFor($employee),
            ]),
            'allEmployees' => $all->map(fn (Employee $employee): array => PayrollController::presentEmployee($employee))->values(),
            'noneCount' => $all->where('attendance_mode', Employee::MODE_NONE)->count(),
            'records' => $records,
            'counters' => $this->counters($employees, $records),
        ]);
    }

    /**
     * Save (or clear) one employee's day.
     */
    public function update(UpdateAttendanceRequest $request, Employee $employee, string $date, AttendanceService $attendance): JsonResponse
    {
        $date = $this->validDate($date);
        $data = $request->validated();

        $record = $attendance->save($employee, $date, $data['status'] ?? null, $data['check_in'] ?? null, $data['check_out'] ?? null, $data['note'] ?? null);

        return response()->json([
            'record' => $record !== null ? AttendanceService::present($record) : null,
        ]);
    }

    /**
     * Mark everyone without a status as present.
     */
    public function markAll(MarkAllAttendanceRequest $request, AttendanceService $attendance): JsonResponse
    {
        return response()->json([
            'count' => $attendance->markAll($this->validDate($request->validated('date'))),
        ]);
    }

    /**
     * Status counts and absence deduction per employee.
     *
     * @param  Collection<int, Employee>  $employees
     * @param  list<array{employee_id: int, status: string}>  $records
     * @return array<int, array{present: int, absent: int, excuse: int, leave: int, deduction: float}>
     */
    private function counters(Collection $employees, array $records): array
    {
        $counters = [];

        foreach ($employees as $employee) {
            $counts = ['present' => 0, 'absent' => 0, 'excuse' => 0, 'leave' => 0];

            foreach ($records as $record) {
                if ($record['employee_id'] === $employee->id && isset($counts[$record['status']])) {
                    $counts[$record['status']]++;
                }
            }

            $counters[$employee->id] = [
                'present' => $counts['present'],
                'absent' => $counts['absent'],
                'excuse' => $counts['excuse'],
                'leave' => $counts['leave'],
                'deduction' => Money::fromCents($counts['absent'] * PayrollCalculator::dayRateCents($employee)),
            ];
        }

        return $counters;
    }

    /**
     * Accept only real Y-m-d dates.
     */
    private function validDate(string $date): string
    {
        try {
            $parsed = Carbon::createFromFormat('!Y-m-d', $date);
        } catch (InvalidFormatException) {
            abort(404);
        }

        abort_if($parsed === null || $parsed->format('Y-m-d') !== $date, 404);

        return $date;
    }
}
