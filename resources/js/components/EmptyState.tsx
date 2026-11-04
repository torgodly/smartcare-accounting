import type { ReactNode } from 'react';

/**
 * Centered empty state inside a panel.
 */
export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="panel flex flex-col items-center gap-2 px-6 py-14 text-center">
            <h3 className="font-display text-[20px] font-semibold">{title}</h3>
            {description && (
                <p className="max-w-md text-[14px] text-muted">{description}</p>
            )}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
