import { useEffect, useState } from 'react';
import { year as monthsYear } from '@/actions/App/Http/Controllers/MonthController';
import { http } from '@/lib/http';
import type { MonthTile } from '@/types';

type TileCache = {
    generation: number | string;
    tiles: Record<number, MonthTile[]>;
    failed: Record<number, boolean>;
};

function emptyCache(generation: number | string): TileCache {
    return { generation, tiles: {}, failed: {} };
}

/**
 * The 12 salary month tiles of a year (GET months.year), one request per year shown.
 * `tiles` is null while loading or after an error. Changing `generation` clears the cache
 * (MonthPicker bumps it on every open so the totals are always fresh).
 */
export function useYearTiles(
    year: number,
    generation: number | string = 0,
    enabled = true,
): { tiles: MonthTile[] | null; error: boolean; loading: boolean } {
    const [cache, setCache] = useState<TileCache>(() => emptyCache(generation));
    const current =
        cache.generation === generation ? cache : emptyCache(generation);
    const tiles = current.tiles[year] ?? null;
    const error = current.failed[year] ?? false;
    const hasTiles = tiles !== null;

    useEffect(() => {
        if (!enabled || hasTiles) {
            return;
        }

        let cancelled = false;

        function store(update: (base: TileCache) => TileCache): void {
            setCache((previous) =>
                update(
                    previous.generation === generation
                        ? previous
                        : emptyCache(generation),
                ),
            );
        }

        http.get<{ months: MonthTile[] }>(monthsYear.url(year))
            .then((data) => {
                if (!cancelled) {
                    store((base) => ({
                        ...base,
                        tiles: { ...base.tiles, [year]: data.months },
                        failed: { ...base.failed, [year]: false },
                    }));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    store((base) => ({
                        ...base,
                        failed: { ...base.failed, [year]: true },
                    }));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [enabled, year, generation, hasTiles]);

    return { tiles, error, loading: enabled && !hasTiles && !error };
}
