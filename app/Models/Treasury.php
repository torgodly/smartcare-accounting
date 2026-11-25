<?php

namespace App\Models;

use App\Models\Concerns\HasRegion;
use Database\Factories\TreasuryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $region
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'region', 'sort_order'])]
class Treasury extends Model
{
    /** @use HasFactory<TreasuryFactory> */
    use HasFactory, HasRegion;

    /**
     * Give new treasuries a sort order equal to their id.
     */
    protected static function booted(): void
    {
        static::created(function (Treasury $treasury): void {
            if (! $treasury->sort_order) {
                $treasury->sort_order = $treasury->id;
                $treasury->saveQuietly();
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
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return HasMany<TreasuryTransaction, $this>
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(TreasuryTransaction::class);
    }

    /**
     * @return HasMany<PayrollRecord, $this>
     */
    public function payrollRecords(): HasMany
    {
        return $this->hasMany(PayrollRecord::class);
    }

    /**
     * @return HasMany<Invoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * @return HasMany<Custody, $this>
     */
    public function custodies(): HasMany
    {
        return $this->hasMany(Custody::class);
    }

    /**
     * @return HasMany<CustodyMovement, $this>
     */
    public function custodyMovements(): HasMany
    {
        return $this->hasMany(CustodyMovement::class);
    }

    /**
     * Order treasuries the way every list shows them.
     *
     * @param  Builder<Treasury>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Whether anything was ever paid into or out of the treasury.
     */
    public function hasActivity(): bool
    {
        return $this->transactions()->exists()
            || $this->payrollRecords()->exists()
            || $this->invoices()->exists()
            || $this->custodies()->exists()
            || $this->custodyMovements()->exists()
            || TreasuryTransaction::query()->where('transfer_treasury_id', $this->id)->exists();
    }

    /**
     * The first treasury of a region, used when nothing else is chosen.
     */
    public static function defaultFor(string $region): ?self
    {
        return static::query()->inRegion($region)->ordered()->first();
    }
}
