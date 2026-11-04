import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Money } from '@/components/Money';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatusPill } from '@/components/StatusPill';
import {
    addMonths,
    DAY_NAMES,
    dateOf,
    daysIn,
    formatDate,
    isFriday,
    weekday,
} from '@/lib/months';
import type { AttendanceEmployee, AttendanceRecord } from '@/types';
import type { SaveDay } from './Index';
import {
    REASON_PLACEHOLDERS,
    STATUS_OPTIONS,
    ShiftLabel,
    recordKey,
} from './shared';
import type { RecordMap } from './shared';

export function DailyTable({
    month,
    day,
    employees,
    records,
    onSave,
    onDayChange,
}: {
    month: string;
    day: number;
    employees: AttendanceEmployee[];
    records: RecordMap;
    onSave: SaveDay;
    onDayChange: (params: Record<string, string | number>) => void;
}) {
    const date = dateOf(month, day);
    const lastDay = daysIn(month);

    function previousDay() {
        if (day > 1) {
            onDayChange({ day: day - 1 });
        } else {
            const previousMonth = addMonths(month, -1);
            onDayChange({ month: previousMonth, day: daysIn(previousMonth) });
        }
    }

    function nextDay() {
        if (day < lastDay) {
            onDayChange({ day: day + 1 });
        } else {
            onDayChange({ month: addMonths(month, 1), day: 1 });
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="panel flex items-center justify-center gap-4 px-4 py-3">
                <button
                    type="button"
                    onClick={previousDay}
                    className="flex size-9 items-center justify-center rounded-md hover:bg-sunk"
                    aria-label="اليوم السابق"
                >
                    <ChevronRight className="size-5" />
                </button>
                <div className="min-w-[140px] text-center">
                    <div className="font-display text-[18px] font-semibold">
                        {DAY_NAMES[weekday(date)]}
                    </div>
                    <div className="num text-[13px] text-muted">
                        {formatDate(date)}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={nextDay}
                    className="flex size-9 items-center justify-center rounded-md hover:bg-sunk"
                    aria-label="اليوم التالي"
                >
                    <ChevronLeft className="size-5" />
                </button>
                {isFriday(date) && (
                    <StatusPill kind="neutral">عطلة الجمعة</StatusPill>
                )}
            </div>

            <div className="panel overflow-x-auto">
                <table className="w-full min-w-[880px] text-[14px]">
                    <thead>
                        <tr className="bg-sunk text-[13px] text-muted">
                            {[
                                'الموظف',
                                'الحالة',
                                'الدخول',
                                'الانصراف',
                                'السبب',
                                'خصم اليوم',
                            ].map((label) => (
                                <th
                                    key={label}
                                    className="px-3 py-2.5 text-start font-semibold first:ps-4"
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => (
                            <DailyRow
                                key={employee.id}
                                employee={employee}
                                date={date}
                                record={records[recordKey(employee.id, date)]}
                                onSave={onSave}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DailyRow({
    employee,
    date,
    record,
    onSave,
}: {
    employee: AttendanceEmployee;
    date: string;
    record: AttendanceRecord | undefined;
    onSave: SaveDay;
}) {
    const [checkIn, setCheckIn] = useState(record?.check_in ?? '');
    const [checkOut, setCheckOut] = useState(record?.check_out ?? '');
    const [note, setNote] = useState(record?.note ?? '');

    useEffect(() => {
        setCheckIn(record?.check_in ?? '');
        setCheckOut(record?.check_out ?? '');
        setNote(record?.note ?? '');
    }, [record?.check_in, record?.check_out, record?.note]);

    const status = record?.status ?? null;
    const timed = status === 'present' && employee.attendance_mode === 'time';

    function saveField(
        changes: Partial<
            Pick<AttendanceRecord, 'check_in' | 'check_out' | 'note'>
        >,
    ) {
        if (!status) {
            return;
        }

        const unchanged =
            (changes.check_in === undefined ||
                changes.check_in === record?.check_in) &&
            (changes.check_out === undefined ||
                changes.check_out === record?.check_out) &&
            (changes.note === undefined ||
                (changes.note || null) === (record?.note ?? null));

        if (!unchanged) {
            void onSave(employee, date, status, changes);
        }
    }

    return (
        <tr className="border-t border-line">
            <td className="px-3 py-3 ps-4">
                <div className="min-w-[140px] font-semibold">
                    {employee.name}
                </div>
                <ShiftLabel employee={employee} />
            </td>
            <td className="px-3 py-3">
                <SegmentedControl
                    size="sm"
                    ariaLabel={`حالة ${employee.name}`}
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={(next) =>
                        void onSave(
                            employee,
                            date,
                            next === status ? null : next,
                        )
                    }
                />
            </td>
            <td className="px-3 py-3">
                {timed ? (
                    <input
                        type="time"
                        dir="ltr"
                        aria-label="وقت الدخول"
                        className="field-input num h-9 w-[118px] px-2 text-[14px]"
                        value={checkIn}
                        onChange={(event) => setCheckIn(event.target.value)}
                        onBlur={() =>
                            checkIn && saveField({ check_in: checkIn })
                        }
                    />
                ) : (
                    <span className="text-muted">—</span>
                )}
            </td>
            <td className="px-3 py-3">
                {timed ? (
                    <input
                        type="time"
                        dir="ltr"
                        aria-label="وقت الانصراف"
                        className="field-input num h-9 w-[118px] px-2 text-[14px]"
                        value={checkOut}
                        onChange={(event) => setCheckOut(event.target.value)}
                        onBlur={() =>
                            checkOut && saveField({ check_out: checkOut })
                        }
                    />
                ) : (
                    <span className="text-muted">—</span>
                )}
            </td>
            <td className="px-3 py-3">
                {status && status !== 'present' ? (
                    <input
                        className="field-input h-9 min-w-[170px] text-[14px]"
                        placeholder={REASON_PLACEHOLDERS[status]}
                        maxLength={255}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        onBlur={() => saveField({ note })}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && event.currentTarget.blur()
                        }
                    />
                ) : (
                    <span className="text-muted">—</span>
                )}
            </td>
            <td className="px-3 py-3">
                {status === 'absent' ? (
                    <Money
                        value={employee.day_rate}
                        sign="−"
                        tone="bad"
                        size="base"
                    />
                ) : (
                    <Money
                        value={employee.day_rate}
                        tone="muted"
                        size="base"
                        className="text-[13px] font-normal opacity-70"
                    />
                )}
            </td>
        </tr>
    );
}
