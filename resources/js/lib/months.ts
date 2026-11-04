export const MONTH_NAMES = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
];

/** Day names indexed by JavaScript getDay() (0 = Sunday). */
export const DAY_NAMES = [
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
];

/** Week columns starting Saturday. */
export const WEEK_DAYS = [
    'السبت',
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
];

export function splitMonth(month: string): [number, number] {
    const [year, number] = month.split('-').map(Number);

    return [year, number];
}

/** "نوفمبر 2026" */
export function monthLabel(month: string): string {
    const [year, number] = splitMonth(month);

    return `${MONTH_NAMES[number - 1]} ${year}`;
}

export function monthName(month: string): string {
    return MONTH_NAMES[splitMonth(month)[1] - 1];
}

export function addMonths(month: string, count: number): string {
    const [year, number] = splitMonth(month);
    const index = year * 12 + (number - 1) + count;

    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

export function daysIn(month: string): number {
    const [year, number] = splitMonth(month);

    return new Date(year, number, 0).getDate();
}

export function dateOf(month: string, day: number): string {
    return `${month}-${String(day).padStart(2, '0')}`;
}

/** JavaScript weekday (0 = Sunday) of a Y-m-d date. */
export function weekday(date: string): number {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day).getDay();
}

/** Column of a date in a Saturday-first week (0 = Saturday … 6 = Friday). */
export function weekdayFromSaturday(date: string): number {
    return (weekday(date) + 1) % 7;
}

export function isFriday(date: string): boolean {
    return weekday(date) === 5;
}

/** "03/11/2026" */
export function formatDate(date: string | null | undefined): string {
    if (!date) {
        return '—';
    }

    const [year, month, day] = date.slice(0, 10).split('-');

    return `${day}/${month}/${year}`;
}

/** "الثلاثاء 3 نوفمبر" */
export function longDayLabel(date: string): string {
    const [, month, day] = date.split('-').map(Number);

    return `${DAY_NAMES[weekday(date)]} ${day} ${MONTH_NAMES[month - 1]}`;
}
