<?php

namespace App\Models;

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
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'code', 'sort_order'])]
class PurchaseGroup extends Model
{
    /** @use HasFactory<PurchaseGroupFactory> */
    use HasFactory;

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
