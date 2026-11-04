<?php

namespace App\Services;

use Illuminate\Support\Carbon;

/**
 * Helpers for months stored as "YYYY-MM" strings.
 */
class Months
{
    public const NAMES = [
        1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل', 5 => 'مايو', 6 => 'يونيو',
        7 => 'يوليو', 8 => 'أغسطس', 9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر',
    ];

    public const DAY_NAMES = [
        0 => 'الأحد', 1 => 'الإثنين', 2 => 'الثلاثاء', 3 => 'الأربعاء', 4 => 'الخميس', 5 => 'الجمعة', 6 => 'السبت',
    ];

    /**
     * The current month in the app timezone.
     */
    public static function current(): string
    {
        return Carbon::now()->format('Y-m');
    }

    /**
     * Whether the given value is a valid "YYYY-MM" month.
     */
    public static function isValid(mixed $value): bool
    {
        return is_string($value)
            && preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $value) === 1
            && (int) substr($value, 0, 4) >= 2000
            && (int) substr($value, 0, 4) <= 2100;
    }

    /**
     * Return the value when it is a valid month, else the current month.
     */
    public static function orCurrent(mixed $value): string
    {
        return self::isValid($value) ? $value : self::current();
    }

    /**
     * Add (or subtract) months.
     */
    public static function add(string $month, int $count): string
    {
        [$year, $number] = self::split($month);
        $index = $year * 12 + ($number - 1) + $count;

        return sprintf('%04d-%02d', intdiv($index, 12), $index % 12 + 1);
    }

    /**
     * Number of months from $from to $to (negative when $to is earlier).
     */
    public static function diff(string $from, string $to): int
    {
        [$fromYear, $fromNumber] = self::split($from);
        [$toYear, $toNumber] = self::split($to);

        return ($toYear * 12 + $toNumber) - ($fromYear * 12 + $fromNumber);
    }

    /**
     * Arabic label, e.g. "نوفمبر 2026".
     */
    public static function label(string $month): string
    {
        [$year, $number] = self::split($month);

        return self::NAMES[$number].' '.$year;
    }

    /**
     * Number of days in the month.
     */
    public static function daysIn(string $month): int
    {
        return self::firstDay($month)->daysInMonth;
    }

    /**
     * The first day of the month.
     */
    public static function firstDay(string $month): Carbon
    {
        return Carbon::createFromFormat('Y-m-d', $month.'-01')->startOfDay();
    }

    /**
     * The month a date belongs to.
     */
    public static function ofDate(Carbon|string $date): string
    {
        return substr($date instanceof Carbon ? $date->toDateString() : $date, 0, 7);
    }

    /**
     * @return array{0: int, 1: int}
     */
    private static function split(string $month): array
    {
        return [(int) substr($month, 0, 4), (int) substr($month, 5, 2)];
    }
}
