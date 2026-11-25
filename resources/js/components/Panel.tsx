import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * White panel (radius 14, hairline, e1, overflow clip so sticky children work) with an
 * optional header (title, meta, actions) and a surface-2 footer.
 */
export function Panel({
    title,
    meta,
    actions,
    footer,
    padded = true,
    className,
    bodyClassName,
    children,
}: {
    title?: ReactNode;
    meta?: ReactNode;
    actions?: ReactNode;
    footer?: ReactNode;
    /** Body padding 20 (phone 16); default true. */
    padded?: boolean;
    className?: string;
    bodyClassName?: string;
    children: ReactNode;
}) {
    const hasHeader = Boolean(title || meta || actions);

    return (
        <section
            className={cn(
                'min-w-0 overflow-clip rounded-lg border border-line-1 bg-surface shadow-e1',
                className,
            )}
        >
            {hasHeader && (
                <header className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-1 px-5 py-2 max-sm:px-4">
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        {title && <h2 className="text-title-3">{title}</h2>}
                        {meta && (
                            <span className="text-label-sm text-ink-3">
                                {meta}
                            </span>
                        )}
                    </div>
                    {actions && (
                        <div className="flex shrink-0 items-center gap-2">
                            {actions}
                        </div>
                    )}
                </header>
            )}
            <div className={cn(padded && 'p-5 max-sm:p-4', bodyClassName)}>
                {children}
            </div>
            {footer && (
                <footer className="border-t border-line-1 bg-surface-2 px-5 py-3 max-sm:px-4">
                    {footer}
                </footer>
            )}
        </section>
    );
}

/**
 * Inset well: surface-2, radius 12, padding 16, no border or shadow.
 */
export function Inset({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('rounded-[12px] bg-surface-2 p-4', className)}>
            {children}
        </div>
    );
}

const INTERACTIVE =
    'group/card relative flex min-w-0 flex-col rounded-lg border border-line-1 bg-surface text-start text-ink-1 shadow-e1 transition-[border-color,box-shadow,transform] duration-140 ease-out hover:-translate-y-px hover:border-line-2 hover:shadow-e2 active:translate-y-0 active:shadow-e1 focus-visible:rounded-lg';

/**
 * Panel-looking card that is a link (`href` → Inertia <Link>) or a button (`onClick`).
 * Hover lifts 1px with e2; `chevron` adds a trailing ChevronLeft.
 */
export function InteractiveCard({
    href,
    onClick,
    chevron = false,
    className,
    children,
    'aria-label': ariaLabel,
}: {
    href?: string;
    onClick?: () => void;
    chevron?: boolean;
    className?: string;
    children: ReactNode;
    'aria-label'?: string;
}) {
    const content = (
        <>
            {children}
            {chevron && (
                <ChevronLeft
                    aria-hidden
                    className="absolute end-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-4 transition-colors group-hover/card:text-ink-2"
                />
            )}
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                aria-label={ariaLabel}
                className={cn(INTERACTIVE, chevron && 'pe-10', className)}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={cn(INTERACTIVE, chevron && 'pe-10', className)}
        >
            {content}
        </button>
    );
}
