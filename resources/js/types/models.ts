export type PayrollStatus = 'paid' | 'partial' | 'unpaid' | 'not_started';

export type AttendanceStatus = 'present' | 'absent' | 'excuse' | 'leave';

export type AttendanceMode = 'time' | 'notime' | 'none';

export type InvoiceType = 'once' | 'recurring';

export type Region = 'east' | 'west';

export type RegionFilter = Region | 'all';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque';

export type GroupKind = 'purchase' | 'expense';

export type Option<T extends string = string> = { value: T; label: string };

export type Employee = {
    id: number;
    name: string;
    job_title: string | null;
    region: Region;
    region_label: string;
    payment_method: PaymentMethod;
    payment_method_label: string;
    account_number: string | null;
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
    treasury_id: number | null;
    payment_method: PaymentMethod | null;
    account_number: string | null;
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
    treasury_id: number | null;
    custody_id: number | null;
    source_label: string;
    settled: boolean;
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

export type PurchaseGroup = {
    id: number;
    name: string;
    code: string;
    region: Region;
    region_label: string;
    kind: GroupKind;
};

export type TreasuryRef = {
    id: number;
    name: string;
    region: Region;
    region_label: string;
};

export type Treasury = TreasuryRef & { balance: number };

export type CustodyOption = { id: number; label: string; region: Region };

export type CustodyState = {
    issued: number;
    replenished: number;
    returned: number;
    spent: number;
    pending: number;
    pending_count: number;
    cash: number;
};

export type Custody = CustodyState & {
    id: number;
    holder_name: string;
    title: string | null;
    label: string;
    region: Region;
    region_label: string;
    status: 'open' | 'closed';
    closed_on: string | null;
    opened_on: string | null;
    treasury: TreasuryRef;
};

export type LedgerKind =
    | 'deposit'
    | 'withdrawal'
    | 'transfer_in'
    | 'transfer_out'
    | 'salary'
    | 'invoice'
    | 'expense'
    | 'custody';

export type LedgerEntry = {
    key: string;
    date: string;
    kind: LedgerKind;
    description: string;
    detail: string | null;
    amount: number;
    balance: number;
    custody_id: number | null;
    group_id: number | null;
};

export type Ledger = {
    opening: number;
    inflow: number;
    outflow: number;
    closing: number;
    entries: LedgerEntry[];
};

export type MonthTile = {
    month: string;
    total: number;
    paid: number;
    remaining: number;
    employees: number;
    state: 'none' | 'paid' | 'upcoming' | 'partial' | 'unpaid';
};
