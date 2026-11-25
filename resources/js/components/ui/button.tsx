import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'soft'
    | 'ghost'
    | 'danger'
    | 'danger-solid'
    | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

/** Legacy names accepted until the cleanup pass. */
type LegacyVariant = 'default' | 'outline' | 'destructive';
type LegacySize = 'default' | 'xs' | 'icon' | 'icon-sm';

const LEGACY_VARIANTS: Record<LegacyVariant, ButtonVariant> = {
    default: 'primary',
    outline: 'secondary',
    destructive: 'danger-solid',
};

const buttonVariants = cva(
    "relative inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-140 ease-out select-none active:scale-[.98] disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none aria-busy:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                primary:
                    'bg-cyan-700 text-white shadow-e1 hover:bg-cyan-800 active:bg-cyan-900',
                secondary:
                    'border border-line-2 bg-surface text-ink-1 shadow-[0_1px_2px_rgb(24_35_42/0.05)] hover:border-[#cbc8bd] hover:bg-surface-2 active:bg-sunken',
                soft: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 active:bg-cyan-200',
                ghost: 'text-ink-2 hover:bg-[rgb(24_35_42/0.05)] hover:text-ink-1 active:bg-[rgb(24_35_42/0.08)]',
                danger: 'border border-bad-border bg-surface text-bad-700 hover:bg-bad-50 active:bg-[#fad9d5]',
                'danger-solid':
                    'bg-bad-700 text-white hover:bg-bad-800 active:bg-[#7a1813]',
                link: 'text-cyan-700 underline-offset-4 hover:underline active:scale-100',
            },
            size: {
                sm: "h-8 gap-1.5 rounded-sm px-3 text-[13px] leading-[18px] has-[>svg:first-child]:ps-2.5 [&_svg:not([class*='size-'])]:size-4",
                md: "h-10 gap-2 rounded-md px-4 text-[14px] leading-5 has-[>svg:first-child]:ps-3.5 max-sm:h-11 [&_svg:not([class*='size-'])]:size-[18px]",
                lg: "h-12 gap-2 rounded-md px-5 text-[15px] leading-[22px] [&_svg:not([class*='size-'])]:size-5",
            },
            square: {
                true: 'px-0 has-[>svg:first-child]:ps-0',
                false: '',
            },
        },
        compoundVariants: [
            { variant: 'link', className: 'h-auto px-0 has-[>svg:first-child]:ps-0' },
            { square: true, size: 'sm', className: 'w-8' },
            { square: true, size: 'md', className: 'w-10 max-sm:w-11' },
            { square: true, size: 'lg', className: 'w-12' },
        ],
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            square: false,
        },
    },
);

export type ButtonProps = ComponentProps<'button'> & {
    /** Visual style; legacy `default` / `outline` / `destructive` are mapped. */
    variant?: ButtonVariant | LegacyVariant;
    /** sm 32 · md 40 (44 on phone) · lg 48; legacy `default` / `xs` / `icon` / `icon-sm` are mapped. */
    size?: ButtonSize | LegacySize;
    /** Leading icon at inline-start. */
    icon?: LucideIcon;
    /** Spinner replaces the icon; sets aria-busy and disables the button. */
    loading?: boolean;
    /** Render the child element (e.g. Inertia <Link> or <a download>) with button styles. */
    asChild?: boolean;
};

function resolveVariant(variant: ButtonProps['variant']): ButtonVariant {
    if (!variant) {
        return 'primary';
    }

    return variant in LEGACY_VARIANTS
        ? LEGACY_VARIANTS[variant as LegacyVariant]
        : (variant as ButtonVariant);
}

function resolveSize(size: ButtonProps['size']): {
    size: ButtonSize;
    square: boolean;
} {
    switch (size) {
        case 'sm':
        case 'xs':
            return { size: 'sm', square: false };
        case 'lg':
            return { size: 'lg', square: false };
        case 'icon':
            return { size: 'md', square: true };
        case 'icon-sm':
            return { size: 'sm', square: true };
        default:
            return { size: 'md', square: false };
    }
}

/**
 * Button with seven variants and three sizes. One primary per view.
 * Footer order: primary first (inline-start), then cancel; destructive pushed to the end with `ms-auto`.
 */
function Button({
    className,
    variant,
    size,
    icon: Icon,
    loading = false,
    asChild = false,
    disabled,
    children,
    type,
    ...props
}: ButtonProps) {
    const resolvedVariant = resolveVariant(variant);
    const { size: resolvedSize, square } = resolveSize(size);
    const classes = cn(
        buttonVariants({
            variant: resolvedVariant,
            size: resolvedSize,
            square,
        }),
        className,
    );
    const leading = loading ? (
        <Loader2 className="animate-spin" aria-hidden />
    ) : Icon ? (
        <Icon aria-hidden />
    ) : null;

    if (asChild) {
        return (
            <Slot.Root
                data-slot="button"
                data-variant={resolvedVariant}
                className={classes}
                aria-busy={loading || undefined}
                {...props}
            >
                {leading}
                <Slot.Slottable>{children}</Slot.Slottable>
            </Slot.Root>
        );
    }

    return (
        <button
            data-slot="button"
            data-variant={resolvedVariant}
            type={type ?? 'button'}
            className={classes}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {leading}
            {children}
        </button>
    );
}

export { Button, buttonVariants };
