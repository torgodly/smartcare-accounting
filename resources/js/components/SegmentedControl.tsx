import type { LucideIcon } from 'lucide-react';
import { m } from 'motion/react';
import { useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { springSnappy } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type SegmentTone = 'ok' | 'warn' | 'bad' | 'info';

export type SegmentOption<T extends string> = {
    value: T;
    label: string;
    icon?: LucideIcon;
    iconOnly?: boolean;
    /** Thumb tone for the `status` variant. */
    tone?: SegmentTone;
    /** Tiny keycap shown while the parent row has focus (`[data-row]:focus-within`). */
    shortcut?: string;
    /** Legacy, ignored. */
    activeClassName?: string;
};

const SIZES = {
    sm: 'h-7 px-2.5 text-[13px] leading-[18px] rounded-[7px] [&_svg]:size-3.5',
    md: 'h-[34px] px-3.5 text-[14px] leading-5 rounded-sm [&_svg]:size-4',
    lg: 'h-12 px-4 text-[15px] leading-[22px] rounded-md [&_svg]:size-[18px]',
} as const;

const TONES: Record<SegmentTone, { thumb: string; text: string; dot: string }> =
    {
        ok: {
            thumb: 'bg-ok-50 shadow-[inset_0_0_0_1px_rgb(46_158_91/0.35)]',
            text: 'text-ok-700',
            dot: 'bg-ok-500',
        },
        warn: {
            thumb: 'bg-warn-50 shadow-[inset_0_0_0_1px_rgb(227_154_45/0.35)]',
            text: 'text-warn-700',
            dot: 'bg-warn-500',
        },
        bad: {
            thumb: 'bg-bad-50 shadow-[inset_0_0_0_1px_rgb(229_72_77/0.35)]',
            text: 'text-bad-700',
            dot: 'bg-bad-500',
        },
        info: {
            thumb: 'bg-info-50 shadow-[inset_0_0_0_1px_rgb(76_123_224/0.35)]',
            text: 'text-info-700',
            dot: 'bg-info-500',
        },
    };

/**
 * Segmented radiogroup on a sunken track with a sliding thumb.
 * `onChange` fires even when the selected segment is clicked again (the page decides whether
 * that clears). RTL keys: ArrowLeft = next option, ArrowRight = previous.
 */
export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    ariaLabel,
    variant = 'neutral',
    size = 'md',
    fullWidth = false,
    className,
}: {
    options: SegmentOption<T>[];
    value: T | null;
    onChange: (value: T) => void;
    ariaLabel: string;
    variant?: 'neutral' | 'status';
    /** sm 28 · md 34 · lg 48; legacy `default` = md. */
    size?: 'sm' | 'md' | 'lg' | 'default';
    fullWidth?: boolean;
    className?: string;
}) {
    const layoutId = useId();
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const resolvedSize = size === 'default' ? 'md' : size;
    const selectedIndex = options.findIndex((option) => option.value === value);
    const focusableIndex = selectedIndex === -1 ? 0 : selectedIndex;

    function focusAt(index: number): void {
        const count = options.length;
        const next = ((index % count) + count) % count;
        buttons.current[next]?.focus();
    }

    function handleKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ): void {
        // RTL: the next option sits to the left.
        const moves: Record<string, number> = {
            ArrowLeft: index + 1,
            ArrowDown: index + 1,
            ArrowRight: index - 1,
            ArrowUp: index - 1,
            Home: 0,
            End: options.length - 1,
        };

        if (event.key in moves) {
            event.preventDefault();
            focusAt(moves[event.key]);
        }
    }

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={cn(
                'relative inline-flex items-center gap-0.5 rounded-md bg-sunken p-[3px]',
                fullWidth && 'flex w-full',
                className,
            )}
        >
            {options.map((option, index) => {
                const selected = option.value === value;
                const tone =
                    variant === 'status' && option.tone
                        ? TONES[option.tone]
                        : null;
                const Icon = option.icon;

                return (
                    <button
                        key={option.value}
                        ref={(element) => {
                            buttons.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={option.iconOnly ? option.label : undefined}
                        tabIndex={index === focusableIndex ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        className={cn(
                            'group/segment relative isolate flex flex-1 items-center justify-center gap-1.5 font-semibold whitespace-nowrap transition-colors duration-140 select-none focus-visible:outline-offset-0',
                            SIZES[resolvedSize],
                            selected
                                ? (tone?.text ?? 'text-ink-1')
                                : 'text-ink-2 hover:text-ink-1',
                        )}
                    >
                        {selected && (
                            <m.span
                                aria-hidden
                                layoutId={`segment-${layoutId}`}
                                transition={springSnappy}
                                className={cn(
                                    'absolute inset-0 -z-10 rounded-[inherit] transition-colors duration-140',
                                    tone
                                        ? tone.thumb
                                        : 'bg-surface shadow-[0_1px_2px_rgb(24_35_42/0.10),0_0_0_1px_rgb(24_35_42/0.04)]',
                                )}
                            />
                        )}
                        {tone && (
                            <span
                                aria-hidden
                                className={cn(
                                    'size-1.5 shrink-0 rounded-full transition-opacity duration-140',
                                    tone.dot,
                                    !selected && 'opacity-50',
                                )}
                            />
                        )}
                        {Icon && <Icon aria-hidden />}
                        {!option.iconOnly && <span>{option.label}</span>}
                        {option.shortcut && (
                            <kbd
                                aria-hidden
                                className="pointer-events-none hidden rounded-xs border border-line-2 bg-surface px-1 text-[10px] leading-3.5 font-semibold text-ink-3 group-focus-within/row:inline-block pointer-coarse:hidden!"
                            >
                                {option.shortcut}
                            </kbd>
                        )}
                        {selected && variant === 'status' && (
                            <span
                                aria-hidden
                                className="pointer-events-none absolute end-1 top-1/2 hidden -translate-y-1/2 text-[12px] leading-none text-ink-3 group-hover/segment:inline pointer-coarse:hidden!"
                            >
                                ×
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
