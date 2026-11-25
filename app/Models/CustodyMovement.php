<?php

namespace App\Models;

use Database\Factories\CustodyMovementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Money moving between a treasury and a custody holder.
 * issue and replenish leave the treasury; return comes back into it.
 *
 * @property int $id
 * @property int $custody_id
 * @property int $treasury_id
 * @property string $type
 * @property string $amount
 * @property string $date
 * @property string|null $note
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['custody_id', 'treasury_id', 'type', 'amount', 'date', 'note', 'created_by'])]
class CustodyMovement extends Model
{
    /** @use HasFactory<CustodyMovementFactory> */
    use HasFactory;

    public const TYPE_ISSUE = 'issue';

    public const TYPE_REPLENISH = 'replenish';

    public const TYPE_RETURN = 'return';

    /** @var array<string, string> */
    public const LABELS = [
        self::TYPE_ISSUE => 'صرف عهدة',
        self::TYPE_REPLENISH => 'تعويض مصروفات',
        self::TYPE_RETURN => 'إرجاع عهدة',
    ];

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
     * @return BelongsTo<Custody, $this>
     */
    public function custody(): BelongsTo
    {
        return $this->belongsTo(Custody::class);
    }

    /**
     * @return BelongsTo<Treasury, $this>
     */
    public function treasury(): BelongsTo
    {
        return $this->belongsTo(Treasury::class);
    }

    /**
     * The invoices this movement settled.
     *
     * @return HasMany<Invoice, $this>
     */
    public function settledInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Whether the money goes out of the treasury.
     */
    public function isOutflow(): bool
    {
        return $this->type !== self::TYPE_RETURN;
    }
}
