/**
 * Arabic text and digit helpers: inputs accept Arabic-Indic digits, the UI renders Western digits.
 */

const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;

/**
 * Convert Arabic-Indic (٠–٩) and Extended Arabic-Indic (۰–۹) digits to Western digits.
 */
export function toWesternDigits(value: string): string {
    return value.replace(/[٠-٩۰-۹]/g, (digit) => {
        const code = digit.charCodeAt(0);
        const base =
            code >= EXTENDED_ARABIC_INDIC_ZERO
                ? EXTENDED_ARABIC_INDIC_ZERO
                : ARABIC_INDIC_ZERO;

        return String(code - base);
    });
}

/**
 * Normalize Arabic text for search: alef forms → ا, ة → ه, ى → ي, no tashkeel or tatweel,
 * Western digits, lower case, collapsed spaces.
 */
export function normalizeArabic(value: string): string {
    return toWesternDigits(value)
        .replace(/[ً-ْٰ]/g, '')
        .replace(/ـ/g, '')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Normalize money typing: Western digits, «٫» → «.», no grouping marks or spaces,
 * one decimal point, at most 2 decimals, never negative.
 */
export function normalizeMoneyInput(value: string): string {
    const cleaned = toWesternDigits(value)
        .replace(/[٫]/g, '.')
        .replace(/[٬,\s ]/g, '')
        .replace(/[^0-9.]/g, '');

    const dot = cleaned.indexOf('.');

    if (dot === -1) {
        return cleaned;
    }

    const whole = cleaned.slice(0, dot);
    const fraction = cleaned
        .slice(dot + 1)
        .replace(/\./g, '')
        .slice(0, 2);

    return `${whole === '' ? '0' : whole}.${fraction}`;
}

/**
 * Normalize time typing to a partial or complete "HH:MM": Western digits, a colon after
 * two digits, at most four digits.
 */
export function normalizeTimeInput(value: string): string {
    const western = toWesternDigits(value).replace(/[٫.,،]/g, ':');
    const colon = western.indexOf(':');

    if (colon !== -1) {
        const hours = western.slice(0, colon).replace(/\D/g, '').slice(-2);
        const minutes = western
            .slice(colon + 1)
            .replace(/\D/g, '')
            .slice(0, 2);

        return `${hours}:${minutes}`;
    }

    const digits = western.replace(/\D/g, '').slice(0, 4);

    if (digits.length <= 2) {
        return digits;
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
