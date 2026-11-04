<?php

use App\Models\Receipt;
use App\Models\UploadToken;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('local');
    $this->user = User::factory()->create();
});

test('the accountant creates a ten minute token', function () {
    $this->actingAs($this->user)
        ->postJson(route('upload-tokens.store'))
        ->assertCreated()
        ->assertJsonStructure(['token', 'url', 'expires_at', 'expires_in']);

    $token = UploadToken::query()->firstOrFail();
    expect(strlen($token->token))->toBe(48)
        ->and((int) round(now()->diffInMinutes($token->expires_at)))->toBe(10);
});

test('the phone page works without login', function () {
    $token = UploadToken::factory()->for($this->user)->create();

    $this->get(route('upload.page', $token->token))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Upload')->where('token', $token->token));

    $this->getJson(route('upload.show', $token->token))
        ->assertOk()
        ->assertJsonPath('state', 'ok');
});

test('the phone sends the photo once and the desktop sees it', function () {
    $token = UploadToken::factory()->for($this->user)->create();

    $this->postJson(route('upload.store', $token->token), ['file' => UploadedFile::fake()->image('r.jpg')])
        ->assertCreated()
        ->assertJsonPath('state', 'done');

    $token->refresh();
    expect($token->used_at)->not->toBeNull()
        ->and(Receipt::query()->findOrFail($token->receipt_id)->source)->toBe('phone');

    $this->actingAs($this->user)
        ->getJson(route('upload-tokens.show', $token->token))
        ->assertJsonPath('state', 'received')
        ->assertJsonPath('receipt.id', $token->receipt_id);

    $this->postJson(route('upload.store', $token->token), ['file' => UploadedFile::fake()->image('r.jpg')])
        ->assertStatus(410)
        ->assertJsonPath('state', 'used');
});

test('expired and unknown tokens are refused', function () {
    $expired = UploadToken::factory()->for($this->user)->create(['expires_at' => now()->subSecond()]);

    $this->getJson(route('upload.show', $expired->token))->assertJsonPath('state', 'expired');
    $this->postJson(route('upload.store', $expired->token), ['file' => UploadedFile::fake()->image('r.jpg')])
        ->assertStatus(410)
        ->assertJsonPath('state', 'expired');
    $this->postJson(route('upload.store', 'nope'), ['file' => UploadedFile::fake()->image('r.jpg')])
        ->assertStatus(410)
        ->assertJsonPath('state', 'invalid');

    expect(Receipt::query()->count())->toBe(0);
});

test('closing the QR dialog cancels the token', function () {
    $token = UploadToken::factory()->for($this->user)->create();

    $this->actingAs($this->user)->deleteJson(route('upload-tokens.destroy', $token->token))->assertOk();

    expect(UploadToken::query()->count())->toBe(0);
});

test('tokens of another accountant are not visible', function () {
    $token = UploadToken::factory()->create();

    $this->actingAs($this->user)
        ->getJson(route('upload-tokens.show', $token->token))
        ->assertJsonPath('state', 'invalid');
});
