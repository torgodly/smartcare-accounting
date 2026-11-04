<?php

namespace Database\Factories;

use App\Models\UploadToken;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<UploadToken>
 */
class UploadTokenFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'token' => Str::random(48),
            'user_id' => User::factory(),
            'expires_at' => now()->addMinutes(10),
            'used_at' => null,
            'receipt_id' => null,
        ];
    }
}
