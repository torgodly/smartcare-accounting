import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import AppShell, { PageHeader } from '@/layouts/AppShell';
import { show } from '@/routes/treasuries';
import type { Treasury, TreasuryRef } from '@/types';
import { TransactionDialog } from './TransactionDialog';
import { TreasuryDialog } from './TreasuryDialog';

export default function TreasuriesIndex({
    treasuries,
    total,
    allTreasuries,
}: {
    treasuries: Treasury[];
    total: number;
    allTreasuries: TreasuryRef[];
}) {
    const { month } = useMonth();
    const { region } = usePage().props;
    const [creating, setCreating] = useState(false);
    const [deposit, setDeposit] = useState<{
        open: boolean;
        treasury: TreasuryRef | null;
    }>({ open: false, treasury: null });

    return (
        <AppShell>
            <Head title="الخزائن" />
            <PageHeader
                title="الخزائن"
                description="كل مبلغ يُصرف (رواتب، فواتير، عُهد) يخرج من خزينة محددة، والرصيد = الإيداعات − كل ما صُرف منها."
                actions={
                    <Button onClick={() => setCreating(true)}>
                        <Plus />
                        خزينة
                    </Button>
                }
            />

            {treasuries.length === 0 ? (
                <EmptyState
                    title="لا توجد خزائن في هذه المنطقة"
                    description="أضف خزينة ثم سجّل الإيداعات فيها."
                    action={
                        <Button onClick={() => setCreating(true)}>
                            <Plus />
                            خزينة جديدة
                        </Button>
                    }
                />
            ) : (
                <>
                    <div className="panel mb-4 flex flex-col gap-0.5 px-5 py-4">
                        <span className="text-[12px] text-muted">
                            إجمالي الأرصدة
                        </span>
                        <Money
                            value={total}
                            size="summary"
                            tone={total < 0 ? 'bad' : 'default'}
                        />
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                        {treasuries.map((treasury) => (
                            <div
                                key={treasury.id}
                                className="panel flex flex-col gap-3 p-4"
                            >
                                <Link
                                    href={show.url(treasury.id, {
                                        query: { month },
                                    })}
                                    className="group flex flex-col gap-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h2 className="min-w-0 text-[17px] font-semibold group-hover:text-accent">
                                            {treasury.name}
                                        </h2>
                                        {region === 'all' && (
                                            <StatusPill kind="neutral">
                                                {treasury.region_label}
                                            </StatusPill>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] text-muted">
                                            الرصيد الحالي
                                        </span>
                                        <Money
                                            value={treasury.balance}
                                            size="summary"
                                            tone={
                                                treasury.balance < 0
                                                    ? 'bad'
                                                    : 'default'
                                            }
                                        />
                                        {treasury.balance < 0 && (
                                            <span className="mt-1 text-[12.5px] text-bad-700">
                                                المصروف أكثر من الإيداعات، سجّل
                                                إيداعاً (رصيد افتتاحي).
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <div className="dashed-divider" />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() =>
                                            setDeposit({
                                                open: true,
                                                treasury,
                                            })
                                        }
                                    >
                                        <Plus />
                                        إيداع
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        asChild
                                    >
                                        <Link
                                            href={show.url(treasury.id, {
                                                query: { month },
                                            })}
                                        >
                                            كشف الحركات
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {deposit.treasury && (
                <TransactionDialog
                    open={deposit.open}
                    initialType="deposit"
                    treasury={deposit.treasury}
                    treasuries={allTreasuries}
                    onOpenChange={(open) =>
                        setDeposit((state) => ({ ...state, open }))
                    }
                />
            )}
            <TreasuryDialog
                open={creating}
                treasury={null}
                onOpenChange={setCreating}
            />
        </AppShell>
    );
}
