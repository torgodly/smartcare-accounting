import type { LucideIcon } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SIZES = {
    sm: 'size-8 rounded-sm [&_svg]:size-4',
    md: 'size-9 rounded-md [&_svg]:size-[18px]',
    lg: 'size-10 rounded-md [&_svg]:size-5',
} as const;

const VARIANTS = {
    ghost: 'text-ink-2 hover:bg-[rgb(24_35_42/0.05)] hover:text-ink-1 active:bg-[rgb(24_35_42/0.08)]',
    secondary:
        'border border-line-2 bg-surface text-ink-1 shadow-[0_1px_2px_rgb(24_35_42/0.05)] hover:bg-surface-2 active:bg-sunken',
    soft: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 active:bg-cyan-200',
} as const;

export type IconButtonProps = ComponentProps<'button'> & {
    /** Arabic aria-label, also the tooltip text. */
    label: string;
    icon: LucideIcon;
    /** 32 / 36 / 40 square; icon 16 / 18 / 20. */
    size?: keyof typeof SIZES;
    variant?: keyof typeof VARIANTS;
    /** Show the label as a tooltip on pointer devices (default true). */
    tooltip?: boolean;
    /** Render the child element (e.g. Inertia <Link>); the icon is inserted into it. */
    asChild?: boolean;
};

/**
 * Square icon-only button with an Arabic label and tooltip. On touch the hit area grows to 44px.
 */
export function IconButton({
    label,
    icon: Icon,
    size = 'md',
    variant = 'ghost',
    tooltip = true,
    asChild = false,
    className,
    type,
    children,
    ...props
}: IconButtonProps) {
    const classes = cn(
        "relative inline-flex shrink-0 items-center justify-center transition-[background-color,color,transform] duration-140 ease-out select-none active:scale-[.96] disabled:pointer-events-none disabled:opacity-45 pointer-coarse:before:absolute pointer-coarse:before:-inset-1 pointer-coarse:before:content-[''] [&_svg]:pointer-events-none [&_svg]:shrink-0",
        SIZES[size],
        VARIANTS[variant],
        className,
    );

    const button = asChild ? (
        <Slot.Root aria-label={label} className={classes} {...props}>
            <Icon aria-hidden />
            <Slot.Slottable>{children}</Slot.Slottable>
        </Slot.Root>
    ) : (
        <button
            type={type ?? 'button'}
            aria-label={label}
            className={classes}
            {...props}
        >
            <Icon aria-hidden />
        </button>
    );

    return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
}
