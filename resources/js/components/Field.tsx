import { AlertCircle } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Ids for a field's control, hint and error, plus the aria props the control should spread:
 * `<Input {...useFieldIds('employee-name', errors.name, true).controlProps} />`.
 */
export function useFieldIds(
    htmlFor?: string,
    error?: string,
    hasHint = false,
): {
    id: string;
    hintId: string;
    errorId: string;
    controlProps: {
        id: string;
        'aria-invalid': true | undefined;
        'aria-describedby': string | undefined;
    };
} {
    const generated = useId();
    const id = htmlFor ?? generated;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    return {
        id,
        hintId,
        errorId,
        controlProps: {
            id,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error ? errorId : hasHint ? hintId : undefined,
        },
    };
}

/**
 * Label → control → hint or error. The control plays one shake when an error appears.
 * Hint id: `${htmlFor}-hint`, error id: `${htmlFor}-error` (see useFieldIds).
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
    const [previousError, setPreviousError] = useState(error);
    const [shaking, setShaking] = useState(false);

    if (error !== previousError) {
        setPreviousError(error);

        if (error && !previousError) {
            setShaking(true);
        }
    }

    return (
        <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
            <label htmlFor={htmlFor} className="text-label text-ink-1">
                {label}
            </label>
            <div
                className={cn('min-w-0', shaking && 'anim-shake')}
                onAnimationEnd={(event) => {
                    if (event.target === event.currentTarget) {
                        setShaking(false);
                    }
                }}
            >
                {children}
            </div>
            {hint && !error && (
                <p
                    id={htmlFor ? `${htmlFor}-hint` : undefined}
                    className="text-caption text-ink-3"
                >
                    {hint}
                </p>
            )}
            {error && (
                <p
                    id={htmlFor ? `${htmlFor}-error` : undefined}
                    className="flex items-start gap-1.5 text-[13px] leading-[18px] font-medium text-bad-700"
                >
                    <AlertCircle
                        className="mt-0.5 size-3.5 shrink-0"
                        aria-hidden
                    />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}
