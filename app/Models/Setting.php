<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $key
 * @property mixed $value
 */
#[Fillable(['key', 'value'])]
class Setting extends Model
{
    /** @var array<string, mixed> */
    public const DEFAULTS = [
        'work_start' => '08:00',
        'work_end' => '16:00',
    ];

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }

    /**
     * Read a setting value, falling back to the default.
     */
    public static function getValue(string $key): mixed
    {
        $setting = static::query()->find($key);

        return $setting->value ?? (self::DEFAULTS[$key] ?? null);
    }

    /**
     * Store a setting value.
     */
    public static function setValue(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /**
     * The default work hours.
     *
     * @return array{work_start: string, work_end: string}
     */
    public static function workHours(): array
    {
        $values = static::query()->whereIn('key', ['work_start', 'work_end'])->pluck('value', 'key');

        return [
            'work_start' => (string) ($values['work_start'] ?? self::DEFAULTS['work_start']),
            'work_end' => (string) ($values['work_end'] ?? self::DEFAULTS['work_end']),
        ];
    }
}
