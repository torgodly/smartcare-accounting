import { Head, router } from '@inertiajs/react';
import { FileDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { payFull } from '@/actions/App/Http/Controllers/PayrollController';
import { salaries as salariesReport } from '@/actions/App/Http/Controllers/ReportController';
import { EmptyState } from '@/components/EmptyState';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import AppShell, { PageHeader } from '@/layouts/AppShell';
import { monthLabel } from '@/lib/months';
import type { Employee, PayrollRow, PayrollTotals } from '@/types';
import { EmployeeDialog } from './EmployeeDialog';
import { HistoryDialog } from './HistoryDialog';
import { PaymentDialog } from './PaymentDialog';

type Row = { employee: Employee; payroll: PayrollRow };

export default function SalariesIndex({
    rows,
    totals,
}: {
    rows: Row[];
    totals: PayrollTotals;
}) {
    const { month } = useMonth();
    const [employeeDialog, setEmployeeDialog] = useState<{
        open: boolean;
        employee: Employee | null;
    }>({ open: false, employee: null });
    const [payment, setPayment] = useState<Row | null>(null);
    const [history, setHistory] = useState<Employee | null>(null);
    const [paying, setPaying] = useState<number | null>(null);

    function payInFull(row: Row) {
        setPaying(row.employee.id);
        router.post(
            payFull.url([row.employee.id, month]),
            {},
            {
                preserveScroll: true,
                onError: (errors) =>
                    toast(`لم يتم الحفظ: ${Object.values(errors)[0] ?? ''}`),
                onFinish: () => setPaying(null),
            },
        );
    }

    const openNew = () => setEmployeeDialog({ open: true, employee: null });

    return (
        <AppShell>
            <Head title="الرواتب" />
            <PageHeader
                title="الرواتب"
                description="المستحق = الأساسي + المكافأة − الخصم + المرحّل من الأشهر السابقة. أي مبلغ غير مدفوع يُرحّل تلقائياً."
                actions={
                    <>
                        {rows.length > 0 ? (
                            <Button variant="outline" asChild>
                                <a href={salariesReport.url(month)}>
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
                        <Button onClick={openNew}>
                            <Plus />
                            موظف
                        </Button>
                    </>
                }
            />

            {rows.length === 0 ? (
                <EmptyState
                    title="لا يوجد موظفون بعد"
                    description="أضف أول موظف وراتبه الأساسي، ثم سجّل المكافآت والخصومات كل شهر."
                    action={
                        <Button onClick={openNew}>
                            <Plus />
                            إضافة موظف
                        </Button>
                    }
                />
            ) : (
                <div className="panel overflow-x-auto">
                    <table className="w-full min-w-[1120px] text-[14px]">
                        <thead>
                            <tr className="bg-sunk text-[13px] text-muted">
                                {[
                                    'الموظف',
                                    'الأساسي',
                                    'مكافأة',
                                    'خصم',
                                    'مرحّل',
                                    'المستحق',
                                    'المدفوع',
                                    'المتبقي',
                                    'الحالة',
                                    '',
                                ].map((label, index) => (
                                    <th
                                        key={index}
                                        className="px-3 py-2.5 text-start font-semibold whitespace-nowrap first:ps-4"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const p = row.payroll;
                                const started = p.started;

                                return (
                                    <tr
                                        key={row.employee.id}
                                        className="border-t border-line align-middle hover:bg-[#fafbfc]"
                                    >
                                        <td className="px-3 py-3 ps-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setHistory(row.employee)
                                                }
                                                className="text-start font-semibold hover:text-accent hover:underline"
                                            >
                                                {row.employee.name}
                                            </button>
                                            {row.employee.job_title && (
                                                <div className="text-[13px] text-muted">
                                                    {row.employee.job_title}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Money value={p.base} />
                                        </td>
                                        <td className="px-3 py-3">
                                            {started && p.bonus > 0 ? (
                                                <Money
                                                    value={p.bonus}
                                                    sign="+"
                                                    tone="ok"
                                                />
                                            ) : (
                                                <Dash />
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            {started && p.deduction > 0 ? (
                                                <div>
                                                    <Money
                                                        value={p.deduction}
                                                        sign="−"
                                                        tone="bad"
                                                    />
                                                    {p.absent_days > 0 && (
                                                        <div className="text-[12px] text-muted">
                                                            {p.absent_days} يوم
                                                            غياب
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <Dash />
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            {started && p.carry !== 0 ? (
                                                <Money
                                                    value={p.carry}
                                                    tone="warn"
                                                />
                                            ) : (
                                                <Dash />
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            {started ? (
                                                <Money value={p.total} />
                                            ) : (
                                                <Dash />
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            {started ? (
                                                <Money value={p.paid} />
                                            ) : (
                                                <Dash />
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            {started ? (
                                                <Money value={p.remaining} />
                                            ) : (
                                                <Dash />
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusPill kind={p.status} />
                                        </td>
                                        <td className="px-3 py-3 pe-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {started && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setPayment(row)
                                                        }
                                                    >
                                                        تسجيل
                                                    </Button>
                                                )}
                                                {started &&
                                                    (p.status === 'unpaid' ||
                                                        p.status ===
                                                            'partial') && (
                                                        <Button
                                                            size="sm"
                                                            disabled={
                                                                paying ===
                                                                row.employee.id
                                                            }
                                                            onClick={() =>
                                                                payInFull(row)
                                                            }
                                                        >
                                                            دفع كامل
                                                        </Button>
                                                    )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setEmployeeDialog({
                                                            open: true,
                                                            employee:
                                                                row.employee,
                                                        })
                                                    }
                                                >
                                                    تعديل
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-line bg-sunk/60">
                                <td className="px-3 py-3 ps-4 font-display text-[15px] font-semibold">
                                    الإجمالي
                                </td>
                                <td className="px-3 py-3">
                                    <Money value={totals.base} size="footer" />
                                </td>
                                <td className="px-3 py-3">
                                    <Money
                                        value={totals.bonus}
                                        size="footer"
                                        tone={
                                            totals.bonus > 0 ? 'ok' : 'default'
                                        }
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <Money
                                        value={totals.deduction}
                                        size="footer"
                                        tone={
                                            totals.deduction > 0
                                                ? 'bad'
                                                : 'default'
                                        }
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <Money
                                        value={totals.carry}
                                        size="footer"
                                        tone={
                                            totals.carry !== 0
                                                ? 'warn'
                                                : 'default'
                                        }
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <Money value={totals.total} size="footer" />
                                </td>
                                <td className="px-3 py-3">
                                    <Money value={totals.paid} size="footer" />
                                </td>
                                <td className="px-3 py-3">
                                    <Money
                                        value={totals.remaining}
                                        size="footer"
                                    />
                                </td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <EmployeeDialog
                open={employeeDialog.open}
                employee={employeeDialog.employee}
                defaultStartMonth={month}
                onOpenChange={(open) =>
                    setEmployeeDialog((state) => ({ ...state, open }))
                }
            />
            {payment && (
                <PaymentDialog
                    key={`${payment.employee.id}-${month}`}
                    open
                    employee={payment.employee}
                    payroll={payment.payroll}
                    title={`${payment.employee.name} · ${monthLabel(month)}`}
                    onOpenChange={(open) => !open && setPayment(null)}
                />
            )}
            {history && (
                <HistoryDialog
                    key={history.id}
                    employee={history}
                    until={month}
                    onOpenChange={(open) => !open && setHistory(null)}
                />
            )}
        </AppShell>
    );
}

function Dash() {
    return <span className="text-muted">—</span>;
}
