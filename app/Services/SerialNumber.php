<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\PurchaseGroup;
use Illuminate\Support\Facades\DB;

/**
 * Invoice serial numbers: CODE-YYMM-NNN (spec 5.6).
 */
class SerialNumber
{
    /**
     * Build a serial from its parts.
     */
    public static function format(string $code, string $month, int $sequence): string
    {
        return $code.'-'.substr($month, 2, 2).substr($month, 5, 2).'-'.str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Create an invoice with the next sequence of its group and month.
     * The group row is locked so two saves never get the same number.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function createInvoice(PurchaseGroup $group, string $month, array $attributes): Invoice
    {
        return DB::transaction(function () use ($group, $month, $attributes): Invoice {
            $locked = PurchaseGroup::query()->whereKey($group->id)->lockForUpdate()->firstOrFail();

            $sequence = (int) Invoice::query()
                ->where('purchase_group_id', $locked->id)
                ->where('month', $month)
                ->max('sequence') + 1;

            return Invoice::query()->create([
                ...$attributes,
                'purchase_group_id' => $locked->id,
                'month' => $month,
                'sequence' => $sequence,
                'serial' => self::format($locked->code, $month, $sequence),
            ]);
        });
    }
}
