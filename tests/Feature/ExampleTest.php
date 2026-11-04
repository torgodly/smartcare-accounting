<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
});

test('returns a successful response for accountants', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('home'))
        ->assertOk();
});
