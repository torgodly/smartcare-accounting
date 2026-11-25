<?php

namespace Database\Factories;

use App\Models\Custody;
use App\Models\CustodyMovement;
use App\Models\Treasury;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CustodyMovement>
 */
class CustodyMovementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'custody_id' => Custody::factory(), 'treasury_id' => Treasury::factory(), 'type' => 'issue', 'amount' => 500, 'date' => now()->toDateString(),
        ];
    }
}
