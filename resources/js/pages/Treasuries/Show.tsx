import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeftRight, Minus, Plus, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { destroy as destroyTransaction } from '@/actions/App/Http/Controllers/TreasuryTransactionController';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { RowItem, RowList } from '@/components/RowList';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import type { PillKind } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import AppShell, { PageHeader } from '@/layouts/AppShell';
import { formatDate, monthLabel } from '@/lib/months';
import { show as showCustody } from '@/routes/custodies';
import { show as showGroup } from '@/routes/purchase-groups';
import { index as treasuriesIndex } from '@/routes/treasuries';
import type { Ledger, LedgerEntry, LedgerKind, TreasuryRef } from '@/types';
import { TransactionDialog } from './TransactionDialog';
import type { TransactionType } from './TransactionDialog';
import { TreasuryDialog } from './TreasuryDialog';

const KINDS: Record<LedgerKind, { label: string; pill: PillKind }> = {
    deposit: { label: 'إيداع', pill: 'ok' },
    withdrawal: { label: 'سحب', pill: 'bad' },
    transfer_in: { label: 'تحويل وارد', pill: 'ok' },
    transfer_out: { label: 'تحويل صادر', pill: 'warn' },
    salary: { label: 'راتب', pill: 'info' },
    invoice: { label: 'مشتريات', pill: 'accent' },
    expense: { label: 'مصروف', pill: 'accent' },
    custody: { label: 'عهدة', pill: 'warn' },
};

