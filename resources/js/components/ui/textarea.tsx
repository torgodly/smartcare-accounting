import { useLayoutEffect, useRef } from 'react';
import type { ComponentProps, Ref } from 'react';
import { cn } from '@/lib/utils';

const LINE = 24;
const CHROME = 22;

/**
 * Textarea: min-h 88, padding 10/12, resizes vertically. `autoGrow` grows with the text
 * between minRows and maxRows.
 */
function Textarea({
    className,
    autoGrow,
    ref,
    ...props
}: ComponentProps<'textarea'> & {
    autoGrow?: { minRows: number; maxRows: number };
}) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const minRows = autoGrow?.minRows;
    const maxRows = autoGrow?.maxRows;

    useLayoutEffect(() => {
        const element = innerRef.current;

        if (!element || minRows === undefined || maxRows === undefined) {
            return;
        }

        const min = minRows * LINE + CHROME;
        const max = maxRows * LINE + CHROME;
        element.style.height = 'auto';
        const wanted = element.scrollHeight + 2;
        element.style.height = `${Math.min(max, Math.max(min, wanted))}px`;
        element.style.overflowY = wanted > max ? 'auto' : 'hidden';
    }, [props.value, minRows, maxRows]);

    function setRef(element: HTMLTextAreaElement | null): void {
        innerRef.current = element;

        if (typeof ref === 'function') {
            ref(element);
        } else if (ref) {
            (ref as { current: HTMLTextAreaElement | null }).current = element;
        }
    }

    return (
        <textarea
            ref={setRef as Ref<HTMLTextAreaElement>}
            data-slot="textarea"
            className={cn(
                'field-box block min-h-[88px] px-3 py-2.5 text-[15px] leading-6',
                autoGrow ? 'resize-none' : 'resize-y',
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
