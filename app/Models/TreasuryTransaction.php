<?php

namespace App\Models;

use Database\Factories\TreasuryTransactionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A manual deposit into or withdrawal from a treasury. A transfer is a withdrawal plus a deposit.
 *
 * @property int $id
 * @property int $treasury_id
 * @property string $type
 * @property string $amount
 * @property string $date
 * @property string|null $note
 * @property int|null $transfer_treasury_id
 * @property string|null $transfer_id
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['treasury_id', 'type', 'amount', 'date', 'note', 'transfer_treasury_id', 'transfer_id', 'created_by'])]
class TreasuryTransaction extends Model
{
    /** @use HasFactory<TreasuryTransactionFactory> */
    use HasFactory;

    public const TYPE_DEPOSIT = 'deposit';

    public const TYPE_WITHDRAWAL = 'withdrawal';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Treasury, $this>
     */
    public function treasury(): BelongsTo
    {
        return $this->belongsTo(Treasury::class);
    }

    /**
     * @return BelongsTo<Treasury, $this>
     */
    public function transferTreasury(): BelongsTo
    {
        return $this->belongsTo(Treasury::class, 'transfer_treasury_id');
    }
}
