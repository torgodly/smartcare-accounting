<?php

use App\Models\Custody;
use App\Models\Employee;
use App\Models\PurchaseGroup;
use App\Models\Treasury;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->east = Treasury::query()->where('region', 'east')->firstOrFail();
    $this->west = Treasury::query()->where('region', 'west')->firstOrFail();
});

test('existing accounts become admins', function () {
    expect(User::factory()->create()->isAdmin())->toBeTrue();
});

test('an admin creates accounts for east or west', function () {
    $this->actingAs(User::factory()->create());

    $this->post(route('users.store'), ['name' => 'محاسب الغرب', 'email' => 'west@example.com', 'password' => 'secret123', 'role' => 'user', 'region' => 'west'])
        ->assertRedirect()->assertInertiaFlash('success', 'تمت إضافة الحساب');

    $this->post(route('users.store'), ['name' => 'x', 'email' => 'x@example.com', 'password' => 'secret123', 'role' => 'user'])
        ->assertSessionHasErrors(['region' => 'اختر المنطقة (الشرق أو الغرب)']);

    $account = User::query()->where('email', 'west@example.com')->firstOrFail();
    expect($account->role)->toBe('user')->and($account->region)->toBe('west');

    $this->get(route('users.index'))
        ->assertInertia(fn (Assert $page) => $page->component('Users/Index')->has('users', 2));
});

test('an admin cannot remove their own admin role or delete themselves', function () {
    $admin = User::factory()->create();
    $this->actingAs($admin);

    $this->put(route('users.update', $admin), ['name' => $admin->name, 'email' => $admin->email, 'role' => 'user', 'region' => 'east'])
        ->assertInertiaFlash('error', 'لا يمكنك إلغاء صلاحية المدير عن حسابك');
    $this->delete(route('users.destroy', $admin))->assertInertiaFlash('error', 'لا يمكنك حذف حسابك');

    expect($admin->fresh()->isAdmin())->toBeTrue();
});

test('a regional account cannot manage accounts', function () {
    $this->actingAs(User::factory()->regional('east')->create());

    $this->get(route('users.index'))->assertForbidden();
    $this->post(route('users.store'), ['name' => 'x', 'email' => 'x@example.com', 'password' => 'secret123', 'role' => 'admin'])->assertForbidden();
});

test('a regional account only sees its own region, even if it tries to switch', function () {
    Employee::factory()->create(['name' => 'شرقي', 'region' => 'east', 'start_month' => '2026-11']);
    Employee::factory()->create(['name' => 'غربي', 'region' => 'west', 'start_month' => '2026-11']);
    $this->actingAs(User::factory()->regional('west')->create());

    $this->put(route('region.update'), ['region' => 'all']);

    $this->get(route('salaries.index', ['month' => '2026-11']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('region', 'west')
            ->has('rows', 1)
            ->where('rows.0.employee.name', 'غربي')
            ->has('treasuries', 1)
            ->where('treasuries.0.region', 'west'));

    $this->get(route('treasuries.index'))
        ->assertInertia(fn (Assert $page) => $page->has('treasuries', 1)->where('treasuries.0.id', $this->west->id));
});

test('a regional account cannot open or change the other region\'s records', function () {
    $eastEmployee = Employee::factory()->create(['region' => 'east', 'start_month' => '2026-11']);
    $eastGroup = PurchaseGroup::factory()->create(['region' => 'east']);
    $eastCustody = Custody::factory()->create(['region' => 'east', 'treasury_id' => $this->east->id]);
    $this->actingAs(User::factory()->regional('west')->create());

    $this->get(route('treasuries.show', $this->east))->assertForbidden();
    $this->get(route('purchase-groups.show', $eastGroup))->assertForbidden();
    $this->get(route('custodies.show', $eastCustody))->assertForbidden();
    $this->put(route('employees.update', $eastEmployee), ['name' => 'x', 'base_salary' => 1, 'start_month' => '2026-11'])->assertForbidden();
    $this->post(route('payroll.pay-full', [$eastEmployee, '2026-11']))->assertForbidden();
    $this->post(route('treasury-transactions.store', $this->east), ['type' => 'deposit', 'amount' => 5, 'date' => '2026-11-01'])->assertForbidden();
});

test('a regional account creates records in its own region and pays only from its treasuries', function () {
    $this->actingAs(User::factory()->regional('west')->create());

    $this->post(route('employees.store'), ['name' => 'سالم', 'region' => 'east', 'base_salary' => 1000, 'start_month' => '2026-11']);
    $this->post(route('purchase-groups.store'), ['name' => 'وقود', 'code' => 'FU', 'region' => 'east']);

    expect(Employee::query()->value('region'))->toBe('west')
        ->and(PurchaseGroup::query()->value('region'))->toBe('west');

    $group = PurchaseGroup::query()->firstOrFail();
    $this->post(route('invoices.store', $group), ['month' => '2026-11', 'title' => 'x', 'price' => 10, 'type' => 'once', 'treasury_id' => $this->east->id])
        ->assertSessionHasErrors('treasury_id');
    $this->post(route('invoices.store', $group), ['month' => '2026-11', 'title' => 'x', 'price' => 10, 'type' => 'once', 'treasury_id' => $this->west->id])
        ->assertSessionHasNoErrors();

    $this->post(route('custodies.store'), ['holder_name' => 'علي', 'region' => 'east', 'treasury_id' => $this->east->id, 'amount' => 100, 'date' => '2026-11-01'])
        ->assertSessionHasErrors('treasury_id');
});
