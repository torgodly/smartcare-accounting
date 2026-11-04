<?php

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\PayrollRecord;
use App\Services\PayrollCalculator;

beforeEach(function () {
    $this->khaled = Employee::factory()->create([
        'name' => 'خالد',
        'base_salary' => 1400,
        'start_month' => '2026-10',
    ]);

    PayrollRecord::factory()->for($this->khaled)->create([
        'month' => '2026-10',
        'base_salary' => 1400,
        'manual_deduction' => 100,
        'paid_amount' => 800,
    ]);

    foreach (['2026-11-02', '2026-11-04'] as $date) {
        AttendanceRecord::factory()->for($this->khaled)->create(['date' => $date, 'status' => 'absent', 'check_in' => null, 'check_out' => null]);
    }
});

test('the worked example gives a partial first month', function () {
    $row = app(PayrollCalculator::class)->forMonth($this->khaled, '2026-10');

    expect($row['total'])->toBe(1300.0)
        ->and($row['carry'])->toBe(0.0)
        ->and($row['paid'])->toBe(800.0)
        ->and($row['remaining'])->toBe(500.0)
        ->and($row['status'])->toBe(PayrollCalculator::STATUS_PARTIAL);
});

test('the worked example carries 500 and deducts two absent days in the second month', function () {
    $row = app(PayrollCalculator::class)->forMonth($this->khaled, '2026-11');

    expect($row['absent_days'])->toBe(2)
        ->and($row['day_rate'])->toBe(46.67)
        ->and($row['absence_deduction'])->toBe(93.34)
        ->and($row['carry'])->toBe(500.0)
        ->and($row['total'])->toBe(1806.66)
        ->and($row['paid'])->toBe(0.0)
        ->and($row['remaining'])->toBe(1806.66)
        ->and($row['status'])->toBe(PayrollCalculator::STATUS_UNPAID);
});

test('excuse and leave never deduct', function () {
    AttendanceRecord::factory()->for($this->khaled)->create(['date' => '2026-11-05', 'status' => 'excuse']);
    AttendanceRecord::factory()->for($this->khaled)->create(['date' => '2026-11-06', 'status' => 'leave']);

    $row = app(PayrollCalculator::class)->forMonth($this->khaled, '2026-11');

    expect($row['absent_days'])->toBe(2);
});

test('employees without attendance never get absence deductions', function () {
    $this->khaled->update(['attendance_mode' => Employee::MODE_NONE]);

    $row = app(PayrollCalculator::class)->forMonth($this->khaled, '2026-11');

    expect($row['absence_deduction'])->toBe(0.0)
        ->and($row['total'])->toBe(1900.0);
});

test('an unrecorded past month carries its full salary', function () {
    $row = app(PayrollCalculator::class)->forMonth($this->khaled, '2026-12');

    expect($row['carry'])->toBe(1806.66)
        ->and($row['total'])->toBe(3206.66);
});

test('months before the start month are not started', function () {
    $row = app(PayrollCalculator::class)->forMonth($this->khaled, '2026-09');

    expect($row['started'])->toBeFalse()
        ->and($row['status'])->toBe(PayrollCalculator::STATUS_NOT_STARTED)
        ->and($row['total'])->toBe(0.0);
});

test('overpaying gives a negative carry', function () {
    PayrollRecord::query()->where('month', '2026-10')->update(['paid_amount' => 1400]);

    $row = app(PayrollCalculator::class)->forMonth($this->khaled, '2026-11');

    expect($row['carry'])->toBe(-100.0);
});

test('a custom absence day rate is used', function () {
    $this->khaled->update(['absence_day_rate' => 50]);

    $row = app(PayrollCalculator::class)->forMonth($this->khaled, '2026-11');

    expect($row['absence_deduction'])->toBe(100.0);
});

test('history lists months newest first', function () {
    $history = app(PayrollCalculator::class)->history($this->khaled, '2026-12');

    expect(array_column($history, 'month'))->toBe(['2026-12', '2026-11', '2026-10']);
});
