<?php

namespace App\Services;

/**
 * How a salary is paid out (نوع الخلاص).
 */
class PaymentMethods
{
    public const CASH = 'cash';

    public const BANK_TRANSFER = 'bank_transfer';

    public const CHEQUE = 'cheque';

    /** @var array<string, string> */
    public const LABELS = [
        self::CASH => 'نقدي',
        self::BANK_TRANSFER => 'تحويل مصرفي',
        self::CHEQUE => 'صك',
    ];

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_keys(self::LABELS);
    }

    /**
     * Options for the client.
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (string $key): array => ['value' => $key, 'label' => self::LABELS[$key]],
            self::keys(),
        );
    }

    /**
     * The Arabic label of a method.
     */
    public static function label(?string $method): string
    {
        return self::LABELS[$method] ?? '';
    }
}
