import { Popover as PopoverPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
    return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger(props: ComponentProps<typeof PopoverPrimitive.Trigger>) {
    return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * Popover surface: white, radius 12, e3, padding 16, sideOffset 8, collisionPadding 12, RTL.
 */
function PopoverContent({
    className,
    align = 'center',
    sideOffset = 8,
    collisionPadding = 12,
    ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                data-slot="popover-content"
                dir="rtl"
                align={align}
                sideOffset={sideOffset}
                collisionPadding={collisionPadding}
                className={cn(
                    'anim-pop z-65 w-72 max-w-[calc(100vw-24px)] rounded-[12px] bg-surface p-4 text-ink-1 shadow-e3 outline-none',
                    className,
                )}
                {...props}
            />
        </PopoverPrimitive.Portal>
    );
}

function PopoverAnchor(props: ComponentProps<typeof PopoverPrimitive.Anchor>) {
    return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverHeader({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="popover-header"
            className={cn('flex flex-col gap-1', className)}
            {...props}
        />
    );
}

function PopoverTitle({ className, ...props }: ComponentProps<'h2'>) {
    return (
        <h2
            data-slot="popover-title"
            className={cn('text-title-3', className)}
            {...props}
        />
    );
}

function PopoverDescription({ className, ...props }: ComponentProps<'p'>) {
    return (
        <p
            data-slot="popover-description"
            className={cn('text-body-sm text-ink-3', className)}
            {...props}
        />
    );
}

export {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverAnchor,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
};
