<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'job_title' => fake()->jobTitle(),
            'base_salary' => fake()->randomElement([1200, 1400, 1800, 2200]),
            'start_month' => now()->format('Y-m'),
            'attendance_mode' => 'time',
            'shift_start' => null,
            'shift_end' => null,
            'absence_day_rate' => null,
        ];
    }
}
