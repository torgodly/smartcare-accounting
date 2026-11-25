<?php

use App\Models\Custody;
use App\Models\CustodyMovement;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\PayrollRecord;
use App\Models\PurchaseGroup;
use App\Models\Treasury;
use App\Models\TreasuryTransaction;
use App\Models\User;
use App\Services\Money;
use App\Services\SerialNumber;
use App\Services\TreasuryLedger;
use Illuminate\Support\Facades\Date;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Date::setTestNow('2026-11-10 10:00:00');
    $this->actingAs(User::factory()->create());
    $this->east = Treasury::query()->where('region', 'east')->firstOrFail();
    $this->west = Treasury::query()->where('region', 'west')->firstOrFail();
});

test('each region starts with a main treasury', function () {
    expect(Treasury::query()->pluck('region')->all())->toBe(['east', 'west'])
        ->and($this->east->name)->toBe('الخزينة الرئيسية');
});

test('the region filter limits employees and groups', function () {
    Employee::factory()->create(['name' => 'شرقي', 'region' => 'east', 'start_month' => '2026-11']);
    Employee::factory()->create(['name' => 'غربي', 'region' => 'west', 'start_month' => '2026-11']);
    PurchaseGroup::factory()->create(['name' => 'مجموعة الغرب', 'region' => 'west']);

    $this->get(route('salaries.index', ['month' => '2026-11']))
        ->assertInertia(fn (Assert $page) => $page->where('region', 'all')->has('rows', 2));

    $this->put(route('region.update'), ['region' => 'west'])->assertRedirect();

    $this->get(route('salaries.index', ['month' => '2026-11']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('region', 'west')
            ->has('rows', 1)
            ->where('rows.0.employee.name', 'غربي'));

    $this->get(route('purchase-groups.index'))
        ->assertInertia(fn (Assert $page) => $page->has('groups', 1));

    $this->put(route('region.update'), ['region' => 'east']);

    $this->get(route('purchase-groups.index'))
        ->assertInertia(fn (Assert $page) => $page->has('groups', 0));
});

test('new employees and groups default to the selected region', function () {
    $this->put(route('region.update'), ['region' => 'west']);

    $this->post(route('employees.store'), ['name' => 'سالم', 'base_salary' => 1000, 'start_month' => '2026-11', 'account_number' => 'LY12 3456'])
        ->assertRedirect();
    $this->post(route('purchase-groups.store'), ['name' => 'وقود', 'code' => 'FU', 'kind' => 'expense']);

    $employee = Employee::query()->firstOrFail();
    expect($employee->region)->toBe('west')
        ->and($employee->payment_method)->toBe('cash')
        ->and($employee->account_number)->toBe('LY12 3456');

    $group = PurchaseGroup::query()->firstOrFail();
    expect($group->region)->toBe('west')->and($group->kind)->toBe('expense');
});

test('expense groups have their own page', function () {
    PurchaseGroup::factory()->create(['name' => 'مشتريات', 'kind' => 'purchase']);
    PurchaseGroup::factory()->create(['name' => 'مصروفات', 'kind' => 'expense']);

    $this->get(route('expenses.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Purchases/Index')
            ->where('kind', 'expense')
            ->has('groups', 1)
            ->where('groups.0.name', 'مصروفات'));
});

test('a salary payment records the treasury, payment method and account number', function () {
    $employee = Employee::factory()->create(['base_salary' => 1000, 'start_month' => '2026-11', 'payment_method' => 'bank_transfer', 'account_number' => '0011']);

    $this->put(route('payroll.update', [$employee, '2026-11']), ['paid_amount' => 400])
        ->assertSessionHasErrors(['treasury_id' => 'اختر الخزينة التي صُرف منها الراتب']);

    $this->put(route('payroll.update', [$employee, '2026-11']), [
        'paid_amount' => 400,
        'treasury_id' => $this->east->id,
        'payment_method' => 'cheque',
        'account_number' => 'CHQ-77',
    ])->assertRedirect();

    $record = PayrollRecord::query()->firstOrFail();
    expect($record->treasury_id)->toBe($this->east->id)
        ->and($record->payment_method)->toBe('cheque')
        ->and($record->account_number)->toBe('CHQ-77')
        ->and(app(TreasuryLedger::class)->balance($this->east))->toBe(-40000);
});

test('pay full uses the region treasury and the employee payment details', function () {
    $employee = Employee::factory()->create(['region' => 'west', 'base_salary' => 1000, 'start_month' => '2026-11', 'payment_method' => 'bank_transfer', 'account_number' => '0011']);

    $this->post(route('payroll.pay-full', [$employee, '2026-11']))->assertRedirect();

    $record = PayrollRecord::query()->firstOrFail();
    expect($record->treasury_id)->toBe($this->west->id)
        ->and($record->payment_method)->toBe('bank_transfer')
        ->and($record->account_number)->toBe('0011');
});

test('an invoice must say where the money came from', function () {
    $group = PurchaseGroup::factory()->create();

    $this->post(route('invoices.store', $group), ['month' => '2026-11', 'title' => 'x', 'price' => 10, 'type' => 'once'])
        ->assertSessionHasErrors(['treasury_id' => 'اختر مصدر الدفع (خزينة أو عهدة)']);
});

test('the treasury balance follows deposits, withdrawals, transfers, salaries and invoices', function () {
    $this->post(route('treasury-transactions.store', $this->east), ['type' => 'deposit', 'amount' => 5000, 'date' => '2026-11-01'])
        ->assertRedirect()->assertInertiaFlash('success', 'تم تسجيل الإيداع');
    $this->post(route('treasury-transactions.store', $this->east), ['type' => 'withdrawal', 'amount' => 200, 'date' => '2026-11-02']);
    $this->post(route('treasury-transactions.store', $this->east), ['type' => 'transfer', 'amount' => 1000, 'date' => '2026-11-03', 'to_treasury_id' => $this->west->id])
        ->assertInertiaFlash('success', 'تم التحويل');

    $employee = Employee::factory()->create(['base_salary' => 1500, 'start_month' => '2026-11']);
    PayrollRecord::factory()->for($employee)->create(['month' => '2026-11', 'base_salary' => 1500, 'paid_amount' => 1500, 'treasury_id' => $this->east->id]);

    $group = PurchaseGroup::factory()->create();
    app(SerialNumber::class)->createInvoice($group, '2026-11', ['title' => 'أحبار', 'price' => 300, 'type' => 'once', 'treasury_id' => $this->east->id]);

    $ledger = app(TreasuryLedger::class);
    expect($ledger->balance($this->east))->toBe(Money::toCents(5000 - 200 - 1000 - 1500 - 300))
        ->and($ledger->balance($this->west))->toBe(Money::toCents(1000));

    $this->get(route('treasuries.show', [$this->east, 'month' => '2026-11']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Treasuries/Show')
            ->where('ledger.opening', 0)
            ->where('ledger.inflow', 5000)
            ->where('ledger.outflow', 3000)
            ->where('ledger.closing', 2000)
            ->has('ledger.entries', 5));

    $this->get(route('treasuries.show', [$this->east, 'month' => '2026-12']))
        ->assertInertia(fn (Assert $page) => $page->where('ledger.opening', 2000)->has('ledger.entries', 0));

    $transfer = TreasuryTransaction::query()->where('treasury_id', $this->west->id)->firstOrFail();
    $this->delete(route('treasury-transactions.destroy', $transfer))->assertRedirect();
    expect(TreasuryTransaction::query()->count())->toBe(2);
});

test('a used treasury cannot be deleted but an unused one can', function () {
    $spare = Treasury::factory()->create();
    TreasuryTransaction::factory()->create(['treasury_id' => $this->east->id]);

    $this->delete(route('treasuries.destroy', $this->east))->assertInertiaFlash('error', 'لا يمكن حذف خزينة عليها حركات');
    $this->delete(route('treasuries.destroy', $spare))->assertRedirect();

    expect(Treasury::query()->count())->toBe(2);
});

test('a custody follows the imprest cycle: issue, spend, replenish, close', function () {
    $group = PurchaseGroup::factory()->create();

    $this->post(route('custodies.store'), [
        'holder_name' => 'محمد',
        'region' => 'east',
        'treasury_id' => $this->east->id,
        'amount' => 1000,
        'date' => '2026-11-01',
    ])->assertRedirect();

    $custody = Custody::query()->firstOrFail();
    $ledger = app(TreasuryLedger::class);
    expect($ledger->balance($this->east))->toBe(-100000);

    foreach ([300, 150] as $price) {
        $this->post(route('invoices.store', $group), ['month' => '2026-11', 'title' => 'وقود', 'price' => $price, 'type' => 'once', 'custody_id' => $custody->id])
            ->assertRedirect();
    }

    // Spending from the custody does not touch the treasury until it is renewed.
    expect($ledger->balance($this->east))->toBe(-100000);

    $this->get(route('custodies.show', $custody))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Custodies/Show')
            ->where('custody.issued', 1000)
            ->where('custody.pending', 450)
            ->where('custody.cash', 550)
            ->has('invoices', 2));

    $this->post(route('custodies.replenish', $custody), ['date' => '2026-11-15'])
        ->assertInertiaFlash('success', 'تم تجديد العهدة بـ 450 د.ل');

    expect($ledger->balance($this->east))->toBe(-145000)
        ->and(Invoice::query()->whereNull('custody_movement_id')->count())->toBe(0);

    $this->post(route('custodies.replenish', $custody), ['date' => '2026-11-16'])
        ->assertSessionHasErrors(['custody' => 'لا توجد فواتير جديدة لتعويضها']);

    // A settled invoice keeps its price.
    $settled = Invoice::query()->firstOrFail();
    $this->put(route('invoices.update', $settled), ['title' => 'وقود', 'price' => 999, 'type' => 'once'])
        ->assertSessionHasErrors('price');

    $this->post(route('invoices.store', $group), ['month' => '2026-11', 'title' => 'صيانة', 'price' => 100, 'type' => 'once', 'custody_id' => $custody->id]);

    $this->post(route('custodies.close', $custody), ['date' => '2026-11-30'])->assertRedirect();

    $return = CustodyMovement::query()->where('type', 'return')->firstOrFail();
    expect((float) $return->amount)->toBe(900.0)
        ->and($custody->fresh()->status)->toBe('closed')
        ->and($ledger->balance($this->east))->toBe(Money::toCents(-1000 - 450 + 900))
        ->and(Invoice::query()->whereNull('custody_movement_id')->count())->toBe(0);

    $this->post(route('invoices.store', $group), ['month' => '2026-11', 'title' => 'x', 'price' => 5, 'type' => 'once', 'custody_id' => $custody->id])
        ->assertSessionHasErrors(['custody_id' => 'هذه العهدة مغلقة']);
});

test('closing an overspent custody pays the holder the difference', function () {
    $group = PurchaseGroup::factory()->create();
    $custody = Custody::factory()->create(['treasury_id' => $this->east->id]);
    CustodyMovement::factory()->create(['custody_id' => $custody->id, 'treasury_id' => $this->east->id, 'amount' => 200]);
    app(SerialNumber::class)->createInvoice($group, '2026-11', ['title' => 'a', 'price' => 260, 'type' => 'once', 'custody_id' => $custody->id]);

    $this->post(route('custodies.close', $custody), ['date' => '2026-11-30'])->assertRedirect();

    $last = CustodyMovement::query()->latest('id')->firstOrFail();
    expect($last->type)->toBe('replenish')
        ->and((float) $last->amount)->toBe(60.0)
        ->and(app(TreasuryLedger::class)->balance($this->east))->toBe(-26000);
});

test('recurring invoices keep their treasury or custody', function () {
    $group = PurchaseGroup::factory()->create();
    $custody = Custody::factory()->create(['treasury_id' => $this->west->id]);
    app(SerialNumber::class)->createInvoice($group, '2026-10', ['title' => 'إنترنت', 'price' => 350, 'type' => 'recurring', 'treasury_id' => $this->east->id]);
    app(SerialNumber::class)->createInvoice($group, '2026-10', ['title' => 'مياه', 'price' => 40, 'type' => 'recurring', 'custody_id' => $custody->id]);

    $this->get(route('purchase-groups.show', [$group, 'month' => '2026-11']))->assertOk();

    $copies = Invoice::query()->where('month', '2026-11')->orderBy('id')->get();
    expect($copies[0]->treasury_id)->toBe($this->east->id)
        ->and($copies[1]->custody_id)->toBe($custody->id);
});
