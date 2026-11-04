import { useState } from 'react';
import { AppDialog } from '@/components/AppDialog';
import { Field } from '@/components/Field';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/money';
import { longDayLabel } from '@/lib/months';
import type {
    AttendanceEmployee,
    AttendanceRecord,
    AttendanceStatus,
} from '@/types';
import type { SaveDay } from './Index';
import { REASON_PLACEHOLDERS, STATUS_OPTIONS } from './shared';

export function DayDialog({
    employee,
    date,
    record,
    onSave,
    onClose,
}: {
    employee: AttendanceEmployee;
    date: string;
    record: AttendanceRecord | undefined;
    onSave: SaveDay;
    onClose: () => void;
}) {
    const [status, setStatus] = useState<AttendanceStatus | null>(
        record?.status ?? null,
    );
    const [checkIn, setCheckIn] = useState(
        record?.check_in ?? employee.shift.start,
    );
    const [checkOut, setCheckOut] = useState(
        record?.check_out ?? employee.shift.end,
    );
    const [note, setNote] = useState(
        record?.status !== 'present' ? (record?.note ?? '') : '',
    );
    const [saving, setSaving] = useState(false);

    const timed = status === 'present' && employee.attendance_mode === 'time';

    function choose(next: AttendanceStatus) {
        if (next === status) {
            setStatus(null);

            return;
        }

        if (next === 'present') {
            setNote('');
            setCheckIn(
                record?.status === 'present' && record.check_in
                    ? record.check_in
                    : employee.shift.start,
            );
            setCheckOut(
                record?.status === 'present' && record.check_out
                    ? record.check_out
                    : employee.shift.end,
            );
        }

        setStatus(next);
    }

    async function save(nextStatus: AttendanceStatus | null) {
        setSaving(true);
        const ok = await onSave(employee, date, nextStatus, {
            check_in: timed ? checkIn : null,
            check_out: timed ? checkOut : null,
            note: nextStatus && nextStatus !== 'present' ? note : null,
        });
        setSaving(false);

        if (ok) {
            onClose();
        }
    }

    return (
        <AppDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={`${employee.name} · ${longDayLabel(date)}`}
            footer={
                <>
                    <Button onClick={() => save(status)} disabled={saving}>
                        {saving ? 'جارٍ الحفظ…' : 'حفظ'}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        إلغاء
                    </Button>
                    {record && (
                        <Button
                            variant="danger"
                            className="ms-auto"
                            onClick={() => save(null)}
                            disabled={saving}
                        >
                            مسح اليوم
                        </Button>
                    )}
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <SegmentedControl
                    ariaLabel="الحالة"
                    className="flex w-full"
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={choose}
                />

                {timed && (
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="الدخول" htmlFor="day-in">
                            <input
                                id="day-in"
                                type="time"
                                dir="ltr"
                                className="field-input num"
                                value={checkIn}
                                onChange={(event) =>
                                    setCheckIn(event.target.value)
                                }
                            />
                        </Field>
                        <Field label="الانصراف" htmlFor="day-out">
                            <input
                                id="day-out"
                                type="time"
                                dir="ltr"
                                className="field-input num"
                                value={checkOut}
                                onChange={(event) =>
                                    setCheckOut(event.target.value)
                                }
                            />
                        </Field>
                    </div>
                )}

                {status && status !== 'present' && (
                    <Field label="السبب" htmlFor="day-note">
                        <input
                            id="day-note"
                            className="field-input"
                            maxLength={255}
                            placeholder={REASON_PLACEHOLDERS[status]}
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                        />
                    </Field>
                )}

                {status && (
                    <p
                        className={
                            status === 'absent'
                                ? 'text-[14px] font-semibold text-bad'
                                : 'text-[14px] text-muted'
                        }
                    >
                        {status === 'absent'
                            ? `يُخصم ${formatNumber(employee.day_rate)} د.ل من الراتب`
                            : 'بدون خصم'}
                    </p>
                )}
            </div>
        </AppDialog>
    );
}
