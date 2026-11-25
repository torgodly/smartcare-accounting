import { useSyncExternalStore } from 'react';

function subscribeTo(query: string) {
    return (onChange: () => void): (() => void) => {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return () => undefined;
        }

        const list = window.matchMedia(query);
        list.addEventListener('change', onChange);

        return () => list.removeEventListener('change', onChange);
    };
}

/**
 * Live result of a CSS media query (false during SSR).
 */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        subscribeTo(query),
        () =>
            typeof window !== 'undefined' && window.matchMedia
                ? window.matchMedia(query).matches
                : false,
        () => false,
    );
}

/** Phone layout: viewport narrower than 640px. */
export function useIsPhone(): boolean {
    return useMediaQuery('(max-width: 639.98px)');
}

/** Desktop shell: viewport at least 1024px wide. */
export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 1024px)');
}

/** A fine pointer that can hover (tooltips, hover-only affordances). */
export function useCanHover(): boolean {
    return useMediaQuery('(hover: hover) and (pointer: fine)');
}
