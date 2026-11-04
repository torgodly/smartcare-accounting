<?php

namespace App\Models;

use Database\Factories\EmployeeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $job_title
 * @property string $base_salary
 * @property string $start_month
 * @property string $attendance_mode
 * @property string|null $shift_start
 * @property string|null $shift_end
 * @property string|null $absence_day_rate
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'job_title', 'base_salary', 'start_month', 'attendance_mode', 'shift_start', 'shift_end', 'absence_day_rate', 'sort_order'])]
class Employee extends Model
{
    /** @use HasFactory<EmployeeFactory> */
    use HasFactory;

    public const MODE_TIME = 'time';

    public const MODE_NOTIME = 'notime';

    public const MODE_NONE = 'none';

    /**
     * Give new employees a sort order equal to their id.
     */
    protected static function booted(): void
    {
        static::created(function (Employee $employee): void {
            if (! $employee->sort_order) {
                $employee->sort_order = $employee->id;
                $employee->saveQuietly();
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'absence_day_rate' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return HasMany<PayrollRecord, $this>
     */
    public function payrollRecords(): HasMany
    {
        return $this->hasMany(PayrollRecord::class);
    }

    /**
     * @return HasMany<AttendanceRecord, $this>
     */
    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    /**
     * Order employees the way every list shows them.
     *
     * @param  Builder<Employee>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Whether the employee is tracked in attendance at all.
     */
    public function tracksAttendance(): bool
    {
        return $this->attendance_mode !== self::MODE_NONE;
    }
}
