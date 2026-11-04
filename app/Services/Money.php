<?php

namespace App\Services;

/**
 * Money conversions. Calculations run on integer cents so no float drift reaches the totals.
 */
class Money
{
    /**
     * Convert a decimal string or number to cents.
     */
    public static function toCents(string|int|float|null $value): int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        return (int) round(((float) $value) * 100);
    }

    /**
     * Convert cents to a number with two decimals.
     */
    public static function fromCents(int $cents): float
    {
        return round($cents / 100, 2);
    }

    /**
     * Format for display: "1,250.5" (Western digits, up to 2 decimals).
     */
    public static function format(float|int $value): string
    {
        $formatted = number_format((float) $value, 2, '.', ',');

        return str_contains($formatted, '.') ? rtrim(rtrim($formatted, '0'), '.') : $formatted;
    }
}
