<?php

use App\Models\Invoice;
use App\Models\PurchaseGroup;
use App\Models\Receipt;
use App\Models\User;
use App\Services\RecurringInvoices;
use App\Services\SerialNumber;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Date::setTestNow('2026-11-04 10:00:00');
    Storage::fake('local');
    $this->actingAs(User::factory()->create());
});

test('a group is created with a normalised code and opened', function () {
    $response = $this->post(route('purchase-groups.store', ['month' => '2026-11']), ['name' => 'مشتريات داخلية', 'code' => 'in-x9z']);

    $group = PurchaseGroup::query()->firstOrFail();
    expect($group->code)->toBe('INX9');
    $response->assertRedirect(route('purchase-groups.show', ['group' => $group, 'month' => '2026-11']));
});

test('a group code defaults to G and the name is required', function () {
    $this->post(route('purchase-groups.store'), ['name' => '', 'code' => ''])
        ->assertSessionHasErrors(['name' => 'اكتب اسم المجموعة']);

    $this->post(route('purchase-groups.store'), ['name' => 'شركات', 'code' => '']);
    expect(PurchaseGroup::query()->value('code'))->toBe('G');
});

test('the groups page shows month totals', function () {
    $group = PurchaseGroup::factory()->create(['code' => 'IN']);
    app(SerialNumber::class)->createInvoice($group, '2026-11', ['title' => 'أحبار', 'price' => 185, 'type' => 'once']);
    app(SerialNumber::class)->createInvoice($group, '2026-10', ['title' => 'قديم', 'price' => 50, 'type' => 'once']);

    $this->get(route('purchase-groups.index', ['month' => '2026-11']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Purchases/Index')
            ->where('groups.0.total', 185)
            ->where('groups.0.count', 1)
            ->where('groups.0.missing_receipts', 1));
});

test('invoices get CODE-YYMM-NNN serials per group and month', function () {
    $group = PurchaseGroup::factory()->create(['code' => 'IN']);

    foreach (['أحبار', 'مياه'] as $title) {
        $this->post(route('invoices.store', $group), ['month' => '2026-11', 'title' => $title, 'price' => 10, 'type' => 'once'])
            ->assertRedirect()
            ->assertInertiaFlash('success', 'تمت إضافة الفاتورة');
    }
    $this->post(route('invoices.store', $group), ['month' => '2026-12', 'title' => 'x', 'price' => 10, 'type' => 'once']);

    expect(Invoice::query()->orderBy('id')->pluck('serial')->all())->toBe(['IN-2611-001', 'IN-2611-002', 'IN-2612-001']);
});

test('changing the group code keeps old serials', function () {
    $group = PurchaseGroup::factory()->create(['code' => 'IN']);
    app(SerialNumber::class)->createInvoice($group, '2026-11', ['title' => 'a', 'price' => 1, 'type' => 'once']);

    $this->put(route('purchase-groups.update', $group), ['name' => $group->name, 'code' => 'NEW'])->assertRedirect();
    app(SerialNumber::class)->createInvoice($group->fresh(), '2026-11', ['title' => 'b', 'price' => 1, 'type' => 'once']);

    expect(Invoice::query()->orderBy('id')->pluck('serial')->all())->toBe(['IN-2611-001', 'NEW-2611-002']);
});

test('invoice validation messages are Arabic', function () {
    $group = PurchaseGroup::factory()->create();

    $this->post(route('invoices.store', $group), ['month' => '2026-11', 'title' => '', 'price' => 0, 'type' => 'once'])
        ->assertSessionHasErrors(['title' => 'اكتب عنوان الفاتورة', 'price' => 'اكتب السعر']);
});

test('the group page lists the month invoices oldest first', function () {
    $group = PurchaseGroup::factory()->create(['code' => 'IN']);
    app(SerialNumber::class)->createInvoice($group, '2026-11', ['title' => 'أول', 'price' => 10, 'type' => 'once']);
    app(SerialNumber::class)->createInvoice($group, '2026-11', ['title' => 'ثاني', 'price' => 20, 'type' => 'recurring']);

    $this->get(route('purchase-groups.show', ['group' => $group, 'month' => '2026-11']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Purchases/Show')
            ->where('invoices.0.title', 'أول')
            ->where('summary.total', 30)
            ->where('summary.recurring', 1));
});

test('updating an invoice with a new receipt deletes the old file', function () {
    $group = PurchaseGroup::factory()->create();
    $old = Receipt::factory()->create();
    Storage::disk('local')->put($old->path, 'old');
    $new = Receipt::factory()->create();
    $invoice = app(SerialNumber::class)->createInvoice($group, '2026-11', ['title' => 'a', 'price' => 5, 'type' => 'once', 'receipt_id' => $old->id]);

    $this->put(route('invoices.update', $invoice), ['title' => 'b', 'price' => 6, 'type' => 'recurring', 'receipt_id' => $new->id])
        ->assertRedirect();

    expect($invoice->fresh()->receipt_id)->toBe($new->id)
        ->and(Receipt::query()->find($old->id))->toBeNull();
    Storage::disk('local')->assertMissing($old->path);
});

test('deleting an invoice deletes its receipt file', function () {
    $group = PurchaseGroup::factory()->create();
    $receipt = Receipt::factory()->create();
    Storage::disk('local')->put($receipt->path, 'x');
    $invoice = app(SerialNumber::class)->createInvoice($group, '2026-11', ['title' => 'a', 'price' => 5, 'type' => 'once', 'receipt_id' => $receipt->id]);

    $this->delete(route('invoices.destroy', $invoice))->assertRedirect();

    expect(Invoice::query()->count())->toBe(0);
    Storage::disk('local')->assertMissing($receipt->path);
});

test('deleting a group deletes every invoice in every month and the receipt files', function () {
    $group = PurchaseGroup::factory()->create();
    $receipt = Receipt::factory()->create();
    Storage::disk('local')->put($receipt->path, 'x');
    $root = app(SerialNumber::class)->createInvoice($group, '2026-10', ['title' => 'a', 'price' => 5, 'type' => 'recurring', 'receipt_id' => $receipt->id]);
    app(RecurringInvoices::class)->ensureFor('2026-11');

    $this->delete(route('purchase-groups.destroy', $group))->assertRedirect(route('purchase-groups.index', ['month' => '2026-11']));

    expect(Invoice::query()->count())->toBe(0)
        ->and(PurchaseGroup::query()->count())->toBe(0);
    Storage::disk('local')->assertMissing($receipt->path);
});

test('recurring invoices are copied once into the next month without receipt', function () {
    $group = PurchaseGroup::factory()->create(['code' => 'IN']);
    $receipt = Receipt::factory()->create();
    $root = app(SerialNumber::class)->createInvoice($group, '2026-10', ['title' => 'إنترنت', 'price' => 350, 'type' => 'recurring', 'receipt_id' => $receipt->id]);
    app(SerialNumber::class)->createInvoice($group, '2026-10', ['title' => 'مرة', 'price' => 10, 'type' => 'once']);

    $this->get(route('purchase-groups.show', ['group' => $group, 'month' => '2026-11']))->assertOk();
    $this->get(route('purchase-groups.show', ['group' => $group, 'month' => '2026-11']))->assertOk();

    $copies = Invoice::query()->where('month', '2026-11')->get();
    expect($copies)->toHaveCount(1)
        ->and($copies[0]->is_auto)->toBeTrue()
        ->and($copies[0]->receipt_id)->toBeNull()
        ->and($copies[0]->recurring_root_id)->toBe($root->id)
        ->and($copies[0]->serial)->toBe('IN-2611-001');
});

test('recurring invoices are never created for future months', function () {
    $group = PurchaseGroup::factory()->create();
    app(SerialNumber::class)->createInvoice($group, '2026-11', ['title' => 'إنترنت', 'price' => 350, 'type' => 'recurring']);

    expect(app(RecurringInvoices::class)->ensureFor('2026-12'))->toBe(0);
    $this->artisan('app:recurring', ['month' => '2026-12'])->assertSuccessful();

    expect(Invoice::query()->where('month', '2026-12')->count())->toBe(0);
});

test('the chain continues from the copy', function () {
    $group = PurchaseGroup::factory()->create();
    $root = app(SerialNumber::class)->createInvoice($group, '2026-09', ['title' => 'إنترنت', 'price' => 350, 'type' => 'recurring']);

    app(RecurringInvoices::class)->ensureFor('2026-10');
    app(RecurringInvoices::class)->ensureFor('2026-11');

    expect(Invoice::query()->where('recurring_root_id', $root->id)->count())->toBe(2);
});

test('receipts upload to the private disk and stream back', function () {
    $response = $this->postJson(route('receipts.store'), ['file' => UploadedFile::fake()->image('r.jpg', 800, 600)])
        ->assertCreated()
        ->assertJsonStructure(['id', 'url']);

    $receipt = Receipt::query()->findOrFail($response->json('id'));
    expect($receipt->source)->toBe('computer');
    Storage::disk('local')->assertExists($receipt->path);

    $this->get(route('receipts.show', $receipt))
        ->assertOk()
        ->assertHeader('Cache-Control', 'max-age=31536000, private');
});

test('non images are rejected with the Arabic message', function () {
    $this->postJson(route('receipts.store'), ['file' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')])
        ->assertUnprocessable()
        ->assertJsonPath('errors.file.0', 'فشل رفع الصورة');
});
