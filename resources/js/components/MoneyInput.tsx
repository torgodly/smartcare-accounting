import { useRef, useState } from 'react';
import type {
    ChangeEvent,
    ComponentProps,
    FocusEvent,
    KeyboardEvent,
} from 'react';
import { normalizeMoneyInput } from '@/lib/arabic';
import { formatNumber, parseMoney, sumMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

export type MoneyInputProps = Omit<
    ComponentProps<'input'>,
    'type' | 'size' | 'value' | 'onChange'
> & {
    /** Raw value without grouping: '' | '12500.5'. */
    value: string;
    /** Legacy: `event.target.value` is already normalized. */
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    /** Preferred: receives the normalized raw value. */
    onValueChange?: (value: string) => void;
    /** md: h52, 22/28 · sm: h44, 18/24 (dense grids). */
    size?: 'md' | 'sm';
    invalid?: boolean;
};

/** Grouped display for a raw value ('12500.5' → '12,500.5'). */
function grouped(value: string): string {
    if (value === '' || value === '.') {
        return value;
    }

    return formatNumber(parseMoney(value));
}

/**
 * Money field: [number | «د.ل»]. Accepts Arabic-Indic digits and «٫», shows grouping when
 * blurred, selects all on focus, ↑ / ↓ step 1 (Shift: 10, never below 0).
 * The form value stays a plain numeric string.
 */
export function MoneyInput({
    value,
    onChange,
    onValueChange,
    size = 'md',
    invalid = false,
    className,
    onFocus,
    onBlur,
    onKeyDown,
    onMouseUp,
    disabled,
    'aria-invalid': ariaInvalid,
    ...props
}: MoneyInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);
    const selectOnMouseUp = useRef(false);
    const raw = value ?? '';

    /** Write a value through React's change pipeline so both callbacks fire. */
    function commit(next: string): void {
        const input = inputRef.current;

        if (!input) {
            return;
        }

        const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
        )?.set;
        setter?.call(input, next);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        const normalized = normalizeMoneyInput(event.target.value);

        if (normalized !== event.target.value) {
            event.target.value = normalized;
        }

        onValueChange?.(normalized);
        onChange?.(event);
    }

    function handleFocus(event: FocusEvent<HTMLInputElement>): void {
        setFocused(true);
        selectOnMouseUp.current = true;
        const input = event.currentTarget;
        requestAnimationFrame(() => input.select());
        onFocus?.(event);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>): void {
        setFocused(false);

        if (raw.endsWith('.')) {
            commit(raw.slice(0, -1));
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
        const step =
            (event.shiftKey ? 10 : 1) * (event.key === 'ArrowUp' ? 1 : -1);
        const next = Math.max(0, sumMoney(parseMoney(raw), step));
        commit(next === 0 && raw === '' && step < 0 ? '' : String(next));
    }

    const invalidState =
        invalid || ariaInvalid === true || ariaInvalid === 'true';

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
                'field-box flex cursor-text items-center overflow-hidden',
                size === 'md' ? 'h-[52px]' : 'h-11',
                className,
            )}
        >
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="done"
                dir="ltr"
                spellCheck={false}
                disabled={disabled}
                aria-invalid={invalidState || undefined}
                value={focused ? raw : grouped(raw)}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onMouseUp={(event) => {
                    if (selectOnMouseUp.current) {
                        selectOnMouseUp.current = false;
                        event.preventDefault();
                    }

                    onMouseUp?.(event);
                }}
                className={cn(
                    'num h-full min-w-0 flex-1 bg-transparent px-3 text-end text-ink-1 outline-none placeholder:font-normal placeholder:text-ink-3 disabled:cursor-not-allowed',
                    size === 'md'
                        ? 'money-field'
                        : 'text-[18px] leading-6 font-semibold',
                )}
                {...props}
            />
            <span aria-hidden className="h-6 w-px shrink-0 bg-line-1" />
            <span className="shrink-0 px-3 text-[13px] font-medium text-ink-3 select-none">
                د.ل
            </span>
        </div>
    );
}
