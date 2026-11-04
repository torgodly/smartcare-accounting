<?php

namespace App\Models;

use Database\Factories\UploadTokenFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $token
 * @property int $user_id
 * @property Carbon $expires_at
 * @property Carbon|null $used_at
 * @property string|null $receipt_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['token', 'user_id', 'expires_at', 'used_at', 'receipt_id'])]
class UploadToken extends Model
{
    /** @use HasFactory<UploadTokenFactory> */
    use HasFactory;

    public const LIFETIME_MINUTES = 10;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Receipt, $this>
     */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    /**
     * The token's state: ok, used or expired.
     */
    public function state(): string
    {
        if ($this->used_at !== null) {
            return 'used';
        }

        if ($this->expires_at->isPast()) {
            return 'expired';
        }

        return 'ok';
    }
}
