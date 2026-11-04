import type { SegmentOption } from '@/components/SegmentedControl';
import type {
    AttendanceEmployee,
    AttendanceRecord,
    AttendanceStatus,
} from '@/types';

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
    present: 'حاضر',
    absent: 'غائب',
    excuse: 'عذر',
    leave: 'إجازة',
};

export const STATUS_FILL: Record<AttendanceStatus, string> = {
    present: 'bg-ok text-white',
    absent: 'bg-bad text-white',
    excuse: 'bg-warn text-white',
    leave: 'bg-info text-white',
};

export const STATUS_OPTIONS: SegmentOption<AttendanceStatus>[] = (
    Object.keys(STATUS_LABELS) as AttendanceStatus[]
).map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
    activeClassName: STATUS_FILL[status],
}));

export const REASON_PLACEHOLDERS: Record<
    Exclude<AttendanceStatus, 'present'>,
    string
> = {
    absent: 'سبب الغياب (اختياري)',
    excuse: 'سبب العذر',
    leave: 'نوع الإجازة',
};

export const MODE_LABELS = {
    time: 'بوقت دوام محدد',
    notime: 'حضور بدون وقت',
    none: 'بدون حضور وغياب',
} as const;

export type RecordMap = Record<string, AttendanceRecord>;

export function recordKey(employeeId: number, date: string): string {
    return `${employeeId}|${date}`;
}

export function toRecordMap(records: AttendanceRecord[]): RecordMap {
    return Object.fromEntries(
        records.map((record) => [
            recordKey(record.employee_id, record.date),
            record,
        ]),
    );
}

/**
 * The record the server will store for a status change (mirrors AttendanceService::save).
 */
export function nextRecord(
    employee: AttendanceEmployee,
    date: string,
    status: AttendanceStatus,
    previous: AttendanceRecord | undefined,
    changes: Partial<
        Pick<AttendanceRecord, 'check_in' | 'check_out' | 'note'>
    > = {},
): AttendanceRecord {
    const timed = status === 'present' && employee.attendance_mode === 'time';
    const keepTimes = previous?.status === 'present';

    return {
        employee_id: employee.id,
        date,
        status,
        check_in: timed
            ? (changes.check_in ??
              (keepTimes ? previous?.check_in : null) ??
              employee.shift.start)
            : null,
        check_out: timed
            ? (changes.check_out ??
              (keepTimes ? previous?.check_out : null) ??
              employee.shift.end)
            : null,
        note:
            status === 'present'
                ? null
                : (changes.note ??
                  (previous?.status !== 'present' ? previous?.note : null) ??
                  null),
    };
}

export function ShiftLabel({ employee }: { employee: AttendanceEmployee }) {
    return (
        <div className="text-[12.5px] whitespace-nowrap text-muted">
            {employee.attendance_mode === 'time' ? (
                <>
                    دوام{' '}
                    <span className="num">
                        {employee.shift.start}–{employee.shift.end}
                    </span>
                </>
            ) : (
                'بدون وقت'
            )}
        </div>
    );
}
