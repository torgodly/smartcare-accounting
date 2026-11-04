<?php

namespace Database\Factories;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceRecord>
 */
class AttendanceRecordFactory extends Factory
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
            'date' => now()->toDateString(),
            'status' => 'present',
            'check_in' => '08:00',
            'check_out' => '16:00',
            'note' => null,
        ];
    }
}
