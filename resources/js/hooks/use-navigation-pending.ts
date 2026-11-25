import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * True 150ms after a full (non-partial, non-prefetch) Inertia visit starts, until it finishes.
 * Used to dim the page while a month change is in flight.
 */
export function useNavigationPending(delay = 150): boolean {
    const [pending, setPending] = useState(false);

    useEffect(() => {
        let timer: number | undefined;

        const removeStart = router.on('start', (event) => {
            const visit = event.detail.visit;

            if (visit.prefetch || visit.only.length > 0 || visit.async) {
                return;
            }

            window.clearTimeout(timer);
            timer = window.setTimeout(() => setPending(true), delay);
        });

        const removeFinish = router.on('finish', () => {
            window.clearTimeout(timer);
            setPending(false);
        });

        return () => {
            window.clearTimeout(timer);
            removeStart();
            removeFinish();
        };
    }, [delay]);

    return pending;
}
