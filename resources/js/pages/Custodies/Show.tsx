import { Head, Link } from '@inertiajs/react';
import { Lock, Plus, RefreshCw, Settings, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { RowItem, RowList } from '@/components/RowList';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import AppShell, { PageHeader } from '@/layouts/AppShell';
import { formatDate, monthLabel } from '@/lib/months';
import { index as custodiesIndex } from '@/routes/custodies';
import type { Custody, Invoice, PurchaseGroup, TreasuryRef } from '@/types';
import { InvoiceDialog } from '../Purchases/InvoiceDialog';
import { CustodyDialog } from './CustodyDialog';
import { CustodyStatus } from './Index';
import { MovementDialog } from './MovementDialog';
import type { MovementMode } from './MovementDialog';

type CustodyInvoice = Invoice & {
    group: Pick<PurchaseGroup, 'id' | 'name' | 'code' | 'kind'>;
    settled_on: string | null;
};

type Movement = {
    id: number;
    type: 'issue' | 'replenish' | 'return';
    type_label: string;
    amount: number;
    date: string;
    note: string | null;
    treasury: string;
};

export default function CustodiesShow({
    custody,
    invoices,
    movements,
    groups,
    treasuries,
}: {
    custody: Custody;
    invoices: CustodyInvoice[];
    movements: Movement[];
    groups: PurchaseGroup[];
    treasuries: TreasuryRef[];
}) {
    const { month } = useMonth();
    const isOpen = custody.status === 'open';
    const [movement, setMovement] = useState<{
        open: boolean;
        mode: MovementMode;
    }>({ open: false, mode: 'replenish' });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [invoiceDialog, setInvoiceDialog] = useState<{
        open: boolean;
        invoice: CustodyInvoice | null;
    }>({ open: false, invoice: null });

    const openMovement = (mode: MovementMode) =>
        setMovement({ open: true, mode });
    const invoiceGroup = invoiceDialog.invoice
        ? (groups.find(
              (group) => group.id === invoiceDialog.invoice?.group.id,
          ) ?? null)
        : null;
    const custodyOption = {
        id: custody.id,
        label: custody.label,
        region: custody.region,
    };

    const openNewInvoice = () =>
        setInvoiceDialog({ open: true, invoice: null });

    return (
        <AppShell>
            <Head title={`عهدة ${custody.holder_name}`} />
            <PageHeader
                breadcrumb={
                    <Link
                        href={custodiesIndex.url({ query: { month } })}
                        className="mb-1 inline-block text-[13px] text-muted hover:text-accent"
                    >
                        → العُهد
                    </Link>
                }
                title={
                    <span className="flex flex-wrap items-center gap-2">
                        {custody.holder_name}
                        <CustodyStatus custody={custody} />
                    </span>
                }
                description={[
                    custody.title,
                    custody.region_label,
                    `تُصرف من ${custody.treasury.name}`,
                    custody.closed_on
                        ? `أُغلقت ${formatDate(custody.closed_on)}`
                        : null,
                ]
                    .filter(Boolean)
                    .join(' · ')}
                actions={
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="إعدادات العهدة"
                            title="إعدادات العهدة"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings />
                        </Button>
                        {isOpen && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => openMovement('close')}
                                >
                                    <Lock />
                                    إغلاق
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => openMovement('top-up')}
                                >
                                    <TrendingUp />
                                    زيادة
                                </Button>
                                <Button onClick={openNewInvoice}>
                                    <Plus />
                                    فاتورة على العهدة
                                </Button>
                            </>
                        )}
                    </>
                }
            />

            {isOpen && custody.pending > 0 && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warn-500/40 bg-warn-50 px-4 py-3">
                    <div className="min-w-0 text-[14px] text-warn-700">
                        <b>
                            صرف المستلم{' '}
                            <Money
                                value={custody.pending}
                                size="inline"
                                tone="inherit"
                            />{' '}
                            في {custody.pending_count} فاتورة.
                        </b>{' '}
                        جدّد العهدة ليُعوَّض من {custody.treasury.name} وتعود إلى{' '}
                        <Money
                            value={custody.cash + custody.pending}
                            size="inline"
                            tone="inherit"
                        />
                        .
                    </div>
                    <Button onClick={() => openMovement('replenish')}>
                        <RefreshCw />
                        تجديد العهدة
                    </Button>
                </div>
            )}

            <div className="panel mb-6 grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-4">
                <Summary label="قيمة العهدة">
                    <Money value={custody.issued} size="summary" />
                </Summary>
                <Summary label="النقد مع المستلم">
                    <Money
                        value={isOpen ? custody.cash : 0}
                        size="summary"
                        tone={custody.cash < 0 ? 'bad' : 'default'}
                    />
                </Summary>
                <Summary label="بانتظار التجديد">
                    <Money
                        value={custody.pending}
                        size="summary"
                        tone={custody.pending > 0 ? 'warn' : 'default'}
                    />
                </Summary>
                <Summary label="إجمالي المصروف">
                    <Money value={custody.spent} size="summary" />
                </Summary>
            </div>

            <SectionTitle count={invoices.length}>الفواتير</SectionTitle>
            {invoices.length === 0 ? (
                <EmptyState
                    title="لا توجد فواتير على هذه العهدة"
                    description="أدخل فواتير ما صرفه المستلم، ثم جدّد العهدة لتعويضه."
                    action={
                        isOpen ? (
                            <Button onClick={openNewInvoice}>
                                <Plus />
                                فاتورة على العهدة
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <RowList className="mb-6">
                    {invoices.map((invoice) => (
                        <RowItem
                            key={invoice.id}
                            onOpen={() =>
                                setInvoiceDialog({ open: true, invoice })
                            }
                            title={invoice.title}
                            meta={
                                <>
                                    <span className="serial">
                                        {invoice.serial}
                                    </span>
                                    <span>{invoice.group.name}</span>
                                    <span>{monthLabel(invoice.month)}</span>
                                </>
                            }
                            end={<Money value={invoice.price} />}
                            endMeta={
                                invoice.settled ? (
                                    <StatusPill kind="ok">
                                        تم التعويض
                                        {invoice.settled_on
                                            ? ` ${formatDate(invoice.settled_on)}`
                                            : ''}
                                    </StatusPill>
                                ) : (
                                    <StatusPill kind="warn">
                                        بانتظار التجديد
                                    </StatusPill>
                                )
                            }
                        />
                    ))}
                </RowList>
            )}

            <SectionTitle count={movements.length}>حركات العهدة</SectionTitle>
            <RowList>
                {movements.map((item) => (
                    <RowItem
                        key={item.id}
                        title={item.type_label}
                        meta={
                            <>
                                <span className="num">
                                    {formatDate(item.date)}
                                </span>
                                <span>{item.treasury}</span>
                                {item.note && <span>{item.note}</span>}
                            </>
                        }
                        end={
                            <Money
                                value={item.amount}
                                sign={item.type === 'return' ? '+' : '−'}
                                tone={item.type === 'return' ? 'ok' : 'default'}
                            />
                        }
                        endMeta={
                            item.type === 'return'
                                ? 'رجع للخزينة'
                                : 'خرج من الخزينة'
                        }
                    />
                ))}
            </RowList>

            <MovementDialog
                open={movement.open}
                mode={movement.mode}
                custody={custody}
                treasuries={treasuries}
                onOpenChange={(open) =>
                    setMovement((state) => ({ ...state, open }))
                }
            />
            <CustodyDialog
                open={settingsOpen}
                custody={custody}
                treasuries={treasuries}
                onOpenChange={setSettingsOpen}
            />
            <InvoiceDialog
                open={invoiceDialog.open}
                invoice={invoiceDialog.invoice}
                group={invoiceGroup}
                groups={groups}
                treasuries={[]}
                custodies={[custodyOption]}
                fixedCustodyId={custody.id}
                onOpenChange={(open) =>
                    setInvoiceDialog((state) => ({ ...state, open }))
                }
            />
        </AppShell>
    );
}

function SectionTitle({
    children,
    count,
}: {
    children: ReactNode;
    count: number;
}) {
    return (
        <h2 className="mb-2 flex items-center gap-2 text-[16px] font-semibold">
            {children}
            {count > 0 && (
                <span className="num rounded-full bg-sunk px-2 text-[12px] text-muted">
                    {count}
                </span>
            )}
        </h2>
    );
}

function Summary({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[12px] text-muted">{label}</span>
            {children}
        </div>
    );
}
