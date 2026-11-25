<?php

namespace Database\Factories;

use App\Models\Treasury;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Treasury>
 */
class TreasuryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'خزينة '.fake()->word(), 'region' => 'east',
        ];
    }
}
