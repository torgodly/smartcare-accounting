<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Receipt;
use App\Models\UploadToken;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Receipt images on the private local disk.
 */
class ReceiptStorage
{
    public const DISK = 'local';

    /**
     * Store an uploaded image.
     */
    public function store(UploadedFile $file, string $source): Receipt
    {
        $id = (string) Str::uuid();
        $extension = match ($file->getMimeType()) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg',
        };

        $path = $file->storeAs('receipts', $id.'.'.$extension, self::DISK);

        return Receipt::query()->create([
            'id' => $id,
            'path' => $path,
            'mime' => $file->getMimeType() ?? 'image/jpeg',
            'size' => $file->getSize(),
            'source' => $source,
        ]);
    }

    /**
     * Delete the file and its row.
     */
    public function delete(?Receipt $receipt): void
    {
        if ($receipt === null) {
            return;
        }

        Storage::disk(self::DISK)->delete($receipt->path);
        $receipt->delete();
    }

    /**
     * Absolute path of the image file, or null when it is missing.
     */
    public function absolutePath(Receipt $receipt): ?string
    {
        $disk = Storage::disk(self::DISK);

        return $disk->exists($receipt->path) ? $disk->path($receipt->path) : null;
    }

    /**
     * Delete receipts older than a day that no invoice uses (uploads that were never saved).
     */
    public function pruneOrphans(): int
    {
        $orphans = Receipt::query()
            ->where('created_at', '<', now()->subDay())
            ->whereNotIn('id', Invoice::query()->whereNotNull('receipt_id')->select('receipt_id'))
            ->get();

        UploadToken::query()->whereIn('receipt_id', $orphans->pluck('id'))->update(['receipt_id' => null]);

        $orphans->each(fn (Receipt $receipt) => $this->delete($receipt));

        return $orphans->count();
    }
}
