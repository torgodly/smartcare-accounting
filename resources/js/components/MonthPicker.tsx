import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useEffect, useState } from 'react';
import { year as monthsYear } from '@/actions/App/Http/Controllers/MonthController';
import { http } from '@/lib/http';
import { formatNumber } from '@/lib/money';
import { MONTH_NAMES, monthLabel, splitMonth } from '@/lib/months';
import { cn } from '@/lib/utils';
import type { MonthTile } from '@/types';

/**
 * Month button with a year popover of 12 month tiles (salary totals per month).
 */
export function MonthPicker({
    month,
    currentMonth,
    onSelect,
}: {
    month: string;
    currentMonth: string;
    onSelect: (month: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState(() => splitMonth(month)[0]);
    const [tiles, setTiles] = useState<Record<number, MonthTile[]>>({});
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!open || tiles[year]) {
            return;
        }

        let cancelled = false;

        http.get<{ months: MonthTile[] }>(monthsYear.url(year))
            .then((data) => {
                if (!cancelled) {
                    setTiles((previous) => ({
                        ...previous,
                        [year]: data.months,
                    }));
                    setFailed(false);
                }
            })
            .catch(() => !cancelled && setFailed(true));

        return () => {
            cancelled = true;
        };
    }, [open, year, tiles]);

    function handleOpenChange(next: boolean) {
        setOpen(next);

        if (next) {
            setYear(splitMonth(month)[0]);
            setTiles({});
        }
    }

    const yearTiles = tiles[year];

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
            <PopoverPrimitive.Trigger asChild>
                <button
                    type="button"
                    className="flex h-8 items-center gap-1 rounded-md px-2.5 text-[14px] font-semibold whitespace-nowrap hover:bg-surface"
                    aria-label="اختيار الشهر"
                >
                    {monthLabel(month)}
                    <span className="text-[11px] text-muted">▾</span>
                </button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    dir="rtl"
                    align="center"
                    sideOffset={8}
                    collisionPadding={12}
                    className="z-50 w-[420px] max-w-[calc(100vw-24px)] rounded-[10px] border border-line bg-surface p-4 shadow-[0_20px_50px_rgba(0,0,0,.18)] outline-none"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setYear(year - 1)}
                            className="flex size-8 items-center justify-center rounded-md hover:bg-sunk"
                            aria-label="السنة السابقة"
                        >
                            <ChevronRight className="size-5" />
                        </button>
                        <span className="num font-display text-[20px] font-semibold">
                            {year}
                        </span>
                        <button
                            type="button"
                            onClick={() => setYear(year + 1)}
                            className="flex size-8 items-center justify-center rounded-md hover:bg-sunk"
                            aria-label="السنة التالية"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {MONTH_NAMES.map((name, index) => {
                            const value = `${year}-${String(index + 1).padStart(2, '0')}`;
                            const tile = yearTiles?.[index];
                            const selected = value === month;
                            const current = value === currentMonth;

                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        onSelect(value);
                                    }}
                                    className={cn(
                                        'flex min-h-[78px] flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-start transition-colors',
                                        selected
                                            ? 'border-accent bg-accent text-white'
                                            : 'border-line bg-surface hover:border-accent hover:bg-accent-soft',
                                        current && 'border-2 border-gold',
                                    )}
                                >
                                    <span className="text-[14px] font-semibold">
                                        {name}
                                    </span>
                                    {tile ? (
                                        <>
                                            <span className="num text-[17px] leading-tight font-bold">
                                                {tile.employees > 0
                                                    ? formatNumber(tile.total)
                                                    : '—'}
                                            </span>
                                            <TileState
                                                tile={tile}
                                                selected={selected}
                                            />
                                        </>
                                    ) : (
                                        <span
                                            className={cn(
                                                'mt-1 h-4 w-14 animate-pulse rounded',
                                                selected
                                                    ? 'bg-white/30'
                                                    : 'bg-sunk',
                                            )}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <p className="mt-3 text-[12.5px] text-muted">
                        {failed
                            ? 'تعذر تحميل المبالغ'
                            : 'المبلغ = إجمالي الرواتب المستحقة للشهر'}
                    </p>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}

function TileState({ tile, selected }: { tile: MonthTile; selected: boolean }) {
    const { text, className } = {
        none: { text: '—', className: 'text-muted' },
        paid: { text: 'مدفوع', className: 'text-ok' },
        upcoming: { text: 'قادم', className: 'text-muted' },
        partial: {
            text: `متبقي ${formatNumber(tile.remaining)}`,
            className: 'text-warn',
        },
        unpaid: { text: 'غير مدفوع', className: 'text-bad' },
    }[tile.state];

    return (
        <span
            className={cn(
                'text-[12px] font-semibold',
                selected ? 'text-white/90' : className,
            )}
        >
            {text}
        </span>
    );
}
