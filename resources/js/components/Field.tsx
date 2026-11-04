import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Label + control + optional hint and error.
 */
export function Field({
    label,
    htmlFor,
    hint,
    error,
    children,
    className,
}: {
    label: ReactNode;
    htmlFor?: string;
    hint?: ReactNode;
    error?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
            <label
                htmlFor={htmlFor}
                className="text-[13px] font-semibold text-ink"
            >
                {label}
            </label>
            {children}
            {hint && !error && (
                <p className="text-[12.5px] text-muted">{hint}</p>
            )}
            {error && <p className="text-[12.5px] text-bad">{error}</p>}
        </div>
    );
}
