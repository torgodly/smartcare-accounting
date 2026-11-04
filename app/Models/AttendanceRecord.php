<?php

namespace App\Models;

use Database\Factories\AttendanceRecordFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $employee_id
 * @property string $date stored as Y-m-d (no cast, so SQLite and MySQL compare it the same way)
 * @property string $status
 * @property string|null $check_in
 * @property string|null $check_out
 * @property string|null $note
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['employee_id', 'date', 'status', 'check_in', 'check_out', 'note'])]
class AttendanceRecord extends Model
{
    /** @use HasFactory<AttendanceRecordFactory> */
    use HasFactory;

    public const STATUSES = ['present', 'absent', 'excuse', 'leave'];

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
