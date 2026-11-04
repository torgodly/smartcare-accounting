<?php

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\Setting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('the attendance page hides employees without attendance', function () {
    Employee::factory()->create(['start_month' => '2026-10']);
    Employee::factory()->create(['start_month' => '2026-10', 'attendance_mode' => Employee::MODE_NONE]);

    $this->get(route('attendance.index', ['month' => '2026-11', 'day' => 3]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Attendance/Index')
            ->where('day', 3)
            ->where('view', 'day')
            ->has('employees', 1)
            ->where('noneCount', 1));
});

test('present fills the shift times and has no reason', function () {
    $employee = Employee::factory()->create(['shift_start' => '09:00', 'shift_end' => null]);

    $this->putJson(route('attendance.update', [$employee, '2026-11-03']), ['status' => 'present', 'note' => 'ignored'])
        ->assertOk()
        ->assertJsonPath('record.check_in', '09:00')
        ->assertJsonPath('record.check_out', '16:00')
        ->assertJsonPath('record.note', null);
});

test('edited times are kept', function () {
    $employee = Employee::factory()->create();

    $this->putJson(route('attendance.update', [$employee, '2026-11-03']), ['status' => 'present', 'check_in' => '08:10', 'check_out' => '15:30'])
        ->assertJsonPath('record.check_in', '08:10')
        ->assertJsonPath('record.check_out', '15:30');
});

test('no-time employees get no times', function () {
    $employee = Employee::factory()->create(['attendance_mode' => Employee::MODE_NOTIME]);

    $this->putJson(route('attendance.update', [$employee, '2026-11-03']), ['status' => 'present'])
        ->assertJsonPath('record.check_in', null);
});

test('switching away from present clears the times and keeps the reason', function () {
    $employee = Employee::factory()->create();
    AttendanceRecord::factory()->for($employee)->create(['date' => '2026-11-03']);

    $this->putJson(route('attendance.update', [$employee, '2026-11-03']), ['status' => 'excuse', 'check_in' => '08:00', 'note' => 'موعد طبي'])
        ->assertJsonPath('record.status', 'excuse')
        ->assertJsonPath('record.check_in', null)
        ->assertJsonPath('record.note', 'موعد طبي');
});

test('a null status clears the day', function () {
    $employee = Employee::factory()->create();
    AttendanceRecord::factory()->for($employee)->create(['date' => '2026-11-03']);

    $this->putJson(route('attendance.update', [$employee, '2026-11-03']), ['status' => null])
        ->assertJsonPath('record', null);

    expect(AttendanceRecord::query()->count())->toBe(0);
});

test('invalid dates are rejected', function () {
    $employee = Employee::factory()->create();

    $this->putJson(route('attendance.update', [$employee, '2026-02-30']), ['status' => 'present'])->assertNotFound();
});

test('mark all skips employees with a status, without attendance or not started', function () {
    $ready = Employee::factory()->create(['start_month' => '2026-10', 'attendance_mode' => Employee::MODE_NOTIME]);
    $hasStatus = Employee::factory()->create(['start_month' => '2026-10']);
    Employee::factory()->create(['start_month' => '2026-10', 'attendance_mode' => Employee::MODE_NONE]);
    Employee::factory()->create(['start_month' => '2026-12']);
    AttendanceRecord::factory()->for($hasStatus)->create(['date' => '2026-11-03', 'status' => 'absent']);

    $this->postJson(route('attendance.mark-all'), ['date' => '2026-11-03'])
        ->assertOk()
        ->assertJsonPath('count', 1);

    expect(AttendanceRecord::query()->where('employee_id', $ready->id)->value('status'))->toBe('present')
        ->and(AttendanceRecord::query()->where('employee_id', $hasStatus->id)->value('status'))->toBe('absent');

    $this->postJson(route('attendance.mark-all'), ['date' => '2026-11-03'])->assertJsonPath('count', 0);
});

test('settings save default hours and each employee in one request', function () {
    $employee = Employee::factory()->create(['absence_day_rate' => 40]);

    $this->put(route('attendance.settings'), [
        'work_start' => '07:30',
        'work_end' => '15:00',
        'employees' => [
            ['id' => $employee->id, 'attendance_mode' => 'time', 'shift_start' => '09:00', 'shift_end' => '17:00', 'absence_day_rate' => null],
        ],
    ])->assertRedirect()->assertInertiaFlash('success', 'تم حفظ الإعدادات');

    expect(Setting::workHours())->toBe(['work_start' => '07:30', 'work_end' => '15:00']);

    $employee->refresh();
    expect(substr((string) $employee->shift_start, 0, 5))->toBe('09:00')
        ->and($employee->absence_day_rate)->toBeNull();
});

test('only absent days reach the salary', function () {
    $employee = Employee::factory()->create(['base_salary' => 3000, 'start_month' => '2026-11']);

    foreach (['present', 'absent', 'excuse', 'leave'] as $index => $status) {
        $this->putJson(route('attendance.update', [$employee, '2026-11-0'.($index + 1)]), ['status' => $status]);
    }

    $this->get(route('salaries.index', ['month' => '2026-11']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('rows.0.payroll.absent_days', 1)
            ->where('rows.0.payroll.absence_deduction', 100));
});
