<?php

namespace App\Services;

use App\Models\CustodyMovement;
use App\Models\Invoice;
use App\Models\PayrollRecord;
use App\Models\Treasury;
use App\Models\TreasuryTransaction;
use Carbon\CarbonInterface;

/**
 * Treasury balances and month ledgers. Money in: deposits and custody returns.
 * Money out: withdrawals, salary payments, invoices paid directly and custody issues/replenishments.
 *
 * @phpstan-type LedgerEntry array{
 *     key: string,
 *     date: string,
 *     kind: string,
 *     description: string,
 *     detail: string|null,
 *     amount: float,
 *     balance: float,
 *     custody_id: int|null,
 *     group_id: int|null,
 * }
 */
class TreasuryLedger
{
    /** @var array<string, string> */
    public const KIND_LABELS = [
        'deposit' => 'إيداع',
        'withdrawal' => 'سحب',
        'transfer_in' => 'تحويل وارد',
        'transfer_out' => 'تحويل صادر',
        'salary' => 'راتب',
        'invoice' => 'فاتورة',
        'expense' => 'مصروف',
        'custody' => 'عهدة',
    ];

    /**
     * Balances in cents, keyed by treasury id. With $beforeMonth only activity before that month counts.
     *
     * @param  list<int>  $ids
     * @return array<int, int>
     */
    public function balances(array $ids, ?string $beforeMonth = null): array
    {
        $balances = array_fill_keys($ids, 0);

        if ($ids === []) {
            return $balances;
        }

        $firstDay = $beforeMonth !== null ? Months::firstDay($beforeMonth)->toDateString() : null;

        $add = function (iterable $rows, int $sign) use (&$balances): void {
            foreach ($rows as $row) {
                if (isset($balances[$row->treasury_id])) {
                    $balances[$row->treasury_id] += $sign * Money::toCents($row->total);
                }
            }
        };

        foreach ([TreasuryTransaction::TYPE_DEPOSIT => 1, TreasuryTransaction::TYPE_WITHDRAWAL => -1] as $type => $sign) {
            $add(TreasuryTransaction::query()
                ->whereIn('treasury_id', $ids)
                ->where('type', $type)
                ->when($firstDay, fn ($query) => $query->where('date', '<', $firstDay))
                ->groupBy('treasury_id')
                ->selectRaw('treasury_id, sum(amount) as total')
                ->get(), $sign);
        }

        foreach ([CustodyMovement::TYPE_RETURN => 1, CustodyMovement::TYPE_ISSUE => -1, CustodyMovement::TYPE_REPLENISH => -1] as $type => $sign) {
            $add(CustodyMovement::query()
                ->whereIn('treasury_id', $ids)
                ->where('type', $type)
                ->when($firstDay, fn ($query) => $query->where('date', '<', $firstDay))
                ->groupBy('treasury_id')
                ->selectRaw('treasury_id, sum(amount) as total')
                ->get(), $sign);
        }

        $add(PayrollRecord::query()
            ->whereIn('treasury_id', $ids)
            ->when($beforeMonth, fn ($query) => $query->where('month', '<', $beforeMonth))
            ->groupBy('treasury_id')
            ->selectRaw('treasury_id, sum(paid_amount) as total')
            ->get(), -1);

        $add(Invoice::query()
            ->whereIn('treasury_id', $ids)
            ->whereNull('custody_id')
            ->when($beforeMonth, fn ($query) => $query->where('month', '<', $beforeMonth))
            ->groupBy('treasury_id')
            ->selectRaw('treasury_id, sum(price) as total')
            ->get(), -1);

        return $balances;
    }

    /**
     * One treasury's balance in cents.
     */
    public function balance(Treasury $treasury, ?string $beforeMonth = null): int
    {
        return $this->balances([$treasury->id], $beforeMonth)[$treasury->id];
    }

