import { useEffect, useState } from 'react';
import { history as historyRoute } from '@/actions/App/Http/Controllers/EmployeeController';
import { AppDialog } from '@/components/AppDialog';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { http } from '@/lib/http';
import { monthLabel } from '@/lib/months';
import type { Employee, PayrollRow } from '@/types';

/**
 * Every month from the start month to the selected month, newest first (max 36).
 */
export function HistoryDialog({
    employee,
    until,
    onOpenChange,
}: {
    employee: Employee;
    until: string;
    onOpenChange: (open: boolean) => void;
}) {
    const [rows, setRows] = useState<PayrollRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        http.get<{ rows: PayrollRow[] }>(
            historyRoute.url(employee.id, { query: { until } }),
        )
            .then((data) => setRows(data.rows))
            .catch((exception: Error) => setError(exception.message));
    }, [employee.id, until]);

    return (
        <AppDialog
            open
            onOpenChange={onOpenChange}
            wide
            title={`سجل ${employee.name}`}
        >
            {error && <p className="text-bad">{error}</p>}
            {!rows && !error && (
                <div className="flex flex-col gap-2">
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className="h-10 animate-pulse rounded-md bg-sunk"
                        />
                    ))}
                </div>
            )}
            {rows && rows.length === 0 && (
                <p className="py-6 text-center text-muted">
                    لم يبدأ احتساب راتب هذا الموظف بعد.
                </p>
            )}
            {rows && rows.length > 0 && (
                <div className="-mx-5 overflow-x-auto">
                    <table className="w-full min-w-[680px] text-[14px]">
                        <thead>
                            <tr className="bg-sunk text-[13px] text-muted">
                                {[
                                    'الشهر',
                                    'مكافأة',
                                    'خصم',
                                    'مرحّل',
                                    'المستحق',
                                    'المدفوع',
                                    'الحالة',
                                ].map((label) => (
                                    <th
                                        key={label}
                                        className="px-3 py-2 text-start font-semibold first:ps-5"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.month}
                                    className="border-t border-line"
                                >
                                    <td className="px-3 py-2.5 ps-5">
                                        <div className="font-semibold">
                                            {monthLabel(row.month)}
                                        </div>
                                        {row.note && (
                                            <div className="text-[12.5px] text-muted">
                                                {row.note}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        {row.bonus > 0 ? (
                                            <Money
                                                value={row.bonus}
                                                size="base"
                                                tone="ok"
                                                sign="+"
                                            />
                                        ) : (
                                            <span className="text-muted">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        {row.deduction > 0 ? (
                                            <Money
                                                value={row.deduction}
                                                size="base"
                                                tone="bad"
                                                sign="−"
                                            />
                                        ) : (
                                            <span className="text-muted">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        {row.carry !== 0 ? (
                                            <Money
                                                value={row.carry}
                                                size="base"
                                                tone="warn"
                                            />
                                        ) : (
                                            <span className="text-muted">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <Money value={row.total} size="base" />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <Money value={row.paid} size="base" />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <StatusPill kind={row.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AppDialog>
    );
}
