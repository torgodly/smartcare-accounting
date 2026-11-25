import { normalizeArabic, toWesternDigits } from '@/lib/arabic';

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

/** One-letter weekday initials, Saturday first (السبت … الجمعة). */
export const WEEKDAY_INITIALS = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];

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

/** First three letters of the month name, e.g. «نوف» (year-strip labels). */
export function shortMonthName(month: string): string {
    return Array.from(monthName(month)).slice(0, 3).join('');
}

/** Month value "YYYY-MM" from a year and a 1-based month number. */
export function toMonth(year: number, number: number): string {
    return `${year}-${String(number).padStart(2, '0')}`;
}

/** Spelling variants accepted by the palette, keyed by month number. */
const MONTH_ALIASES: Record<number, string[]> = {
    4: ['ابريل', 'إبريل'],
    6: ['يونيه'],
    7: ['يوليه'],
    8: ['اغسطس'],
};

const SEARCHABLE_MONTHS = MONTH_NAMES.map((name, index) => ({
    number: index + 1,
    names: [name, ...(MONTH_ALIASES[index + 1] ?? [])].map(normalizeArabic),
}));

/**
 * Months that a palette query refers to, newest first:
 * «مارس» → this year's and last year's March; «مارس 2026» → 2026-03;
 * "2026-03", "2026/3" or "3/2026" → 2026-03. Month names match by prefix (2+ letters).
 */
export function parseMonthQuery(text: string, year: number): string[] {
    const query = normalizeArabic(toWesternDigits(text));

    if (query === '') {
        return [];
    }

    const numeric =
        /^(\d{4})\s*[-/.]\s*(\d{1,2})$/.exec(query) ??
        /^(\d{1,2})\s*[-/.]\s*(\d{4})$/.exec(query);

    if (numeric) {
        const first = Number(numeric[1]);
        const second = Number(numeric[2]);
        const [parsedYear, parsedMonth] =
            numeric[1].length === 4 ? [first, second] : [second, first];

        return parsedMonth >= 1 && parsedMonth <= 12
            ? [toMonth(parsedYear, parsedMonth)]
            : [];
    }

    const yearMatch = /(?:^|\s)(\d{4})(?:\s|$)/.exec(query);
    const explicitYear = yearMatch ? Number(yearMatch[1]) : null;
    const words = query.replace(/(?:^|\s)\d{4}(?:\s|$)/, ' ').trim();

    if (words.length < 2) {
        return [];
    }

    const matches = SEARCHABLE_MONTHS.filter((month) =>
        month.names.some((name) => name.startsWith(words)),
    ).slice(0, 3);

    return matches.flatMap((month) =>
        explicitYear !== null
            ? [toMonth(explicitYear, month.number)]
            : [toMonth(year, month.number), toMonth(year - 1, month.number)],
    );
}
