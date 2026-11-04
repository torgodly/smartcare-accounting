<?php

namespace App\Services;

use App\Models\Invoice;
use Illuminate\Database\UniqueConstraintViolationException;

/**
 * Copies last month's recurring invoices into the month (spec 5.5).
 */
class RecurringInvoices
{
    public function __construct(private SerialNumber $serials) {}

    /**
     * Create the missing copies for $month. Idempotent; never touches future months.
     */
    public function ensureFor(string $month): int
    {
        if ($month > Months::current()) {
            return 0;
        }

        $previous = Invoice::query()
            ->with('group')
            ->where('month', Months::add($month, -1))
            ->where('type', Invoice::TYPE_RECURRING)
            ->orderBy('id')
            ->get();

        if ($previous->isEmpty()) {
            return 0;
        }

        $existingChains = Invoice::query()
            ->where('month', $month)
            ->whereNotNull('recurring_root_id')
            ->pluck('recurring_root_id')
            ->all();

        $created = 0;

        // TODO(spec): deleting an auto copy brings it back on the next load while last month's invoice stays recurring.
        foreach ($previous as $invoice) {
            $chain = $invoice->chainId();

            if (in_array($chain, $existingChains, true)) {
                continue;
            }

            try {
                $this->serials->createInvoice($invoice->group, $month, [
                    'title' => $invoice->title,
                    'price' => $invoice->price,
                    'reason' => $invoice->reason,
                    'type' => Invoice::TYPE_RECURRING,
                    'recurring_root_id' => $chain,
                    'is_auto' => true,
                    'receipt_id' => null,
                    'created_by' => null,
                ]);
                $created++;
            } catch (UniqueConstraintViolationException) {
                // Another request created the same copy first.
            }
        }

        return $created;
    }
}
