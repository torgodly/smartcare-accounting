import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const CHEVRON =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235D6870' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

/**
 * Native <select> in the Input box with a chevron at inline-end.
 */
export function NativeSelect({
    className,
    style,
    ...props
}: ComponentProps<'select'>) {
    return (
        <select
            className={cn(
                'field-box h-10 appearance-none bg-no-repeat ps-3 pe-9 text-[15px] leading-6 max-sm:h-11',
                className,
            )}
            style={{
                backgroundImage: CHEVRON,
                // Physical: the chevron sits at inline-end, which is the left edge in RTL.
                backgroundPosition: 'left 12px center',
                ...style,
            }}
            {...props}
        />
    );
}
