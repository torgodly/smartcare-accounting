import { Clock } from 'lucide-react';
import { useRef } from 'react';
import type {
    ChangeEvent,
    ComponentProps,
    FocusEvent,
    KeyboardEvent,
} from 'react';
import { normalizeTimeInput } from '@/lib/arabic';
import { cn } from '@/lib/utils';

/** True for a complete 24h time "HH:MM". */
export function isCompleteTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Clamp and pad a partial time: '8:5' → '08:05', '8' → '08:00', '' → ''. */
export function finalizeTime(value: string): string {
    const normalized = normalizeTimeInput(value);

    if (normalized === '' || normalized === ':') {
        return '';
    }

    const [hoursText = '', minutesText = ''] = normalized.split(':');
    const hours = Math.min(23, Math.max(0, Number(hoursText || 0)));
    const minutes = Math.min(59, Math.max(0, Number(minutesText || 0)));

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export type TimeInputProps = Omit<
    ComponentProps<'input'>,
    'type' | 'value' | 'onChange'
> & {
    /** '' or 'HH:MM' (server format H:i). */
    value: string;
    onValueChange: (value: string) => void;
    invalid?: boolean;
};

/**
 * Masked 24h time field (no AM/PM in any locale). Accepts Arabic-Indic digits, inserts «:»
 * after two digits, clamps and pads on blur. `onBlur` runs after the value is finalized, so
 * read `event.currentTarget.value` there. ↑ / ↓ step the hour or 5 minutes under the caret.
 */
export function TimeInput({
    value,
    onValueChange,
    invalid = false,
    className,
    onBlur,
    onKeyDown,
    disabled,
    'aria-invalid': ariaInvalid,
    ...props
}: TimeInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const invalidState =
        invalid || ariaInvalid === true || ariaInvalid === 'true';

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        onValueChange(normalizeTimeInput(event.target.value));
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>): void {
        const finalized = finalizeTime(event.currentTarget.value);

        if (finalized !== event.currentTarget.value) {
            event.currentTarget.value = finalized;
            onValueChange(finalized);
        }

        onBlur?.(event);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
        onKeyDown?.(event);

        if (
            event.defaultPrevented ||
            (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
        ) {
            return;
        }

        event.preventDefault();
        const input = event.currentTarget;
        const caret = input.selectionStart ?? 0;
        const current = isCompleteTime(value) ? value : finalizeTime(value);
        const [hours, minutes] = (current || '00:00').split(':').map(Number);
        const direction = event.key === 'ArrowUp' ? 1 : -1;
        let total = hours * 60 + minutes;

        if (caret <= 2) {
            total += direction * 60;
        } else {
            total += direction * 5;
        }

        total = ((total % 1440) + 1440) % 1440;
        const next = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
        onValueChange(next);
        requestAnimationFrame(() => input.setSelectionRange(caret, caret));
    }

    return (
        <div
            data-invalid={invalidState || undefined}
            data-disabled={disabled || undefined}
            onMouseDown={(event) => {
                if (event.target !== inputRef.current) {
                    event.preventDefault();
                    inputRef.current?.focus();
                }
            }}
            className={cn(
                'field-box flex h-10 cursor-text items-center overflow-hidden max-sm:h-11',
                className,
            )}
        >
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                placeholder="--:--"
                maxLength={5}
                spellCheck={false}
                disabled={disabled}
                aria-invalid={invalidState || undefined}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="num h-full min-w-0 flex-1 bg-transparent px-3 text-end text-[15px] leading-6 text-ink-1 outline-none placeholder:text-ink-3 disabled:cursor-not-allowed"
                {...props}
            />
            <Clock aria-hidden className="me-3 size-4 shrink-0 text-ink-3" />
        </div>
    );
}
