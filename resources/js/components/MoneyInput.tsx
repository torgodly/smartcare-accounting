import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Money input: 20px/600, tabular, LTR digits.
 */
export function MoneyInput({
    className,
    ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
    return (
        <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            dir="ltr"
            className={cn('field-input money-input', className)}
            {...props}
        />
    );
}
