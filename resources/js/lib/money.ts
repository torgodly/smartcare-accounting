/**
 * Format a number with Western digits and up to two decimals, e.g. 1,250.5.
 */
export function formatNumber(value: number): string {
    return (Number.isFinite(value) ? value : 0).toLocaleString('en-US', {
        maximumFractionDigits: 2,
    });
}

/**
 * Parse a money input; empty or invalid input is 0.
 */
export function parseMoney(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    const parsed = Number(String(value).replace(/,/g, ''));

    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Add money values in integer cents to avoid float drift.
 */
export function sumMoney(...values: number[]): number {
    return (
        values.reduce((sum, value) => sum + Math.round(value * 100), 0) / 100
    );
}

/**
 * Value for a money input (empty when zero).
 */
export function moneyInputValue(value: number | null | undefined): string {
    return value ? String(value) : '';
}
