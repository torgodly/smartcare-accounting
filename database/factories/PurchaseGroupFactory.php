<?php

namespace Database\Factories;

use App\Models\PurchaseGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseGroup>
 */
class PurchaseGroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'code' => 'G',
        ];
    }
}
