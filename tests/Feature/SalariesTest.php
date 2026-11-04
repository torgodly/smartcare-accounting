<?php

use App\Models\Employee;
use App\Models\PayrollRecord;
use App\Models\User;
use App\Services\PayrollCalculator;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('the salaries page lists employees with computed rows', function () {
    Employee::factory()->create(['name' => 'خالد', 'base_salary' => 1400, 'start_month' => '2026-10']);

    $this->get(route('salaries.index', ['month' => '2026-11']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Salaries/Index')
            ->where('month', '2026-11')
            ->has('rows', 1)
            ->where('rows.0.payroll.carry', 1400)
            ->where('totals.total', 2800));
});

test('an employee can be created', function () {
    $this->post(route('employees.store'), [
        'name' => 'مريم',
        'job_title' => 'محاسبة',
        'base_salary' => 2200,
        'start_month' => '2026-11',
        'absence_day_rate' => '',
    ])->assertRedirect()->assertInertiaFlash('success', 'تمت إضافة الموظف');

    $employee = Employee::query()->firstOrFail();
    expect($employee->name)->toBe('مريم')
        ->and($employee->absence_day_rate)->toBeNull()
        ->and($employee->sort_order)->toBe($employee->id);
});

test('an employee needs a name', function () {
    $this->post(route('employees.store'), ['name' => '', 'base_salary' => 100, 'start_month' => '2026-11'])
        ->assertSessionHasErrors(['name' => 'اكتب اسم الموظف']);
});

test('an employee can be updated and deleted with their payroll', function () {
    $employee = Employee::factory()->create();
    PayrollRecord::factory()->for($employee)->create();

    $this->put(route('employees.update', $employee), [
        'name' => 'اسم جديد',
        'base_salary' => 1500,
        'start_month' => '2026-10',
    ])->assertRedirect();

    expect($employee->fresh()->name)->toBe('اسم جديد');

    $this->delete(route('employees.destroy', $employee))->assertRedirect();

    expect(Employee::query()->count())->toBe(0)
        ->and(PayrollRecord::query()->count())->toBe(0);
});

test('saving a month snapshots the base salary', function () {
    $employee = Employee::factory()->create(['base_salary' => 1400, 'start_month' => '2026-10']);

    $this->put(route('payroll.update', [$employee, '2026-11']), [
        'bonus' => 50,
        'manual_deduction' => '',
        'paid_amount' => 500,
        'note' => 'دفعة أولى',
    ])->assertRedirect();

    $employee->update(['base_salary' => 2000]);

    $record = PayrollRecord::query()->firstOrFail();
    expect($record->base_salary)->toBe('1400.00')
        ->and($record->manual_deduction)->toBe('0.00')
        ->and($record->note)->toBe('دفعة أولى');
});

test('a month before the start month cannot be saved', function () {
    $employee = Employee::factory()->create(['start_month' => '2026-11']);

    $this->put(route('payroll.update', [$employee, '2026-10']), ['paid_amount' => 10])->assertStatus(422);
});

test('pay full makes the month paid and the next carry zero', function () {
    $employee = Employee::factory()->create(['name' => 'خالد', 'base_salary' => 1400, 'start_month' => '2026-10']);
    PayrollRecord::factory()->for($employee)->create(['month' => '2026-10', 'base_salary' => 1400, 'manual_deduction' => 100, 'paid_amount' => 800, 'bonus' => 20]);

    $this->post(route('payroll.pay-full', [$employee, '2026-11']))
        ->assertRedirect()
        ->assertInertiaFlash('success', 'تم تسجيل دفع 1,920 د.ل لـ خالد');

    $calculator = app(PayrollCalculator::class);
    expect($calculator->forMonth($employee, '2026-11')['status'])->toBe(PayrollCalculator::STATUS_PAID)
        ->and($calculator->forMonth($employee, '2026-12')['carry'])->toBe(0.0)
        ->and(PayrollRecord::query()->where('month', '2026-10')->value('bonus'))->toBe('20.00');
});

test('history returns months newest first', function () {
    $employee = Employee::factory()->create(['start_month' => '2026-09']);

    $this->getJson(route('employees.history', [$employee, 'until' => '2026-11']))
        ->assertOk()
        ->assertJsonCount(3, 'rows')
        ->assertJsonPath('rows.0.month', '2026-11');
});

test('the month picker returns twelve tiles', function () {
    Employee::factory()->create(['base_salary' => 1000, 'start_month' => '2026-03']);

    $this->getJson(route('months.year', 2026))
        ->assertOk()
        ->assertJsonCount(12, 'months')
        ->assertJsonPath('months.0.state', 'none')
        ->assertJsonPath('months.2.total', 1000)
        ->assertJsonPath('months.3.total', 2000);
});
