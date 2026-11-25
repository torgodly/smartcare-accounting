import { toast as sonnerToast } from 'sonner';

type Toast = typeof sonnerToast;

/**
 * sonner's `toast` with the Quiet Ledger durations: 4s by default, 6s for errors.
 * Texts are passed through unchanged.
 */
export const toast: Toast = Object.assign(
    (...args: Parameters<Toast>) => sonnerToast(...args),
    sonnerToast,
    {
        error: ((message, data) =>
            sonnerToast.error(message, {
                duration: 6000,
                ...data,
            })) as Toast['error'],
    },
);
