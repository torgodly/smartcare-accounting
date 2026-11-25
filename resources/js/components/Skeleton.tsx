import { cn } from '@/lib/utils';

const SHAPES = {
    text: 'rounded-[6px]',
    control: 'rounded-md',
    card: 'rounded-lg',
} as const;

/**
 * Shimmering placeholder (sunken, sweep right → left; static when reduced motion).
 * Give it a size with className (caption h-3, body h-3.5, title h-[22px], kpi h-7, button h-10)
 * and set aria-busy="true" on the container.
 */
export function Skeleton({
    className,
    shape = 'text',
}: {
    className?: string;
    shape?: keyof typeof SHAPES;
}) {
    return (
        <span
            aria-hidden
            className={cn('skeleton block', SHAPES[shape], className)}
        />
    );
}
