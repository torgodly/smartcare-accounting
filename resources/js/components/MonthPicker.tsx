import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover as PopoverPrimitive, Slot } from 'radix-ui';
import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';
import { IconButton } from '@/components/IconButton';
import { Money } from '@/components/Money';
import { BottomSheet } from '@/components/ResponsiveDialog';
import { Skeleton } from '@/components/Skeleton';
import { useIsPhone } from '@/hooks/use-media';
import { useYearTiles } from '@/hooks/use-year-tiles';
import { formatNumber } from '@/lib/money';
import { MONTH_NAMES, monthLabel, splitMonth, toMonth } from '@/lib/months';
import { cn } from '@/lib/utils';
import type { MonthTile } from '@/types';

const STATE_TEXT: Record<
    MonthTile['state'],
    { text: (tile: MonthTile) => string; className: string }
> = {
    none: { text: () => '—', className: 'text-ink-3' },
    paid: { text: () => 'مدفوع', className: 'text-ok-700' },
    upcoming: { text: () => 'قادم', className: 'text-ink-3' },
    partial: {
        text: (tile) => `متبقي ${formatNumber(tile.remaining)}`,
        className: 'text-warn-700',
    },
    unpaid: { text: () => 'غير مدفوع', className: 'text-bad-700' },
};

/**
 * Year header + 3×4 month tiles with the month's salary total and payment state.
 */
function MonthGrid({
    month,
    currentMonth,
    year,
    onYearChange,
    generation,
    onPick,
    phone,
    tileRefs,
}: {
    month: string;
    currentMonth: string;
    year: number;
    onYearChange: (year: number) => void;
    generation: number;
    onPick: (month: string) => void;
    phone: boolean;
    tileRefs: { current: (HTMLButtonElement | null)[] };
}) {
    const { tiles, error } = useYearTiles(year, generation);

    function handleKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ): void {
        // RTL grid: ArrowLeft moves to the next month, ArrowRight to the previous one.
        const moves: Record<string, number> = {
            ArrowLeft: 1,
            ArrowRight: -1,
            ArrowDown: 3,
            ArrowUp: -3,
        };

        if (event.key === 'PageUp' || event.key === 'PageDown') {
            event.preventDefault();
            onYearChange(year + (event.key === 'PageDown' ? 1 : -1));

            return;
        }

        if (event.key in moves) {
            event.preventDefault();
            const next = index + moves[event.key];

            if (next < 0) {
                onYearChange(year - 1);
                requestAnimationFrame(() =>
                    tileRefs.current[next + 12]?.focus(),
                );
            } else if (next > 11) {
                onYearChange(year + 1);
                requestAnimationFrame(() =>
                    tileRefs.current[next - 12]?.focus(),
                );
            } else {
                tileRefs.current[next]?.focus();
            }
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <IconButton
                    label="السنة السابقة"
                    icon={ChevronRight}
                    size="sm"
                    onClick={() => onYearChange(year - 1)}
                />
                <span className="num text-title-2">{year}</span>
                <IconButton
                    label="السنة التالية"
                    icon={ChevronLeft}
                    size="sm"
                    onClick={() => onYearChange(year + 1)}
                />
            </div>

            <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES.map((name, index) => {
                    const value = toMonth(year, index + 1);
                    const tile = tiles?.[index];
                    const selected = value === month;
                    const current = value === currentMonth;
                    const state = tile ? STATE_TEXT[tile.state] : null;

                    return (
                        <button
                            key={value}
                            ref={(element) => {
                                tileRefs.current[index] = element;
                            }}
                            type="button"
                            aria-pressed={selected}
                            aria-label={monthLabel(value)}
                            onClick={() => onPick(value)}
                            onKeyDown={(event) => handleKeyDown(event, index)}
                            className={cn(
                                'relative flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-start transition-colors duration-140',
                                phone ? 'min-h-[72px]' : 'min-h-20',
                                selected
                                    ? 'border-cyan-700 bg-cyan-700 text-white'
                                    : current
                                      ? 'border-line-1 bg-amber-50 text-ink-1 hover:border-line-2'
                                      : 'border-line-1 bg-surface text-ink-1 hover:border-line-2 hover:bg-surface-hover',
                            )}
                        >
                            {current && !selected && (
                                <span
                                    aria-hidden
                                    className="absolute end-2 top-2 size-1.5 rounded-full bg-amber-300"
                                />
                            )}
                            <span className="text-[14px] leading-5 font-semibold">
                                {name}
                            </span>
                            {tile && state ? (
                                <>
                                    {tile.employees > 0 ? (
                                        <Money
                                            value={tile.total}
                                            size="tile"
                                            tone="inherit"
                                            hideCurrency
                                        />
                                    ) : (
                                        <span className="num money-tile">
                                            —
                                        </span>
                                    )}
                                    <span
                                        className={cn(
                                            'text-[12px] leading-4 font-semibold',
                                            selected
                                                ? 'text-white/90'
                                                : state.className,
                                        )}
                                    >
                                        {state.text(tile)}
                                    </span>
                                </>
                            ) : (
                                !error && (
                                    <Skeleton
                                        className={cn(
                                            'mt-1 h-4 w-14',
                                            selected && 'bg-white/30',
                                        )}
                                    />
                                )
                            )}
                        </button>
                    );
                })}
            </div>

            <p className="text-caption text-ink-3">
                {error
                    ? 'تعذر تحميل المبالغ'
                    : 'المبلغ = إجمالي الرواتب المستحقة للشهر'}
            </p>
        </div>
    );
}

