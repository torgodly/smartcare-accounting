<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\PayrollRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PayrollRecord>
 */
class PayrollRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'month' => now()->format('Y-m'),
            'base_salary' => 1400,
            'bonus' => 0,
            'manual_deduction' => 0,
            'paid_amount' => 0,
            'note' => null,
        ];
    }
}
