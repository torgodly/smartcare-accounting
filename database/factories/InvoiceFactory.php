<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\PurchaseGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'purchase_group_id' => PurchaseGroup::factory(),
            'month' => now()->format('Y-m'),
            'sequence' => fn () => fake()->unique()->numberBetween(1, 999),
            'serial' => fn (array $attributes) => 'G-'.str_replace('-', '', substr($attributes['month'], 2)).'-'.str_pad((string) $attributes['sequence'], 3, '0', STR_PAD_LEFT).'-'.fake()->unique()->numberBetween(1, 99999),
            'title' => fake()->words(3, true),
            'price' => fake()->randomFloat(2, 10, 900),
            'reason' => null,
            'type' => 'once',
            'recurring_root_id' => null,
            'is_auto' => false,
            'receipt_id' => null,
            'created_by' => null,
        ];
    }
}
