<?php

namespace App\Models;

use Database\Factories\ReceiptFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $path
 * @property string $mime
 * @property int $size
 * @property string $source
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['id', 'path', 'mime', 'size', 'source'])]
class Receipt extends Model
{
    /** @use HasFactory<ReceiptFactory> */
    use HasFactory, HasUuids;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    /**
     * The authenticated URL that streams the image.
     */
    public function url(): string
    {
        return route('receipts.show', $this);
    }
}
