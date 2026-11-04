import { Head, Link } from '@inertiajs/react';
import { FileDown, Plus, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { purchases as purchasesReport } from '@/actions/App/Http/Controllers/ReportController';
import { EmptyState } from '@/components/EmptyState';
import { Money } from '@/components/Money';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import AppShell, { PageHeader } from '@/layouts/AppShell';
import { monthLabel } from '@/lib/months';
import { index as purchasesIndex } from '@/routes/purchase-groups';
import type { Invoice, PurchaseGroup, PurchaseSummary } from '@/types';
import { GroupDialog } from './GroupDialog';
import { InvoiceCards } from './InvoiceCards';
import { InvoiceDialog } from './InvoiceDialog';
import { InvoiceTable } from './InvoiceTable';

type Layout = 'table' | 'cards';
const LAYOUT_KEY = 'purchases.layout';

function storedLayout(): Layout {
    try {
        return window.localStorage.getItem(LAYOUT_KEY) === 'cards'
            ? 'cards'
            : 'table';
    } catch {
        return 'table';
    }
}

export default function PurchasesShow({
    group,
    invoices,
    summary,
}: {
    group: PurchaseGroup;
    invoices: Invoice[];
    summary: PurchaseSummary;
}) {
    const { month } = useMonth();
    const [layout, setLayout] = useState<Layout>(storedLayout);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [dialog, setDialog] = useState<{
        open: boolean;
        invoice: Invoice | null;
    }>({ open: false, invoice: null });

    useEffect(() => {
        try {
            window.localStorage.setItem(LAYOUT_KEY, layout);
        } catch {
            // Storage can be unavailable (private mode); the toggle still works.
        }
    }, [layout]);

    const openInvoice = (invoice: Invoice) =>
        setDialog({ open: true, invoice });
    const openNew = () => setDialog({ open: true, invoice: null });

    return (
        <AppShell>
            <Head title={group.name} />
            <PageHeader
                breadcrumb={
                    <Link
                        href={purchasesIndex.url({ query: { month } })}
                        className="mb-1 inline-block text-[13px] text-muted hover:text-accent"
                    >
                        → المشتريات
                    </Link>
                }
                title={group.name}
                description={`فواتير ${monthLabel(month)}`}
                actions={
                    <>
                        <SegmentedControl
                            ariaLabel="طريقة العرض"
                            value={layout}
                            onChange={setLayout}
                            options={[
                                { value: 'table', label: 'جدول' },
                                { value: 'cards', label: 'بطاقات' },
                            ]}
                        />
                        {invoices.length > 0 ? (
                            <Button variant="outline" asChild>
                                <a
                                    href={purchasesReport.url([
                                        group.id,
                                        month,
                                    ])}
                                >
                                    <FileDown />
                                    تصدير PDF
                                </a>
                            </Button>
                        ) : (
                            <Button variant="outline" disabled>
                                <FileDown />
                                تصدير PDF
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings />
                            إعدادات
                        </Button>
                        <Button onClick={openNew}>
                            <Plus />
                            فاتورة
                        </Button>
                    </>
                }
            />

            <div className="panel mb-4 grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-4">
                <SummaryItem label="الإجمالي">
                    <Money value={summary.total} size="summary" />
                </SummaryItem>
                <SummaryItem label="عدد الفواتير">
                    <BigNumber value={summary.count} />
                </SummaryItem>
                <SummaryItem label="متكررة">
                    <BigNumber value={summary.recurring} />
                </SummaryItem>
                <SummaryItem label="بلا إيصال">
                    <BigNumber
                        value={summary.missing_receipts}
                        className={
                            summary.missing_receipts > 0 ? 'text-warn' : ''
                        }
                    />
                </SummaryItem>
            </div>

            {invoices.length === 0 ? (
                <EmptyState
                    title={`لا توجد فواتير في ${monthLabel(month)}`}
                    description="أضف فاتورة بصورة الإيصال من جهازك أو التقطها بالهاتف عبر رمز QR."
                    action={
                        <Button onClick={openNew}>
                            <Plus />
                            فاتورة جديدة
                        </Button>
                    }
                />
            ) : layout === 'table' ? (
                <InvoiceTable
                    invoices={invoices}
                    total={summary.total}
                    onOpen={openInvoice}
                />
            ) : (
                <InvoiceCards invoices={invoices} onOpen={openInvoice} />
            )}

            <InvoiceDialog
                open={dialog.open}
                invoice={dialog.invoice}
                group={group}
                onOpenChange={(open) =>
                    setDialog((state) => ({ ...state, open }))
                }
            />
            <GroupDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                group={group}
            />
        </AppShell>
    );
}

function SummaryItem({
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

function BigNumber({
    value,
    className,
}: {
    value: number;
    className?: string;
}) {
    return (
        <span
            className={`num text-[27px] leading-tight font-bold sm:text-[32px] ${className ?? ''}`}
        >
            {value}
        </span>
    );
}
