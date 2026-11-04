import { Head, Link, router, usePage } from '@inertiajs/react';
import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    markAll,
    update,
} from '@/actions/App/Http/Controllers/AttendanceController';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import AppShell, { PageHeader } from '@/layouts/AppShell';
import { http } from '@/lib/http';
import { dateOf } from '@/lib/months';
import { index as salariesIndex } from '@/routes/salaries';
import type {
    AttendanceCounters,
    AttendanceEmployee,
    AttendanceRecord,
    AttendanceStatus,
    Employee,
} from '@/types';
import { DailyTable } from './DailyTable';
import { MonthCalendar } from './MonthCalendar';
import { SettingsDialog } from './SettingsDialog';
import { nextRecord, recordKey, toRecordMap } from './shared';
import type { RecordMap } from './shared';

type Props = {
    view: 'day' | 'month';
    day: number;
    selectedEmployee: number | null;
    employees: AttendanceEmployee[];
    allEmployees: Employee[];
    noneCount: number;
    records: AttendanceRecord[];
    counters: Record<number, AttendanceCounters>;
};

export type SaveDay = (
    employee: AttendanceEmployee,
    date: string,
    status: AttendanceStatus | null,
    changes?: Partial<
        Pick<AttendanceRecord, 'check_in' | 'check_out' | 'note'>
    >,
) => Promise<boolean>;

export default function AttendanceIndex(props: Props) {
    const {
        view,
        day,
        selectedEmployee,
        employees,
        allEmployees,
        noneCount,
        counters,
    } = props;
    const { month } = useMonth();
    const settings = usePage().props.settings;
    const [records, setRecords] = useState<RecordMap>(() =>
        toRecordMap(props.records),
    );
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        setRecords(toRecordMap(props.records));
    }, [props.records]);

    function navigate(params: Record<string, string | number | null>) {
        const url = new URL(window.location.href);

        for (const [key, value] of Object.entries(params)) {
            if (value === null) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, String(value));
            }
        }

        router.get(
            url.pathname,
            Object.fromEntries(url.searchParams.entries()),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    /** Optimistic save, then reload records and counters from the server. */
    const saveDay: SaveDay = async (employee, date, status, changes = {}) => {
        const key = recordKey(employee.id, date);
        const previous = records[key];
        const optimistic =
            status === null
                ? null
                : nextRecord(employee, date, status, previous, changes);

        setRecords((current) => {
            const next = { ...current };

            if (optimistic) {
                next[key] = optimistic;
            } else {
                delete next[key];
            }

            return next;
        });

        try {
            await http.put(update.url([employee.id, date]), {
                status,
                check_in: optimistic?.check_in ?? null,
                check_out: optimistic?.check_out ?? null,
                note: optimistic?.note ?? null,
            });
            router.reload({ only: ['records', 'counters'] });

            return true;
        } catch (error) {
            setRecords((current) => {
                const next = { ...current };

                if (previous) {
                    next[key] = previous;
                } else {
                    delete next[key];
                }

                return next;
            });
            toast(`لم يتم الحفظ: ${(error as Error).message}`);

            return false;
        }
    };

    async function markEveryone() {
        setMarking(true);

        try {
            const { count } = await http.post<{ count: number }>(
                markAll.url(),
                { date: dateOf(month, day) },
            );
            toast(
                count > 0
                    ? `تم تحضير ${count} موظف`
                    : 'جميع الموظفين لديهم حالة لهذا اليوم',
            );
            router.reload({ only: ['records', 'counters'] });
        } catch (error) {
            toast(`لم يتم الحفظ: ${(error as Error).message}`);
        } finally {
            setMarking(false);
        }
    }

    const workHours = settings
        ? `${settings.work_start} – ${settings.work_end}`
        : '';

    return (
        <AppShell>
            <Head title="الحضور والانصراف" />
            <PageHeader
                title="الحضور والانصراف"
                description={`الدوام الافتراضي ${workHours} · الغياب بدون عذر يُخصم من الراتب، والعذر والإجازة بدون خصم.`}
                actions={
                    <>
                        <SegmentedControl
                            ariaLabel="طريقة العرض"
                            value={view}
                            onChange={(next) => navigate({ view: next })}
                            options={[
                                { value: 'day', label: 'يومي' },
                                { value: 'month', label: 'شهري' },
                            ]}
                        />
                        <Button
                            variant="outline"
                            onClick={() => setSettingsOpen(true)}
                            disabled={allEmployees.length === 0}
                        >
                            <Settings />
                            الإعدادات
                        </Button>
                        {view === 'day' && employees.length > 0 && (
                            <Button onClick={markEveryone} disabled={marking}>
                                {marking ? 'جارٍ التحضير…' : 'تحضير الجميع'}
                            </Button>
                        )}
                    </>
                }
            />

            {allEmployees.length === 0 ? (
                <EmptyState
                    title="أضف الموظفين من صفحة الرواتب أولاً"
                    action={
                        <Button asChild>
                            <Link
                                href={salariesIndex.url({ query: { month } })}
                            >
                                فتح صفحة الرواتب
                            </Link>
                        </Button>
                    }
                />
            ) : employees.length === 0 ? (
                <EmptyState
                    title="لا يوجد موظفون يُسجَّل لهم حضور"
                    action={
                        <Button onClick={() => setSettingsOpen(true)}>
                            فتح الإعدادات
                        </Button>
                    }
                />
            ) : view === 'day' ? (
                <DailyTable
                    month={month}
                    day={day}
                    employees={employees}
                    records={records}
                    onSave={saveDay}
                    onDayChange={(params) => navigate(params)}
                />
            ) : (
                <MonthCalendar
                    month={month}
                    employees={employees}
                    selectedEmployee={selectedEmployee}
                    records={records}
                    counters={counters}
                    onEmployeeChange={(id) => navigate({ employee: id })}
                    onSave={saveDay}
                />
            )}

            {noneCount > 0 && allEmployees.length > 0 && (
                <p className="mt-4 text-[13px] text-muted">
                    {noneCount} موظف بدون حضور وغياب (لا يظهرون هنا).
                </p>
            )}

            <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                employees={allEmployees}
            />
        </AppShell>
    );
}
