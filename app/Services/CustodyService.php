<?php

namespace App\Services;

use App\Models\Custody;
use App\Models\CustodyMovement;
use App\Models\Invoice;
use App\Models\Treasury;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Custody (عهدة) on the imprest system: the treasury issues a float, the holder spends it on invoices,
 * the treasury replenishes exactly what was spent, and closing returns whatever cash is left.
 *
 * @phpstan-type CustodyState array{issued: float, replenished: float, returned: float, spent: float, pending: float, pending_count: int, cash: float}
 */
class CustodyService
{
    /**
     * Open a custody and issue its first float from the treasury.
     *
     * @param  array{holder_name: string, title?: string|null, region: string, treasury_id: int, amount: string|float, date: string, note?: string|null}  $data
     */
    public function open(array $data, ?int $userId): Custody
    {
        return DB::transaction(function () use ($data, $userId): Custody {
            $custody = Custody::query()->create([
                'holder_name' => $data['holder_name'],
                'title' => $data['title'] ?? null,
                'region' => $data['region'],
                'treasury_id' => $data['treasury_id'],
                'status' => Custody::STATUS_OPEN,
            ]);

            $this->move($custody, CustodyMovement::TYPE_ISSUE, Money::toCents($data['amount']), $data['date'], $data['note'] ?? null, $userId, $data['treasury_id']);

            return $custody;
        });
    }

    /**
     * Add to the float (زيادة العهدة).
     */
    public function topUp(Custody $custody, int $cents, string $date, ?string $note, ?int $userId, ?int $treasuryId = null): CustodyMovement
    {
        $this->ensureOpen($custody);

        return $this->move($custody, CustodyMovement::TYPE_ISSUE, $cents, $date, $note, $userId, $treasuryId);
    }

    /**
     * Pay the holder back for every unsettled invoice, bringing the cash back up to the float.
     */
    public function replenish(Custody $custody, string $date, ?string $note, ?int $userId, ?int $treasuryId = null): CustodyMovement
    {
        $this->ensureOpen($custody);

        return DB::transaction(function () use ($custody, $date, $note, $userId, $treasuryId): CustodyMovement {
            $pending = $this->lockPending($custody);
            $cents = $pending->sum(fn (Invoice $invoice): int => Money::toCents($invoice->price));

            if ($cents <= 0) {
                throw ValidationException::withMessages(['custody' => 'لا توجد فواتير جديدة لتعويضها']);
            }

            $movement = $this->move($custody, CustodyMovement::TYPE_REPLENISH, $cents, $date, $note, $userId, $treasuryId);
            Invoice::query()->whereKey($pending->modelKeys())->update(['custody_movement_id' => $movement->id]);

            return $movement;
        });
    }

    /**
     * Close the custody: unsettled invoices are accepted, the remaining cash goes back to the treasury
     * (or, when the holder overspent, the treasury pays the difference).
     */
    public function close(Custody $custody, string $date, ?string $note, ?int $userId): ?CustodyMovement
    {
        $this->ensureOpen($custody);

        return DB::transaction(function () use ($custody, $date, $note, $userId): ?CustodyMovement {
            $pending = $this->lockPending($custody);
            $cash = Money::toCents($this->state($custody)['cash']);

            $movement = null;
            if ($cash !== 0 || $pending->isNotEmpty()) {
                $movement = $cash >= 0
                    ? $this->move($custody, CustodyMovement::TYPE_RETURN, $cash, $date, $note, $userId)
                    : $this->move($custody, CustodyMovement::TYPE_REPLENISH, -$cash, $date, $note, $userId);

                Invoice::query()->whereKey($pending->modelKeys())->update(['custody_movement_id' => $movement->id]);
            }

            $custody->update(['status' => Custody::STATUS_CLOSED, 'closed_on' => $date]);

            return $movement;
        });
    }

    /**
     * The custody's money position.
     *
     * @return CustodyState
     */
    public function state(Custody $custody): array
    {
        return $this->states([$custody->id])[$custody->id];
    }

    /**
     * Money positions for many custodies with three queries.
     *
     * @param  list<int>  $ids
     * @return array<int, CustodyState>
     */
    public function states(array $ids): array
    {
        $sums = array_fill_keys($ids, ['issue' => 0, 'replenish' => 0, 'return' => 0, 'spent' => 0, 'pending' => 0, 'pending_count' => 0]);

        if ($ids !== []) {
            CustodyMovement::query()
                ->whereIn('custody_id', $ids)
                ->groupBy('custody_id', 'type')
                ->selectRaw('custody_id, type, sum(amount) as total')
                ->get()
                ->each(function ($row) use (&$sums): void {
                    $sums[$row->custody_id][$row->type] += Money::toCents($row->total);
                });

            Invoice::query()
                ->whereIn('custody_id', $ids)
                ->get(['custody_id', 'price', 'custody_movement_id'])
                ->each(function (Invoice $invoice) use (&$sums): void {
                    $cents = Money::toCents($invoice->price);
                    $sums[$invoice->custody_id]['spent'] += $cents;

                    if ($invoice->custody_movement_id === null) {
                        $sums[$invoice->custody_id]['pending'] += $cents;
                        $sums[$invoice->custody_id]['pending_count']++;
                    }
                });
        }

        return array_map(fn (array $sum): array => [
            'issued' => Money::fromCents($sum['issue']),
            'replenished' => Money::fromCents($sum['replenish']),
            'returned' => Money::fromCents($sum['return']),
            'spent' => Money::fromCents($sum['spent']),
            'pending' => Money::fromCents($sum['pending']),
            'pending_count' => $sum['pending_count'],
            'cash' => Money::fromCents($sum['issue'] + $sum['replenish'] - $sum['return'] - $sum['spent']),
        ], $sums);
    }

    /**
     * @return Collection<int, Invoice>
     */
    private function lockPending(Custody $custody): Collection
    {
        return Invoice::query()
            ->where('custody_id', $custody->id)
            ->whereNull('custody_movement_id')
            ->lockForUpdate()
            ->get(['id', 'price']);
    }

    private function move(Custody $custody, string $type, int $cents, string $date, ?string $note, ?int $userId, ?int $treasuryId = null): CustodyMovement
    {
        if ($treasuryId !== null && ! Treasury::query()->whereKey($treasuryId)->exists()) {
            throw ValidationException::withMessages(['treasury_id' => 'اختر الخزينة']);
        }

        return $custody->movements()->create([
            'treasury_id' => $treasuryId ?? $custody->treasury_id,
            'type' => $type,
            'amount' => number_format($cents / 100, 2, '.', ''),
            'date' => $date,
            'note' => $note,
            'created_by' => $userId,
        ]);
    }

    private function ensureOpen(Custody $custody): void
    {
        if (! $custody->isOpen()) {
            throw ValidationException::withMessages(['custody' => 'هذه العهدة مغلقة']);
        }
    }
}
