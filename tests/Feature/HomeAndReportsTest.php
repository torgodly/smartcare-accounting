<?php

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\PurchaseGroup;
use App\Models\User;
use App\Services\SerialNumber;
use Illuminate\Support\Facades\Date;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Date::setTestNow('2026-11-04 10:00:00');
    $this->actingAs(User::factory()->create());

    $employee = Employee::factory()->create(['base_salary' => 3000, 'start_month' => '2026-11']);
    AttendanceRecord::factory()->for($employee)->create(['date' => '2026-11-02', 'status' => 'absent']);
    AttendanceRecord::factory()->for($employee)->create(['date' => '2026-11-03', 'status' => 'leave']);

    $this->group = PurchaseGroup::factory()->create(['code' => 'IN', 'name' => 'مشتريات داخلية']);
    app(SerialNumber::class)->createInvoice($this->group, '2026-11', ['title' => 'أحبار طابعة', 'price' => 185, 'type' => 'once']);
});

test('the home page summarises the three modules', function () {
    $this->get(route('home', ['month' => '2026-11']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->where('salaries.employees', 1)
            ->where('salaries.total', 2900)
            ->where('salaries.unpaid', 1)
            ->where('purchases.total', 185)
            ->where('purchases.missing_receipts', 1)
            ->where('attendance.absent_days', 1)
            ->where('attendance.excused_days', 1)
            ->where('attendance.deduction', 100));
});

test('an invalid month falls back to the current month', function () {
    $this->get(route('home', ['month' => 'abc']))
        ->assertInertia(fn (Assert $page) => $page->where('month', '2026-11'));
});

test('the salary sheet downloads as a PDF with an English file name', function () {
    $response = $this->get(route('reports.salaries', '2026-11'))->assertOk();

    expect($response->headers->get('Content-Type'))->toBe('application/pdf')
        ->and($response->headers->get('Content-Disposition'))->toContain('SmartCare-Salaries-2026-11.pdf')
        ->and(substr($response->getContent(), 0, 4))->toBe('%PDF');
});

test('the purchases report downloads as a PDF with an English file name', function () {
    $response = $this->get(route('reports.purchases', [$this->group, '2026-11']))->assertOk();

    expect($response->headers->get('Content-Disposition'))->toContain('SmartCare-Purchases-IN-2026-11.pdf')
        ->and(substr($response->getContent(), 0, 4))->toBe('%PDF');
});
