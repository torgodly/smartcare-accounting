import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { isApple } from '@/lib/platform';
import { cn } from '@/lib/utils';

/**
 * Keycap (hidden on touch-only devices).
 */
export function Kbd({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <kbd
            dir="ltr"
            className={cn(
                'inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line-2 bg-surface px-[5px] font-sans text-[11.5px] leading-4 font-semibold text-ink-2 shadow-[inset_0_-1px_0_var(--line-2)] [@media(hover:none)]:hidden',
                className,
            )}
        >
            {children}
        </kbd>
    );
}

const noop = (): (() => void) => () => undefined;

/**
 * ⌘ on Apple devices, Ctrl elsewhere.
 */
export function ModKey({ className }: { className?: string }) {
    const apple = useSyncExternalStore(noop, isApple, () => false);

    return <Kbd className={className}>{apple ? '⌘' : 'Ctrl'}</Kbd>;
}
