import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Money } from '@/components/Money';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/money';
import {
    dateOf,
    daysIn,
    isFriday,
    monthLabel,
    WEEK_DAYS,
    weekdayFromSaturday,
} from '@/lib/months';
import { cn } from '@/lib/utils';
import type { AttendanceCounters, AttendanceEmployee } from '@/types';
import { DayDialog } from './DayDialog';
import type { SaveDay } from './Index';
import { MODE_LABELS, STATUS_FILL, STATUS_LABELS, recordKey } from './shared';
import type { RecordMap } from './shared';

export function MonthCalendar({
    month,
    employees,
    selectedEmployee,
    records,
    counters,
    onEmployeeChange,
    onSave,
}: {
    month: string;
    employees: AttendanceEmployee[];
    selectedEmployee: number | null;
    records: RecordMap;
    counters: Record<number, AttendanceCounters>;
    onEmployeeChange: (id: number) => void;
    onSave: SaveDay;
}) {
    const today = usePage().props.today;
    const [openDate, setOpenDate] = useState<string | null>(null);
    const employee =
        employees.find((item) => item.id === selectedEmployee) ?? employees[0];
    const counter = counters[employee.id] ?? {
        present: 0,
        absent: 0,
        excuse: 0,
        leave: 0,
        deduction: 0,
    };

    const total = daysIn(month);
    const leading = weekdayFromSaturday(dateOf(month, 1));
    const cells: (number | null)[] = [
        ...Array.from({ length: leading }, () => null),
        ...Array.from({ length: total }, (_, index) => index + 1),
    ];
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="panel flex flex-wrap items-end gap-x-6 gap-y-4 px-4 py-4">
                <div className="flex w-full flex-col gap-1.5 sm:w-[240px]">
                    <span className="text-[13px] font-semibold">الموظف</span>
                    <Select
                        value={String(employee.id)}
                        onValueChange={(value) =>
                            onEmployeeChange(Number(value))
                        }
                    >
                        <SelectTrigger
                            className="h-10 w-full bg-surface"
                            dir="rtl"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            {employees.map((item) => (
                                <SelectItem
                                    key={item.id}
                                    value={String(item.id)}
                                >
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                    <Counter
                        label="حضور"
                        value={counter.present}
                        className="text-ok"
                    />
                    <Counter
                        label="غياب"
                        value={counter.absent}
                        className="text-bad"
                    />
                    <Counter
                        label="عذر"
                        value={counter.excuse}
                        className="text-warn"
                    />
                    <Counter
                        label="إجازة"
                        value={counter.leave}
                        className="text-info"
                    />
                    <div className="flex flex-col">
                        <span className="text-[12px] text-muted">
                            خصم الغياب
                        </span>
                        <Money
                            value={counter.deduction}
                            size="counter"
                            tone={counter.deduction > 0 ? 'bad' : 'default'}
                        />
                    </div>
                </div>
            </div>

            <div className="panel overflow-hidden">
                <div className="px-4 py-3">
                    <h2 className="text-[20px] font-semibold">
                        {monthLabel(month)}
                    </h2>
                    <p className="text-[13px] text-muted">
                        {MODE_LABELS[employee.attendance_mode]}
                        {employee.attendance_mode === 'time' && (
                            <>
                                {' · '}
                                <span className="num">
                                    {employee.shift.start} –{' '}
                                    {employee.shift.end}
                                </span>
                            </>
                        )}
                        {' · خصم اليوم '}
                        <span className="num">
                            {formatNumber(employee.day_rate)}
                        </span>{' '}
                        د.ل
                    </p>
                </div>
                <div className="grid grid-cols-7 border-t border-line">
                    {WEEK_DAYS.map((name) => (
                        <div
                            key={name}
                            className="border-b border-line bg-sunk px-1 py-2 text-center text-[12px] font-semibold text-muted sm:text-[13px]"
                        >
                            <span className="hidden sm:inline">{name}</span>
                            <span className="sm:hidden">
                                {name.replace('ال', '').slice(0, 3)}
                            </span>
                        </div>
                    ))}
                    {cells.map((day, index) => {
                        const isLastColumn = index % 7 === 6;

                        if (day === null) {
                            return (
                                <div
                                    key={`blank-${index}`}
                                    className={cn(
                                        'min-h-[66px] border-b border-line bg-bg sm:min-h-[104px]',
                                        !isLastColumn && 'border-e',
                                    )}
                                />
                            );
                        }

                        const date = dateOf(month, day);
                        const record = records[recordKey(employee.id, date)];
                        const friday = isFriday(date);

                        return (
                            <button
                                key={date}
                                type="button"
                                onClick={() => setOpenDate(date)}
                                className={cn(
                                    'flex min-h-[66px] min-w-0 flex-col items-start gap-1 border-b border-line p-1.5 text-start transition-colors hover:bg-accent-soft sm:min-h-[104px] sm:p-2',
                                    !isLastColumn && 'border-e',
                                    friday ? 'bg-sunk' : 'bg-surface',
                                )}
                                aria-label={`يوم ${day}`}
                            >
                                {date === today ? (
                                    <span className="num flex size-[26px] items-center justify-center rounded-full bg-gold text-[13px] font-semibold text-ink">
                                        {day}
                                    </span>
                                ) : (
                                    <span className="num text-[14px] font-semibold text-muted">
                                        {day}
                                    </span>
                                )}
                                {record ? (
                                    <>
                                        <span
                                            className={cn(
                                                'max-w-full truncate rounded-[5px] px-1.5 py-px text-[11px] font-semibold sm:text-[12.5px]',
                                                STATUS_FILL[record.status],
                                            )}
                                        >
                                            {STATUS_LABELS[record.status]}
                                        </span>
                                        {record.status === 'present' &&
                                            record.check_in && (
                                                <span className="num hidden text-[12px] text-muted sm:inline-block">
                                                    {record.check_in} –{' '}
                                                    {record.check_out}
                                                </span>
                                            )}
                                        {record.status !== 'present' &&
                                            record.note && (
                                                <span className="hidden max-w-full truncate text-[11.5px] text-muted sm:block">
                                                    {record.note}
                                                </span>
                                            )}
                                    </>
                                ) : (
                                    friday && (
                                        <span className="text-[11.5px] text-muted">
                                            عطلة
                                        </span>
                                    )
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {openDate && (
                <DayDialog
                    key={`${employee.id}-${openDate}`}
                    employee={employee}
                    date={openDate}
                    record={records[recordKey(employee.id, openDate)]}
                    onSave={onSave}
                    onClose={() => setOpenDate(null)}
                />
            )}
        </div>
    );
}

function Counter({
    label,
    value,
    className,
}: {
    label: string;
    value: number;
    className: string;
}) {
    return (
        <div className="flex flex-col">
            <span className="text-[12px] text-muted">{label}</span>
            <span
                className={cn(
                    'num text-[26px] leading-tight font-bold',
                    className,
                )}
            >
                {value}
            </span>
        </div>
    );
}
