import { useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

/**
 * Roving focus for lists, tables and card grids: one row is tabbable, ↑ ↓ Home End move focus.
 * Spread `getRowProps(index)` on each focusable row element.
 */
export function useRovingRows(count: number): {
    focusedIndex: number;
    getRowProps: (index: number) => {
        tabIndex: number;
        'data-row-index': number;
        ref: (element: HTMLElement | null) => void;
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
        onFocus: (event: FocusEvent<HTMLElement>) => void;
    };
} {
    const [focusedIndex, setFocusedIndex] = useState(0);
    const rows = useRef<Map<number, HTMLElement>>(new Map());
    const active = Math.min(focusedIndex, Math.max(count - 1, 0));

    function move(next: number): void {
        const clamped = Math.max(0, Math.min(count - 1, next));
        setFocusedIndex(clamped);
        rows.current.get(clamped)?.focus();
    }

    function getRowProps(index: number) {
        return {
            tabIndex: index === active ? 0 : -1,
            'data-row-index': index,
            ref: (element: HTMLElement | null) => {
                if (element) {
                    rows.current.set(index, element);
                } else {
                    rows.current.delete(index);
                }
            },
            onFocus: (event: FocusEvent<HTMLElement>) => {
                if (event.target === event.currentTarget) {
                    setFocusedIndex(index);
                }
            },
            onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
                if (event.target !== event.currentTarget) {
                    return;
                }

                const keys: Record<string, number> = {
                    ArrowDown: index + 1,
                    ArrowUp: index - 1,
                    Home: 0,
                    End: count - 1,
                };

                if (event.key in keys) {
                    event.preventDefault();
                    move(keys[event.key]);
                }
            },
        };
    }

    return { focusedIndex: active, getRowProps };
}
