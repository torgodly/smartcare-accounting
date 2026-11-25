import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Text input: h40 (44 on phone), radius 10, line-field border, cyan focus halo,
 * `aria-invalid` → red border and halo.
 */
function Input({ className, type, ...props }: ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                'field-box h-10 px-3 text-[15px] leading-6 max-sm:h-11',
                className,
            )}
            {...props}
        />
    );
}

export { Input };
