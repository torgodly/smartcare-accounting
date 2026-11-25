import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { RowItem, RowList } from '@/components/RowList';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import AppShell, { PageHeader } from '@/layouts/AppShell';
import { show } from '@/routes/custodies';
import type { Custody, TreasuryRef } from '@/types';
import { CustodyDialog } from './CustodyDialog';

export default function CustodiesIndex({
    custodies,
    treasuries,
    holders,
}: {
    custodies: Custody[];
    treasuries: TreasuryRef[];
    holders: string[];
}) {
    const { month } = useMonth();
    const [creating, setCreating] = useState(false);

    const open = (custody: Custody) =>
        router.visit(show.url(custody.id, { query: { month } }));

    return (
        <AppShell>
            <Head title="العُهد" />
            <PageHeader
                title="العُهد"
                description="عهدة تُصرف من خزينة لشخص، يُدخل عليها الفواتير، ثم تُجدَّد بتعويضه بمجموع ما صرف."
                actions={
                    <Button onClick={() => setCreating(true)}>
                        <Plus />
                        عهدة
                    </Button>
                }
            />

            {custodies.length === 0 ? (
                <EmptyState
                    title="لا توجد عُهد بعد"
                    description="اصرف عهدة لشخص من إحدى الخزائن، ثم أدخل فواتيره عليها."
                    action={
                        <Button onClick={() => setCreating(true)}>
                            <Plus />
                            عهدة جديدة
                        </Button>
                    }
                />
            ) : (
                <RowList>
                    {custodies.map((custody) => (
                        <RowItem
                            key={custody.id}
                            onOpen={() => open(custody)}
                            title={custody.holder_name}
                            meta={
                                <>
                                    <CustodyStatus custody={custody} />
                                    {custody.title && (
                                        <span>{custody.title}</span>
                                    )}
                                    <span>{custody.region_label}</span>
                                    <span>من {custody.treasury.name}</span>
                                </>
                            }
                            end={
                                custody.status === 'open' ? (
                                    <Money
                                        value={custody.cash}
                                        tone={
                                            custody.cash < 0 ? 'bad' : 'default'
                                        }
                                    />
                                ) : (
                                    <span className="text-muted">—</span>
                                )
                            }
                            endMeta={
                                custody.status !== 'open' ? (
                                    'مغلقة'
                                ) : custody.pending > 0 ? (
                                    <span className="text-warn-700">
                                        <Money
                                            value={custody.pending}
                                            size="inline"
                                            tone="inherit"
                                        />{' '}
                                        بانتظار التجديد
                                    </span>
                                ) : (
                                    <>
                                        مع المستلم من{' '}
                                        <Money
                                            value={custody.issued}
                                            size="inline"
                                            tone="inherit"
                                        />
                                    </>
                                )
                            }
                        />
                    ))}
                </RowList>
            )}

            <CustodyDialog
                open={creating}
                custody={null}
                treasuries={treasuries}
                holders={holders}
                onOpenChange={setCreating}
            />
        </AppShell>
    );
}

export function CustodyStatus({ custody }: { custody: Custody }) {
    if (custody.status === 'closed') {
        return <StatusPill kind="neutral">مغلقة</StatusPill>;
    }

    return custody.pending > 0 ? (
        <StatusPill kind="warn">تحتاج تجديد</StatusPill>
    ) : (
        <StatusPill kind="ok">مفتوحة</StatusPill>
    );
}
