import type { Transition } from 'motion/react';

/** Durations in milliseconds (§5.1). */
export const durations = {
    press: 80,
    fast: 140,
    base: 200,
    enter: 260,
    exit: 160,
    number: 650,
    bar: 600,
} as const;

/** Cubic-bezier easings as motion arrays. */
export const easings = {
    out: [0.22, 1, 0.36, 1],
    in: [0.55, 0, 1, 0.45],
    inOut: [0.65, 0, 0.35, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/** The same easings as CSS strings. */
export const cssEasings = {
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    in: 'cubic-bezier(0.55, 0, 1, 0.45)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

/** Segmented thumb, tabs indicator and nav indicator. */
export const springSnappy: Transition = {
    type: 'spring',
    stiffness: 520,
    damping: 40,
    mass: 0.8,
};

/** Desktop side sheet. */
export const springSheet: Transition = {
    type: 'spring',
    stiffness: 380,
    damping: 38,
};

/** List stagger delay in seconds: 18ms per item, first 12 items only. */
export function staggerDelay(index: number): number {
    return Math.min(index, 12) * 0.018;
}
