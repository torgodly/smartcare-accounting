<?php

use App\Models\Receipt;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('the login page renders', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Login'));
});

test('accountants can log in and are remembered', function () {
    $user = User::factory()->create(['email' => 'accountant@smartcare.ly']);

    $response = $this->post(route('login.store'), ['email' => 'accountant@smartcare.ly', 'password' => 'password']);

    $response->assertRedirect(route('home'));
    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->remember_token)->not->toBeNull();
});

test('a wrong password shows the Arabic error', function () {
    User::factory()->create(['email' => 'accountant@smartcare.ly']);

    $this->post(route('login.store'), ['email' => 'accountant@smartcare.ly', 'password' => 'wrong'])
        ->assertSessionHasErrors(['email' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة']);

    $this->assertGuest();
});

test('accountants can log out', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('logout'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});

test('there is no registration', function () {
    $this->get('/register')->assertNotFound();
    $this->post('/register', ['email' => 'x@y.z'])->assertNotFound();
});

test('every app page needs login', function (string $url) {
    $this->get($url)->assertRedirect(route('login'));
})->with(['/', '/salaries', '/attendance', '/purchases', '/reports/salaries/2026-11']);

test('receipt images are private', function () {
    $receipt = Receipt::factory()->create();

    $this->get(route('receipts.show', $receipt))->assertRedirect(route('login'));
});

test('app:user creates an account and resets its password', function () {
    $this->artisan('app:user', ['email' => 'accountant@smartcare.ly', '--name' => 'المحاسب', '--password' => 'StrongPass123'])
        ->assertSuccessful();

    $user = User::query()->where('email', 'accountant@smartcare.ly')->firstOrFail();
    expect($user->name)->toBe('المحاسب')
        ->and(Hash::check('StrongPass123', $user->password))->toBeTrue();

    $this->artisan('app:user', ['email' => 'accountant@smartcare.ly', '--password' => 'NewPass12345'])
        ->assertSuccessful();

    expect(Hash::check('NewPass12345', $user->fresh()->password))->toBeTrue()
        ->and(User::query()->count())->toBe(1);
});
