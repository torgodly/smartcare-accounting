export type PayrollStatus = 'paid' | 'partial' | 'unpaid' | 'not_started';

export type AttendanceStatus = 'present' | 'absent' | 'excuse' | 'leave';

export type AttendanceMode = 'time' | 'notime' | 'none';

export type InvoiceType = 'once' | 'recurring';

export type Employee = {
    id: number;
    name: string;
    job_title: string | null;
    base_salary: number;
    start_month: string;
    attendance_mode: AttendanceMode;
    shift_start: string | null;
    shift_end: string | null;
    absence_day_rate: number | null;
    day_rate: number;
};

export type AttendanceEmployee = Employee & {
    shift: { start: string; end: string };
};

export type PayrollRow = {
    employee_id: number;
    month: string;
    started: boolean;
    has_record: boolean;
    base: number;
    bonus: number;
    manual_deduction: number;
    absent_days: number;
    day_rate: number;
    absence_deduction: number;
    deduction: number;
    due: number;
    carry: number;
    total: number;
    paid: number;
    remaining: number;
    status: PayrollStatus;
    note: string | null;
};

export type PayrollTotals = {
    base: number;
    bonus: number;
    deduction: number;
    carry: number;
    total: number;
    paid: number;
    remaining: number;
};

export type AttendanceRecord = {
    employee_id: number;
    date: string;
    status: AttendanceStatus;
    check_in: string | null;
    check_out: string | null;
    note: string | null;
};

export type AttendanceCounters = Record<AttendanceStatus, number> & {
    deduction: number;
};

export type ReceiptRef = { id: string; url: string };

export type Invoice = {
    id: number;
    serial: string;
    title: string;
    price: number;
    reason: string | null;
    type: InvoiceType;
    is_auto: boolean;
    month: string;
    created_at: string | null;
    receipt: ReceiptRef | null;
};

export type PurchaseSummary = {
    total: number;
    count: number;
    recurring: number;
    once: number;
    missing_receipts: number;
    with_receipts: number;
};

export type PurchaseGroup = { id: number; name: string; code: string };

export type MonthTile = {
    month: string;
    total: number;
    paid: number;
    remaining: number;
    employees: number;
    state: 'none' | 'paid' | 'upcoming' | 'partial' | 'unpaid';
};
