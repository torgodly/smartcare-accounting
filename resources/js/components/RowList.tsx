import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A panel of stacked rows that reads well at any width (no sideways scrolling on phones).
 */
export function RowList({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <ul
            className={cn(
                'panel divide-y divide-line overflow-hidden',
                className,
            )}
        >
            {children}
        </ul>
    );
}

/**
 * One row: title and meta at the start, figures at the end. Clickable when `onOpen` is set.
 */
export function RowItem({
    title,
    meta,
    leading,
    end,
    endMeta,
    onOpen,
    action,
}: {
    title: ReactNode;
    meta?: ReactNode;
    leading?: ReactNode;
    end?: ReactNode;
    endMeta?: ReactNode;
    onOpen?: () => void;
    /** Extra control after the figures (e.g. a delete button); kept outside the click target. */
    action?: ReactNode;
}) {
    const body = (
        <>
            {leading && <div className="shrink-0">{leading}</div>}
            <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{title}</div>
                {meta && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
                        {meta}
                    </div>
                )}
            </div>
            {(end || endMeta) && (
                <div className="flex shrink-0 flex-col items-end gap-1 text-end">
                    {end}
                    {endMeta && (
                        <div className="text-[12px] text-muted">{endMeta}</div>
                    )}
                </div>
            )}
        </>
    );

    return (
        <li className="flex items-center gap-2 pe-2">
            {onOpen ? (
                <button
                    type="button"
                    onClick={onOpen}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-accent-soft/40 focus-visible:bg-accent-soft/40"
                >
                    {body}
                </button>
            ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
                    {body}
                </div>
            )}
            {action}
        </li>
    );
}
