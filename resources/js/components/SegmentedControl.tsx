import { cn } from '@/lib/utils';

export type SegmentOption<T extends string> = {
    value: T;
    label: string;
    /** Classes for the selected state (defaults to a white raised segment). */
    activeClassName?: string;
};

/**
 * A --sunk pill with buttons; one is selected.
 */
export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    className,
    size = 'default',
    ariaLabel,
}: {
    options: SegmentOption<T>[];
    value: T | null;
    onChange: (value: T) => void;
    className?: string;
    size?: 'default' | 'sm';
    ariaLabel?: string;
}) {
    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={cn(
                'inline-flex items-center gap-0.5 rounded-lg bg-sunk p-[3px]',
                className,
            )}
        >
            {options.map((option) => {
                const active = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'flex-1 rounded-md font-semibold whitespace-nowrap transition-colors',
                            size === 'sm'
                                ? 'h-7 px-2.5 text-[13px]'
                                : 'h-8 px-3.5 text-[14px]',
                            active
                                ? (option.activeClassName ??
                                      'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]')
                                : 'text-muted hover:text-ink',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
