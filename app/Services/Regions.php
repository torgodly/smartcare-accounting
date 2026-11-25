<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

/**
 * The east/west split of the business and the region the user is currently looking at.
 */
class Regions
{
    public const EAST = 'east';

    public const WEST = 'west';

    public const ALL = 'all';

    public const SESSION_KEY = 'region';

    /** @var array<string, string> */
    public const LABELS = [
        self::EAST => 'الشرق',
        self::WEST => 'الغرب',
    ];

    /**
     * Every real region key.
     *
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_keys(self::LABELS);
    }

    /**
     * The region filter stored in the session: east, west or all.
     */
    public static function current(Request $request): string
    {
        $locked = self::lockedFor($request);
        if ($locked !== null) {
            return $locked;
        }

        $region = $request->hasSession() ? $request->session()->get(self::SESSION_KEY) : null;

        return in_array($region, [...self::keys(), self::ALL], true) ? $region : self::ALL;
    }

    /**
     * The region new records default to: the current filter, or east when showing all.
     */
    public static function defaultFor(Request $request): string
    {
        $region = self::current($request);

        return $region === self::ALL ? self::EAST : $region;
    }

    /**
     * The region a non-admin account is tied to; null for admins (and guests).
     */
    public static function lockedFor(Request $request): ?string
    {
        $user = $request->user();

        return $user instanceof User ? $user->lockedRegion() : null;
    }

    /**
     * Whether the signed-in account may touch a record of this region.
     */
    public static function allows(Request $request, ?string $region): bool
    {
        $locked = self::lockedFor($request);

        return $locked === null || $locked === $region;
    }

    /**
     * An exists rule on a region table, limited to the account's region for non-admins.
     */
    public static function exists(Request $request, string $table): Exists
    {
        $rule = Rule::exists($table, 'id');
        $locked = self::lockedFor($request);

        return $locked === null ? $rule : $rule->where('region', $locked);
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
}
