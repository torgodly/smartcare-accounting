import { useEffect, useRef } from 'react';

export type ShortcutOptions = {
    enabled?: boolean;
    allowInFields?: boolean;
    allowInDialogs?: boolean;
};

type ParsedCombo = {
    code: string;
    mod: boolean;
    shift: boolean;
    alt: boolean;
};

function parseCombo(combo: string): ParsedCombo {
    const parts = combo.split('+');
    const code = parts.pop() ?? '';

    return {
        code,
        mod: parts.includes('Mod'),
        shift: parts.includes('Shift'),
        alt: parts.includes('Alt'),
    };
}

/** True while focus is in a text field, select or contenteditable element. */
export function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    if (target.isContentEditable) {
        return true;
    }

    const tag = target.tagName;

    if (tag === 'TEXTAREA' || tag === 'SELECT') {
        return true;
    }

    if (tag === 'INPUT') {
        const type = (target as HTMLInputElement).type;

        return ![
            'button',
            'checkbox',
            'radio',
            'submit',
            'reset',
            'file',
            'range',
            'color',
        ].includes(type);
    }

    return target.closest('[cmdk-input]') !== null;
}

/** True while a dialog, sheet or the command palette is open. */
export function isOverlayOpen(): boolean {
    return (
        document.querySelector(
            '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-vaul-drawer][data-state="open"]',
        ) !== null
    );
}

/**
 * Global keyboard shortcut matched on KeyboardEvent.code (physical keys), so it works with
 * an Arabic keyboard layout. `Mod` is ⌘ on Apple and Ctrl elsewhere.
 * Examples: 'Mod+KeyK', 'Slash', 'Shift+ArrowRight', 'KeyN', 'Digit1'.
 * Ignored while typing, composing (IME) or with a dialog open unless allowed.
 */
export function useShortcut(
    combo: string,
    handler: (event: KeyboardEvent) => void,
    options: ShortcutOptions = {},
): void {
    const {
        enabled = true,
        allowInFields = false,
        allowInDialogs = false,
    } = options;
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const parsed = parseCombo(combo);

        function onKeyDown(event: KeyboardEvent): void {
            if (event.isComposing || event.repeat) {
                return;
            }

            const mod = event.metaKey || event.ctrlKey;

            if (
                event.code !== parsed.code ||
                mod !== parsed.mod ||
                event.shiftKey !== parsed.shift ||
                event.altKey !== parsed.alt
            ) {
                return;
            }

            if (!allowInFields && isTypingTarget(event.target)) {
                return;
            }

            if (!allowInDialogs && isOverlayOpen()) {
                return;
            }

            handlerRef.current(event);
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [combo, enabled, allowInFields, allowInDialogs]);
}