    /**
     * The month's movements with a running balance.
     *
     * @return array{opening: float, inflow: float, outflow: float, closing: float, entries: list<LedgerEntry>}
     */
    public function month(Treasury $treasury, string $month): array
    {
        $from = Months::firstDay($month)->toDateString();
        $to = Months::firstDay(Months::add($month, 1))->toDateString();

        $entries = [];

        $transactions = $treasury->transactions()
            ->with('transferTreasury')
            ->where('date', '>=', $from)
            ->where('date', '<', $to)
            ->get();

        foreach ($transactions as $transaction) {
            $isDeposit = $transaction->type === TreasuryTransaction::TYPE_DEPOSIT;
            $kind = $transaction->transfer_treasury_id !== null
                ? ($isDeposit ? 'transfer_in' : 'transfer_out')
                : $transaction->type;

            $entries[] = $this->entry(
                key: 't'.$transaction->id,
                date: $transaction->date,
                kind: $kind,
                description: $transaction->transferTreasury !== null
                    ? ($isDeposit ? 'من ' : 'إلى ').$transaction->transferTreasury->name.' ('.Regions::LABELS[$transaction->transferTreasury->region].')'
                    : self::KIND_LABELS[$kind],
                detail: $transaction->note,
                cents: ($isDeposit ? 1 : -1) * Money::toCents($transaction->amount),
                sort: $transaction->id,
            );
        }

        $movements = $treasury->custodyMovements()
            ->with('custody')
            ->where('date', '>=', $from)
            ->where('date', '<', $to)
            ->get();

        foreach ($movements as $movement) {
            $entries[] = $this->entry(
                key: 'c'.$movement->id,
                date: $movement->date,
                kind: 'custody',
                description: CustodyMovement::LABELS[$movement->type].' · '.$movement->custody->label(),
                detail: $movement->note,
                cents: ($movement->isOutflow() ? -1 : 1) * Money::toCents($movement->amount),
                sort: $movement->id,
                custodyId: $movement->custody_id,
            );
        }

        $payroll = $treasury->payrollRecords()
            ->with('employee')
            ->where('month', $month)
            ->where('paid_amount', '>', 0)
            ->get();

        foreach ($payroll as $record) {
            $entries[] = $this->entry(
                key: 'p'.$record->id,
                date: $this->clampToMonth($record->updated_at, $month),
                kind: 'salary',
                description: 'راتب '.$record->employee->name,
                detail: PaymentMethods::label($record->payment_method).($record->account_number ? ' · '.$record->account_number : ''),
                cents: -Money::toCents($record->paid_amount),
                sort: $record->id,
            );
        }

        $invoices = $treasury->invoices()
            ->with('group')
            ->whereNull('custody_id')
            ->where('month', $month)
            ->get();

        foreach ($invoices as $invoice) {
            $entries[] = $this->entry(
                key: 'i'.$invoice->id,
                date: $this->clampToMonth($invoice->created_at, $month),
                kind: $invoice->group->kind === 'expense' ? 'expense' : 'invoice',
                description: $invoice->title,
                detail: $invoice->serial.' · '.$invoice->group->name,
                cents: -Money::toCents($invoice->price),
                sort: $invoice->id,
                groupId: $invoice->purchase_group_id,
            );
        }

        usort($entries, fn (array $a, array $b): int => [$a['date'], $a['sort']] <=> [$b['date'], $b['sort']]);

        $opening = $this->balance($treasury, $month);
        $running = $opening;
        $inflow = $outflow = 0;

        $result = [];
        foreach ($entries as $entry) {
            $cents = $entry['cents'];
            $running += $cents;
            $cents > 0 ? $inflow += $cents : $outflow -= $cents;

            unset($entry['cents'], $entry['sort']);
            $entry['amount'] = Money::fromCents($cents);
            $entry['balance'] = Money::fromCents($running);
            $result[] = $entry;
        }

        return [
            'opening' => Money::fromCents($opening),
            'inflow' => Money::fromCents($inflow),
            'outflow' => Money::fromCents($outflow),
            'closing' => Money::fromCents($running),
            'entries' => $result,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function entry(string $key, string $date, string $kind, string $description, ?string $detail, int $cents, int $sort, ?int $custodyId = null, ?int $groupId = null): array
    {
        return [
            'key' => $key,
            'date' => $date,
            'kind' => $kind,
            'description' => $description,
            'detail' => $detail,
            'cents' => $cents,
            'sort' => $sort,
            'custody_id' => $custodyId,
            'group_id' => $groupId,
        ];
    }

    /**
     * Keep a timestamp inside its month so month-based rows sort sensibly.
     */
    private function clampToMonth(?CarbonInterface $timestamp, string $month): string
    {
        $date = $timestamp?->toDateString();
        $first = Months::firstDay($month)->toDateString();
        $last = Months::firstDay($month)->endOfMonth()->toDateString();

        if ($date === null || $date < $first) {
            return $first;
        }

        return $date > $last ? $last : $date;
    }
}
