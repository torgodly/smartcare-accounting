import { usePage } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useState } from 'react';
import { IconButton } from '@/components/IconButton';
import { BottomSheet } from '@/components/ResponsiveDialog';
import { useIsPhone } from '@/hooks/use-media';
import { MONTH_NAMES, monthLabel, splitMonth, toMonth } from '@/lib/months';
import { cn } from '@/lib/utils';

/**
 * Month grid with a year stepper (no totals, no fetch).
 */
function MonthGrid({
    value,
    currentMonth,
    onPick,
}: {
    value: string;
    currentMonth: string;
    onPick: (month: string) => void;
}) {
    const [year, setYear] = useState(
        () => splitMonth(value || currentMonth)[0],
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <IconButton
                    label="السنة السابقة"
                    icon={ChevronRight}
                    size="sm"
                    onClick={() => setYear(year - 1)}
                />
                <span className="num text-title-2">{year}</span>
                <IconButton
                    label="السنة التالية"
                    icon={ChevronLeft}
                    size="sm"
                    onClick={() => setYear(year + 1)}
                />
            </div>
            <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES.map((name, index) => {
                    const month = toMonth(year, index + 1);
                    const selected = month === value;
                    const current = month === currentMonth;

                    return (
                        <button
                            key={month}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onPick(month)}
                            className={cn(
                                'relative h-11 rounded-sm border text-[14px] font-semibold transition-colors duration-140',
                                selected
                                    ? 'border-cyan-700 bg-cyan-700 text-white'
                                    : 'border-line-1 bg-surface text-ink-1 hover:border-line-2 hover:bg-surface-hover',
                            )}
                        >
                            {name}
                            {current && !selected && (
                                <span
                                    aria-hidden
                                    className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-amber-300"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Month field (replaces native type="month"): looks like an Input, opens a month grid
 * in a popover (bottom sheet on phone). `label` names the sheet on phone.
 */
export function MonthField({
    id,
    value,
    onChange,
    invalid = false,
    disabled = false,
    label = 'اختيار الشهر',
}: {
    id?: string;
    /** 'YYYY-MM' */
    value: string;
    onChange: (month: string) => void;
    invalid?: boolean;
    disabled?: boolean;
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const isPhone = useIsPhone();
    const currentMonth = usePage().props.currentMonth;

    function pick(month: string): void {
        setOpen(false);
        onChange(month);
    }

    const trigger = (
        <button
            id={id}
            type="button"
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-haspopup="dialog"
            aria-expanded={open}
            data-state={open ? 'open' : 'closed'}
            onClick={isPhone ? () => setOpen(true) : undefined}
            className="field-box flex h-10 items-center justify-between gap-2 px-3 text-start text-[15px] leading-6 max-sm:h-11"
        >
            <span className={cn(!value && 'text-ink-3')}>
                {value ? monthLabel(value) : '—'}
            </span>
            <CalendarDays aria-hidden className="size-4 shrink-0 text-ink-3" />
        </button>
    );

    if (isPhone) {
        return (
            <>
                {trigger}
                <BottomSheet
                    open={open}
                    onOpenChange={setOpen}
                    title={label}
                    layer="nested"
                >
                    <MonthGrid
                        value={value}
                        currentMonth={currentMonth}
                        onPick={pick}
                    />
                </BottomSheet>
            </>
        );
    }

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger asChild>
                {trigger}
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    dir="rtl"
                    align="start"
                    sideOffset={8}
                    collisionPadding={12}
                    className="anim-pop z-65 w-[320px] max-w-[calc(100vw-24px)] rounded-[12px] bg-surface p-4 shadow-e3 outline-none"
                >
                    <MonthGrid
                        value={value}
                        currentMonth={currentMonth}
                        onPick={pick}
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}
