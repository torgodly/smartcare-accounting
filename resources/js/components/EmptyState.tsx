import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Centered empty state (inside a panel unless `bare`). `compact`: smaller, no icon tile.
 * Icons: salaries Users, purchases ReceiptText, invoices FileText, attendance CalendarDays.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    compact = false,
    bare = false,
    className,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    compact?: boolean;
    bare?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center text-center',
                !bare && 'rounded-lg border border-line-1 bg-surface shadow-e1',
                compact ? 'px-6 py-8' : 'px-6 py-14',
                className,
            )}
        >
            {Icon && !compact && (
                <span className="relative mb-4 flex size-14 items-center justify-center rounded-[16px] border border-line-1 bg-surface-2">
                    <Icon aria-hidden className="size-6 text-ink-3" />
                    <span
                        aria-hidden
                        className="absolute -end-1 -top-1 size-2 rounded-full bg-cyan-300"
                    />
                </span>
            )}
            <h3 className={compact ? 'text-title-3' : 'text-title-2'}>
                {title}
            </h3>
            {description && (
                <p className="mt-1.5 max-w-[44ch] text-body-sm text-ink-3">
                    {description}
                </p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