export default function TreasuriesShow({
    treasury,
    ledger,
    allTreasuries,
}: {
    treasury: TreasuryRef & { balance: number; can_delete: boolean };
    ledger: Ledger;
    allTreasuries: TreasuryRef[];
}) {
    const { month } = useMonth();
    const [transaction, setTransaction] = useState<{
        open: boolean;
        type: TransactionType;
    }>({ open: false, type: 'deposit' });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [removing, setRemoving] = useState<LedgerEntry | null>(null);
    const [deleting, setDeleting] = useState(false);

    const openTransaction = (type: TransactionType) =>
        setTransaction({ open: true, type });

    function removeEntry() {
        if (!removing) {
            return;
        }

        setDeleting(true);
        router.delete(destroyTransaction.url(Number(removing.key.slice(1))), {
            preserveScroll: true,
            onSuccess: () => setRemoving(null),
            onFinish: () => setDeleting(false),
        });
    }

    return (
        <AppShell>
            <Head title={treasury.name} />
            <PageHeader
                breadcrumb={
                    <Link
                        href={treasuriesIndex.url({ query: { month } })}
                        className="mb-1 inline-block text-[13px] text-muted hover:text-accent"
                    >
                        → الخزائن
                    </Link>
                }
                title={treasury.name}
                description={`${treasury.region_label} · حركات ${monthLabel(month)}`}
                actions={
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="إعدادات الخزينة"
                            title="إعدادات الخزينة"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => openTransaction('transfer')}
                        >
                            <ArrowLeftRight />
                            تحويل
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => openTransaction('withdrawal')}
                        >
                            <Minus />
                            سحب
                        </Button>
                        <Button onClick={() => openTransaction('deposit')}>
                            <Plus />
                            إيداع
                        </Button>
                    </>
                }
            />

            <div className="panel mb-4 grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-5">
                <Summary label="رصيد أول الشهر">
                    <Money value={ledger.opening} size="summary" />
                </Summary>
                <Summary label="الوارد">
                    <Money value={ledger.inflow} size="summary" tone="ok" />
                </Summary>
                <Summary label="الصادر">
                    <Money value={ledger.outflow} size="summary" tone="bad" />
                </Summary>
                <Summary label="رصيد آخر الشهر">
                    <Money
                        value={ledger.closing}
                        size="summary"
                        tone={ledger.closing < 0 ? 'bad' : 'default'}
                    />
                </Summary>
                <Summary label="الرصيد الحالي">
                    <Money
                        value={treasury.balance}
                        size="summary"
                        tone={treasury.balance < 0 ? 'bad' : 'default'}
                    />
                </Summary>
            </div>

            {ledger.entries.length === 0 ? (
                <EmptyState
                    title={`لا توجد حركات في ${monthLabel(month)}`}
                    description="سجّل إيداعاً، أو اصرف راتباً أو فاتورة أو عهدة من هذه الخزينة."
                    action={
                        <Button onClick={() => openTransaction('deposit')}>
                            <Plus />
                            إيداع
                        </Button>
                    }
                />
            ) : (
                <>
                    <RowList className="sm:hidden">
                        {ledger.entries.map((entry) => (
                            <RowItem
                                key={entry.key}
                                title={<EntryTitle entry={entry} />}
                                meta={
                                    <>
                                        <span className="num">
                                            {formatDate(entry.date)}
                                        </span>
                                        <StatusPill
                                            kind={KINDS[entry.kind].pill}
                                        >
                                            {KINDS[entry.kind].label}
                                        </StatusPill>
                                        {entry.detail && (
                                            <span>{entry.detail}</span>
                                        )}
                                    </>
                                }
                                end={
                                    <Money
                                        value={Math.abs(entry.amount)}
                                        sign={entry.amount > 0 ? '+' : '−'}
                                        tone={entry.amount > 0 ? 'ok' : 'bad'}
                                    />
                                }
                                endMeta={
                                    <>
                                        الرصيد{' '}
                                        <Money
                                            value={entry.balance}
                                            size="inline"
                                            tone="inherit"
                                        />
                                    </>
                                }
                                action={
                                    entry.key.startsWith('t') ? (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            aria-label="حذف الحركة"
                                            onClick={() => setRemoving(entry)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    ) : undefined
                                }
                            />
                        ))}
                    </RowList>
                    <div className="panel hidden overflow-x-auto sm:block">
                        <table className="w-full min-w-[760px] text-[14px]">
                            <thead>
                                <tr className="bg-sunk text-[13px] text-muted">
                                    {[
                                        'التاريخ',
                                        'البيان',
                                        'النوع',
                                        'وارد',
                                        'صادر',
                                        'الرصيد',
                                        '',
                                    ].map((label, index) => (
                                        <th
                                            key={index}
                                            className="px-3 py-2.5 text-start font-semibold whitespace-nowrap first:ps-4 last:pe-4"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ledger.entries.map((entry) => (
                                    <tr
                                        key={entry.key}
                                        className="border-t border-line align-middle"
                                    >
                                        <td className="num px-3 py-2.5 ps-4 text-[13px] whitespace-nowrap text-muted">
                                            {formatDate(entry.date)}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <EntryTitle entry={entry} />
                                            {entry.detail && (
                                                <div className="text-[12.5px] text-muted">
                                                    {entry.detail}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <StatusPill
                                                kind={KINDS[entry.kind].pill}
                                            >
                                                {KINDS[entry.kind].label}
                                            </StatusPill>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {entry.amount > 0 ? (
                                                <Money
                                                    value={entry.amount}
                                                    tone="ok"
                                                />
                                            ) : (
                                                <span className="text-muted">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {entry.amount < 0 ? (
                                                <Money
                                                    value={-entry.amount}
                                                    tone="bad"
                                                />
                                            ) : (
                                                <span className="text-muted">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <Money
                                                value={entry.balance}
                                                tone={
                                                    entry.balance < 0
                                                        ? 'bad'
                                                        : 'default'
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 pe-4 text-end">
                                            {entry.key.startsWith('t') && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    aria-label="حذف الحركة"
                                                    onClick={() =>
                                                        setRemoving(entry)
                                                    }
                                                >
                                                    <Trash2 />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <TransactionDialog
                open={transaction.open}
                initialType={transaction.type}
                treasury={treasury}
                treasuries={allTreasuries}
                onOpenChange={(open) =>
                    setTransaction((state) => ({ ...state, open }))
                }
            />
            <TreasuryDialog
                open={settingsOpen}
                treasury={treasury}
                canDelete={treasury.can_delete}
                onOpenChange={setSettingsOpen}
            />
            <ConfirmDialog
                open={removing !== null}
                onOpenChange={(open) => !open && setRemoving(null)}
                message={
                    removing?.kind.startsWith('transfer')
                        ? 'سيُحذف التحويل من الخزينتين.'
                        : 'ستُحذف هذه الحركة من الخزينة.'
                }
                confirmLabel="حذف الحركة"
                processing={deleting}
                onConfirm={removeEntry}
            />
        </AppShell>
    );
}

function EntryTitle({ entry }: { entry: LedgerEntry }) {
    const { month } = useMonth();
    const className = 'font-semibold hover:text-accent hover:underline';

    if (entry.custody_id) {
        return (
            <Link
                href={showCustody.url(entry.custody_id, { query: { month } })}
                className={className}
            >
                {entry.description}
            </Link>
        );
    }

    if (entry.group_id) {
        return (
            <Link
                href={showGroup.url(entry.group_id, { query: { month } })}
                className={className}
            >
                {entry.description}
            </Link>
        );
    }

    return <span className="font-semibold">{entry.description}</span>;
}

function Summary({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[12px] text-muted">{label}</span>
            {children}
        </div>
    );
}
