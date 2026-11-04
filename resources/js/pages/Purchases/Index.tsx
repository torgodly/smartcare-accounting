import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import AppShell, { PageHeader } from '@/layouts/AppShell';
import { monthLabel } from '@/lib/months';
import { show } from '@/routes/purchase-groups';
import type { PurchaseGroup, PurchaseSummary } from '@/types';
import { GroupDialog } from './GroupDialog';

type GroupCard = PurchaseGroup & PurchaseSummary;

export default function PurchasesIndex({ groups }: { groups: GroupCard[] }) {
    const { month } = useMonth();
    const [creating, setCreating] = useState(false);

    return (
        <AppShell>
            <Head title="المشتريات" />
            <PageHeader
                title="المشتريات"
                description={`مجموعات المشتريات وإجمالي كل مجموعة في ${monthLabel(month)}`}
                actions={
                    <Button onClick={() => setCreating(true)}>
                        <Plus />
                        مجموعة
                    </Button>
                }
            />

            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                {groups.map((group) => (
                    <Link
                        key={group.id}
                        href={show.url(group.id, { query: { month } })}
                        className="panel flex flex-col gap-3 p-4 transition-colors hover:border-accent hover:bg-accent-soft/40"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="min-w-0 text-[17px] font-semibold">
                                {group.name}
                            </h2>
                            <span className="serial pt-1">{group.code}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                            <span>{group.count} فاتورة</span>
                            {group.missing_receipts > 0 && (
                                <StatusPill kind="warn">
                                    {group.missing_receipts} بلا إيصال
                                </StatusPill>
                            )}
                        </div>
                        <div className="dashed-divider" />
                        <div className="flex flex-col">
                            <span className="text-[12px] text-muted">
                                إجمالي الشهر
                            </span>
                            <Money value={group.total} size="summary" />
                        </div>
                    </Link>
                ))}
                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="flex min-h-[132px] items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-line text-[15px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                >
                    <Plus className="size-5" />
                    إنشاء مجموعة جديدة
                </button>
            </div>

            <GroupDialog
                open={creating}
                onOpenChange={setCreating}
                group={null}
            />
        </AppShell>
    );
}
