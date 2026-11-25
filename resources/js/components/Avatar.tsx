import { cn } from '@/lib/utils';

const TINTS = [
    'bg-cyan-50 text-cyan-700',
    'bg-amber-50 text-amber-700',
    'bg-ok-50 text-ok-700',
    'bg-info-50 text-info-700',
    'bg-violet-50 text-violet-700',
    'bg-neutral-50 text-ink-2',
] as const;

const SIZES = {
    24: 'size-6 text-[10.5px]',
    32: 'size-8 text-[14px]',
    40: 'size-10 text-[17.5px]',
} as const;

/**
 * Round avatar with one Arabic letter (the first letter of the first word; two letters would
 * join), tinted by `id % 6`.
 */
export function Avatar({
    id,
    name,
    size = 32,
    className,
}: {
    id: number;
    name: string;
    size?: keyof typeof SIZES;
    className?: string;
}) {
    const letter = Array.from(name.trim())[0] ?? '؟';

    return (
        <span
            aria-hidden
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-full font-display leading-none font-semibold select-none',
                SIZES[size],
                TINTS[Math.abs(id) % TINTS.length],
                className,
            )}
        >
            {letter}
        </span>
    );
}
