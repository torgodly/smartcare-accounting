import { cn } from '@/lib/utils';

/**
 * Invoice serial (CODE-YYMM-NNN): monospace, LTR, on a sunken chip.
 */
export function SerialChip({
    children,
    className,
}: {
    children: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'serial inline-flex items-center rounded-[6px] bg-sunken px-1.5 py-0.5 whitespace-nowrap',
                className,
            )}
        >
            {children}
        </span>
    );
}
