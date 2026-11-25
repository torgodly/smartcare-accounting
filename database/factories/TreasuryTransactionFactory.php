<?php

namespace Database\Factories;

use App\Models\Treasury;
use App\Models\TreasuryTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TreasuryTransaction>
 */
class TreasuryTransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'treasury_id' => Treasury::factory(), 'type' => 'deposit', 'amount' => 1000, 'date' => now()->toDateString(), 'note' => null,
        ];
    }
}
