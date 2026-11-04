<?php

namespace App\Models;

use Database\Factories\PayrollRecordFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $employee_id
 * @property string $month
 * @property string $base_salary
 * @property string $bonus
 * @property string $manual_deduction
 * @property string $paid_amount
 * @property string|null $note
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['employee_id', 'month', 'base_salary', 'bonus', 'manual_deduction', 'paid_amount', 'note'])]
class PayrollRecord extends Model
{
    /** @use HasFactory<PayrollRecordFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'bonus' => 'decimal:2',
            'manual_deduction' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
