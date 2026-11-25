import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Legacy sunken tile (label above a value). New code uses StatCard. Removed in the cleanup pass.
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
                'flex min-w-0 flex-col gap-1 rounded-md bg-surface-2 px-2 py-2.5 sm:px-3',
                className,
            )}
        >
            <span className="text-label-sm text-ink-3">{label}</span>
            <div className="min-w-0">{children}</div>
        </div>
    );
}
