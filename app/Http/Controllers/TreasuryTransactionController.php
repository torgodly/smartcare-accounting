<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTreasuryTransactionRequest;
use App\Models\Treasury;
use App\Models\TreasuryTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TreasuryTransactionController extends Controller
{
    /**
     * Record a deposit, a withdrawal or a transfer to another treasury.
     */
    public function store(StoreTreasuryTransactionRequest $request, Treasury $treasury): RedirectResponse
    {
        $data = $request->validated();
        $common = [
            'amount' => $data['amount'],
            'date' => $data['date'],
            'note' => $data['note'] ?? null,
            'created_by' => $request->user()?->id,
        ];

        if ($data['type'] === 'transfer') {
            $common['transfer_id'] = (string) Str::uuid();

            DB::transaction(function () use ($treasury, $data, $common): void {
                TreasuryTransaction::query()->create([
                    ...$common,
                    'treasury_id' => $treasury->id,
                    'type' => TreasuryTransaction::TYPE_WITHDRAWAL,
                    'transfer_treasury_id' => $data['to_treasury_id'],
                ]);
                TreasuryTransaction::query()->create([
                    ...$common,
                    'treasury_id' => $data['to_treasury_id'],
                    'type' => TreasuryTransaction::TYPE_DEPOSIT,
                    'transfer_treasury_id' => $treasury->id,
                ]);
            });

            Inertia::flash('success', 'تم التحويل');

            return back();
        }

        TreasuryTransaction::query()->create([...$common, 'treasury_id' => $treasury->id, 'type' => $data['type']]);

        Inertia::flash('success', $data['type'] === TreasuryTransaction::TYPE_DEPOSIT ? 'تم تسجيل الإيداع' : 'تم تسجيل السحب');

        return back();
    }

    /**
     * Delete a manual movement; a transfer is deleted on both sides.
     */
    public function destroy(TreasuryTransaction $transaction): RedirectResponse
    {
        DB::transaction(function () use ($transaction): void {
            if ($transaction->transfer_id !== null) {
                TreasuryTransaction::query()->where('transfer_id', $transaction->transfer_id)->delete();
            } else {
                $transaction->delete();
            }
        });

        Inertia::flash('success', 'تم حذف الحركة');

        return back();
    }
}
