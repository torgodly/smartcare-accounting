<?php

namespace App\Models;

use Database\Factories\InvoiceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $purchase_group_id
 * @property string $month
 * @property int $sequence
 * @property string $serial
 * @property string $title
 * @property string $price
 * @property string|null $reason
 * @property string $type
 * @property int|null $recurring_root_id
 * @property bool $is_auto
 * @property string|null $receipt_id
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['purchase_group_id', 'month', 'sequence', 'serial', 'title', 'price', 'reason', 'type', 'recurring_root_id', 'is_auto', 'receipt_id', 'created_by'])]
class Invoice extends Model
{
    /** @use HasFactory<InvoiceFactory> */
    use HasFactory;

    public const TYPE_ONCE = 'once';

    public const TYPE_RECURRING = 'recurring';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_auto' => 'boolean',
            'sequence' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<PurchaseGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(PurchaseGroup::class, 'purchase_group_id');
    }

    /**
     * @return BelongsTo<Receipt, $this>
     */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    /**
     * @return BelongsTo<Invoice, $this>
     */
    public function recurringRoot(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'recurring_root_id');
    }

    /**
     * The id that identifies this invoice's recurring chain.
     */
    public function chainId(): int
    {
        return $this->recurring_root_id ?? $this->id;
    }
}
