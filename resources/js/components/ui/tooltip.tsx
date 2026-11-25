import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import { useCanHover } from '@/hooks/use-media';
import { cn } from '@/lib/utils';

/**
 * One provider at the root: 400ms delay, 150ms skip.
 */
function TooltipProvider({ children }: { children: ReactNode }) {
    return (
        <TooltipPrimitive.Provider delayDuration={400} skipDelayDuration={150}>
            {children}
        </TooltipPrimitive.Provider>
    );
}

/**
 * Inverse tooltip on pointer devices only (touch devices render the child alone).
 * The child must accept a ref and pointer events (wrap disabled buttons in a <span>).
 */
function Tooltip({
    content,
    children,
    side = 'top',
    align = 'center',
    disabled = false,
    className,
}: {
    content: ReactNode;
    children: ReactElement;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
    disabled?: boolean;
    className?: string;
}) {
    const canHover = useCanHover();

    if (!canHover || disabled || content === null || content === undefined) {
        return children;
    }

    return (
        <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    dir="rtl"
                    side={side}
                    align={align}
                    sideOffset={6}
                    collisionPadding={8}
                    className={cn(
                        'anim-tooltip z-90 max-w-60 rounded-sm bg-inverse px-2.5 py-1.5 text-[12.5px] leading-[18px] font-medium text-white',
                        className,
                    )}
                >
                    {content}
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );
}

export { Tooltip, TooltipProvider };