/**
 * Month selector: a trigger and a year of month tiles (salary totals per month).
 * Every open resets the year to the selected month and refetches; choosing a tile closes and
 * calls `onSelect`. Desktop popover (400 wide), phone bottom sheet.
 * `trigger` replaces the default button (it should carry its own aria-label).
 */
export function MonthPicker({
    month,
    currentMonth,
    onSelect,
    trigger,
    open: openProp,
    onOpenChange,
    side = 'bottom',
    align = 'center',
}: {
    month: string;
    currentMonth: string;
    onSelect: (month: string) => void;
    trigger?: ReactElement;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: 'left' | 'bottom';
    align?: 'start' | 'center';
}) {
    const isPhone = useIsPhone();
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const open = openProp ?? uncontrolledOpen;
    const [wasOpen, setWasOpen] = useState(open);
    const [year, setYear] = useState(() => splitMonth(month)[0]);
    const [generation, setGeneration] = useState(0);
    const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

    if (open !== wasOpen) {
        setWasOpen(open);

        if (open) {
            setYear(splitMonth(month)[0]);
            setGeneration(generation + 1);
        }
    }

    function setOpen(next: boolean): void {
        setUncontrolledOpen(next);
        onOpenChange?.(next);
    }

    function pick(value: string): void {
        setOpen(false);
        onSelect(value);
    }

    const triggerElement = trigger ?? (
        <button
            type="button"
            aria-label="اختيار الشهر"
            className="flex h-8 items-center gap-1 rounded-sm px-2.5 text-[14px] font-semibold whitespace-nowrap hover:bg-surface"
        >
            {monthLabel(month)}
            <span aria-hidden className="text-[11px] text-ink-3">
                ▾
            </span>
        </button>
    );

    const grid = (
        <MonthGrid
            month={month}
            currentMonth={currentMonth}
            year={year}
            onYearChange={setYear}
            generation={generation}
            onPick={pick}
            phone={isPhone}
            tileRefs={tileRefs}
        />
    );

    if (isPhone) {
        return (
            <>
                <Slot.Root
                    onClick={() => setOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                >
                    {triggerElement}
                </Slot.Root>
                <BottomSheet
                    open={open}
                    onOpenChange={setOpen}
                    title="اختيار الشهر"
                >
                    {open && grid}
                </BottomSheet>
            </>
        );
    }

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger asChild>
                {triggerElement}
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    dir="rtl"
                    side={side}
                    align={align}
                    sideOffset={8}
                    collisionPadding={12}
                    onOpenAutoFocus={(event) => {
                        const selectedIndex = splitMonth(month)[1] - 1;
                        const target = tileRefs.current[selectedIndex];

                        if (target) {
                            event.preventDefault();
                            target.focus();
                        }
                    }}
                    className="anim-pop z-65 w-[400px] max-w-[calc(100vw-24px)] rounded-lg bg-surface p-4 shadow-e3 outline-none"
                >
                    {grid}
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}
