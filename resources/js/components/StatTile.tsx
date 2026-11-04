import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A --sunk tile: small muted label above a big value.
 */
export function StatTile({
    label,
    children,
    className,
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex min-w-0 flex-col gap-1 rounded-md bg-sunk px-2 py-2.5 sm:px-3',
                className,
            )}
        >
            <span className="text-[13px] text-muted">{label}</span>
            <div className="min-w-0">{children}</div>
        </div>
    );
}
