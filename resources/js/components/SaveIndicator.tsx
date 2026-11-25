import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type SaveState = 'idle' | 'pending' | 'saved' | 'error';

/**
 * Row save state: a pulsing dot while saving, a check that fades after 1.2s when saved,
 * nothing on error (the value reverts and a toast explains).
 */
export function SaveIndicator({
    state,
    className,
}: {
    state: SaveState;
    className?: string;
}) {
    const [showSaved, setShowSaved] = useState(false);
    const [previous, setPrevious] = useState(state);

    if (state !== previous) {
        setPrevious(state);
        setShowSaved(state === 'saved');
    }

    useEffect(() => {
        if (!showSaved) {
            return;
        }

        const timer = window.setTimeout(() => setShowSaved(false), 1200);

        return () => window.clearTimeout(timer);
    }, [showSaved]);

    return (
        <span
            aria-hidden
            className={cn(
                'inline-flex size-3.5 shrink-0 items-center justify-center',
                className,
            )}
        >
            {state === 'pending' && (
                <span className="size-1.5 animate-pulse-dot rounded-full bg-cyan-600" />
            )}
            {state === 'saved' && (
                <Check
                    className={cn(
                        'size-3.5 text-ok-700 transition-opacity duration-300',
                        showSaved ? 'opacity-100' : 'opacity-0',
                    )}
                />
            )}
        </span>
    );
}
