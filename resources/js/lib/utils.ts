import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge that knows the Quiet Ledger scales, so `text-title-1` is a font size
 * (not a color) and `shadow-e2` replaces `shadow-e1`.
 */
const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: [
                'display',
                'title-1',
                'title-2',
                'title-3',
                'body-lg',
                'body',
                'body-strong',
                'body-sm',
                'label',
                'label-sm',
                'caption',
                'th',
                'pill',
                'tab-label',
                'serial',
                'kbd',
            ],
            shadow: ['e1', 'e2', 'e3', 'e4', 'edge-start'],
        },
    },
});

/**
 * Join class names and resolve Tailwind conflicts (the last one wins).
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
