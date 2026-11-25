<?php

namespace App\Models;

use App\Models\Concerns\HasRegion;
use Database\Factories\PurchaseGroupFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string $region
 * @property string $kind
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'code', 'region', 'kind', 'sort_order'])]
class PurchaseGroup extends Model
{
    /** @use HasFactory<PurchaseGroupFactory> */
    use HasFactory, HasRegion;

    public const KIND_PURCHASE = 'purchase';

    public const KIND_EXPENSE = 'expense';

    /** @var array<string, string> */
    public const KIND_LABELS = [
        self::KIND_PURCHASE => 'المشتريات',
        self::KIND_EXPENSE => 'المصروفات',
    ];

    /**
     * Give new groups a sort order equal to their id.
     */
    protected static function booted(): void
    {
        static::created(function (PurchaseGroup $group): void {
            if (! $group->sort_order) {
                $group->sort_order = $group->id;
                $group->saveQuietly();
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
     * @return HasMany<Invoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
