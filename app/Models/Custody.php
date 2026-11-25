<?php

namespace App\Models;

use App\Models\Concerns\HasRegion;
use Database\Factories\CustodyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A cash float (عهدة) held by one person and renewed on the imprest system.
 *
 * @property int $id
 * @property string $holder_name
 * @property string|null $title
 * @property string $region
 * @property int $treasury_id
 * @property string $status
 * @property string|null $closed_on
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['holder_name', 'title', 'region', 'treasury_id', 'status', 'closed_on'])]
class Custody extends Model
{
    /** @use HasFactory<CustodyFactory> */
    use HasFactory, HasRegion;

    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    /**
     * @return BelongsTo<Treasury, $this>
     */
    public function treasury(): BelongsTo
    {
        return $this->belongsTo(Treasury::class);
    }

    /**
     * @return HasMany<CustodyMovement, $this>
     */
    public function movements(): HasMany
    {
        return $this->hasMany(CustodyMovement::class);
    }

    /**
     * @return HasMany<Invoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Whether invoices can still be charged to it.
     */
    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    /**
     * The name shown in lists and selects.
     */
    public function label(): string
    {
        return $this->title !== null && $this->title !== '' ? $this->holder_name.' · '.$this->title : $this->holder_name;
    }
}
