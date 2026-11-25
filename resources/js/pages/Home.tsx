import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Money } from '@/components/Money';
import { StatTile } from '@/components/StatTile';
import { StatusPill } from '@/components/StatusPill';
import { useMonth } from '@/hooks/use-month';
import AppShell from '@/layouts/AppShell';
import { monthLabel, monthName } from '@/lib/months';
import { index as attendanceIndex } from '@/routes/attendance';
import { index as custodiesIndex } from '@/routes/custodies';
import { index as expensesIndex } from '@/routes/expenses';
import { index as purchasesIndex } from '@/routes/purchase-groups';
import { index as salariesIndex } from '@/routes/salaries';
import { index as treasuriesIndex } from '@/routes/treasuries';
import type { PurchaseSummary, Treasury } from '@/types';

type Props = {
    salaries: {
        employees: number;
        total: number;
        paid: number;
        remaining: number;
        unpaid: number;
        partial: number;
    };
    purchases: PurchaseSummary & { groups: number };
    expenses: PurchaseSummary & { groups: number };
    treasuries: { items: Treasury[]; total: number };
    custodies: { open: number; cash: number; pending: number };
    attendance: {
        absent_days: number;
        excused_days: number;
        deduction: number;
    };
};

export default function Home({
    salaries,
    purchases,
    expenses,
    treasuries,
    custodies,
    attendance,
}: Props) {
    const { month } = useMonth();

    return (
        <AppShell>
            <Head title={monthLabel(month)} />
            <div className="mb-6">
                <h1 className="font-display text-[28px] leading-tight font-semibold">
                    {monthLabel(month)}
                </h1>
                <p className="mt-1.5 text-[14px] text-muted">
                    ملخص الرواتب والمشتريات والمصروفات والخزائن لهذا الشهر
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))]">
                <ModuleCard
                    title="الرواتب"
                    href={salariesIndex.url({ query: { month } })}
                    pill={
                        <StatusPill kind="accent">
                            {salaries.employees} موظف
                        </StatusPill>
                    }
                    footer={`${salaries.unpaid} غير مدفوع · ${salaries.partial} جزئي · المتبقي يُرحّل للشهر القادم`}
                >
                    <StatTile label="المستحق">
                        <Money value={salaries.total} size="tile" />
                    </StatTile>
                    <StatTile label="المدفوع">
                        <Money value={salaries.paid} size="tile" />
                    </StatTile>
                    <StatTile label="المتبقي">
                        <Money
                            value={salaries.remaining}
                            size="tile"
                            tone={salaries.remaining > 0 ? 'warn' : 'default'}
                        />
                    </StatTile>
                </ModuleCard>

                <ModuleCard
                    title="المشتريات"
                    href={purchasesIndex.url({ query: { month } })}
                    pill={
                        <StatusPill kind="accent">
                            {purchases.groups} مجموعة
                        </StatusPill>
                    }
                    footer={`${purchases.recurring} متكررة · ${purchases.once} لمرة واحدة`}
                >
                    <StatTile label="الإجمالي">
                        <Money value={purchases.total} size="tile" />
                    </StatTile>
                    <StatTile label="الفواتير">
                        <Count value={purchases.count} />
                    </StatTile>
                    <StatTile label="بلا إيصال">
                        <Count
                            value={purchases.missing_receipts}
                            className={
                                purchases.missing_receipts > 0
                                    ? 'text-warn'
                                    : ''
                            }
                        />
                    </StatTile>
                </ModuleCard>

                <ModuleCard
                    title="المصروفات"
                    href={expensesIndex.url({ query: { month } })}
                    pill={
                        <StatusPill kind="accent">
                            {expenses.groups} مجموعة
                        </StatusPill>
                    }
                    footer={`${expenses.recurring} متكررة · ${expenses.once} لمرة واحدة`}
                >
                    <StatTile label="الإجمالي">
                        <Money value={expenses.total} size="tile" />
                    </StatTile>
                    <StatTile label="الفواتير">
                        <Count value={expenses.count} />
                    </StatTile>
                    <StatTile label="بلا إيصال">
                        <Count
                            value={expenses.missing_receipts}
                            className={
                                expenses.missing_receipts > 0 ? 'text-warn' : ''
                            }
                        />
                    </StatTile>
                </ModuleCard>

                <ModuleCard
                    title="الخزائن"
                    href={treasuriesIndex.url({ query: { month } })}
                    pill={
                        <StatusPill kind="accent">
                            {treasuries.items.length} خزينة
                        </StatusPill>
                    }
                    footer="الرصيد الحالي لكل خزينة"
                >
                    <StatTile label="إجمالي الأرصدة">
                        <Money
                            value={treasuries.total}
                            size="tile"
                            tone={treasuries.total < 0 ? 'bad' : 'default'}
                        />
                    </StatTile>
                    {treasuries.items.slice(0, 2).map((treasury) => (
                        <StatTile
                            key={treasury.id}
                            label={`${treasury.name} · ${treasury.region_label}`}
                        >
                            <Money
                                value={treasury.balance}
                                size="tile"
                                tone={treasury.balance < 0 ? 'bad' : 'default'}
                            />
                        </StatTile>
                    ))}
                </ModuleCard>

                <ModuleCard
                    title="العُهد"
                    href={custodiesIndex.url({ query: { month } })}
                    pill={
                        <StatusPill kind="accent">
                            {custodies.open} مفتوحة
                        </StatusPill>
                    }
                    footer="جدّد العهدة بعد إدخال الفواتير لتعويض المستلم من الخزينة"
                >
                    <StatTile label="عُهد مفتوحة">
                        <Count value={custodies.open} />
                    </StatTile>
                    <StatTile label="النقد مع المستلمين">
                        <Money value={custodies.cash} size="tile" />
                    </StatTile>
                    <StatTile label="بانتظار التجديد">
                        <Money
                            value={custodies.pending}
                            size="tile"
                            tone={custodies.pending > 0 ? 'warn' : 'default'}
                        />
                    </StatTile>
                </ModuleCard>

                <ModuleCard
                    title="الحضور والانصراف"
                    href={attendanceIndex.url({ query: { month } })}
                    pill={
                        <StatusPill kind="accent">
                            {monthName(month)}
                        </StatusPill>
                    }
                    footer="الغياب بدون عذر يُخصم تلقائياً من الراتب · العذر والإجازة بدون خصم"
                >
                    <StatTile label="أيام غياب">
                        <Count
                            value={attendance.absent_days}
                            className="text-bad"
                        />
                    </StatTile>
                    <StatTile label="عذر / إجازة">
                        <Count value={attendance.excused_days} />
                    </StatTile>
                    <StatTile label="خصم الغياب">
                        <Money
                            value={attendance.deduction}
                            size="tile"
                            tone={attendance.deduction > 0 ? 'bad' : 'default'}
                        />
                    </StatTile>
                </ModuleCard>
            </div>
        </AppShell>
    );
}

function ModuleCard({
    title,
    href,
    pill,
    footer,
    children,
}: {
    title: string;
    href: string;
    pill: ReactNode;
    footer: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="panel flex flex-col gap-4 p-5 transition-colors hover:border-accent"
        >
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-[22px] font-semibold">{title}</h2>
                {pill}
            </div>
            <div className="grid grid-cols-3 gap-2">{children}</div>
            <p className="text-[13px] text-muted">{footer}</p>
        </Link>
    );
}

function Count({ value, className }: { value: number; className?: string }) {
    return (
        <span
            className={`num text-[21px] font-bold min-[430px]:text-[24px] sm:text-[30px] ${className ?? ''}`}
        >
            {value}
        </span>
    );
}
