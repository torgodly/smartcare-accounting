<?php

namespace Database\Factories;

use App\Models\Custody;
use App\Models\Treasury;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Custody>
 */
class CustodyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'holder_name' => fake()->name(), 'title' => null, 'region' => 'east', 'treasury_id' => Treasury::factory(), 'status' => 'open',
        ];
    }
}
