import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

function Select(props: ComponentProps<typeof SelectPrimitive.Root>) {
    return <SelectPrimitive.Root data-slot="select" dir="rtl" {...props} />;
}

function SelectGroup(props: ComponentProps<typeof SelectPrimitive.Group>) {
    return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue(props: ComponentProps<typeof SelectPrimitive.Value>) {
    return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

/**
 * Trigger in the Input box; the chevron flips while open.
 */
function SelectTrigger({
    className,
    size = 'default',
    children,
    ...props
}: ComponentProps<typeof SelectPrimitive.Trigger> & {
    size?: 'sm' | 'default';
}) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            data-size={size}
            className={cn(
                'group/select field-box flex items-center justify-between gap-2 px-3 text-start text-[15px] leading-6 whitespace-nowrap data-[placeholder]:text-ink-3 data-[size=default]:h-10 data-[size=default]:max-sm:h-11 data-[size=sm]:h-9 data-[size=sm]:text-[14px] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2',
                className,
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDownIcon className="size-4 shrink-0 text-ink-3 transition-transform duration-140 group-data-[state=open]/select:rotate-180" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

/**
 * Popper content: white, radius 12, e3, padding 4, max-h 320, min width = trigger.
 */
function SelectContent({
    className,
    children,
    position = 'popper',
    align = 'start',
    sideOffset = 6,
    ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                data-slot="select-content"
                dir="rtl"
                className={cn(
                    'anim-pop relative z-65 max-h-[min(320px,var(--radix-select-content-available-height))] min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-[12px] bg-surface text-ink-1 shadow-e3',
                    position === 'popper' &&
                        'w-full min-w-[var(--radix-select-trigger-width)]',
                    className,
                )}
                position={position}
                align={align}
                sideOffset={position === 'popper' ? sideOffset : undefined}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport className="p-1">
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

function SelectLabel({
    className,
    ...props
}: ComponentProps<typeof SelectPrimitive.Label>) {
    return (
        <SelectPrimitive.Label
            data-slot="select-label"
            className={cn('px-2.5 py-1.5 text-th text-ink-3', className)}
            {...props}
        />
    );
}

/**
 * Item h36, radius 8; highlighted surface-hover; selected cyan-700 with a check at inline-end.
 * `description` adds a caption sub-line (e.g. the employee shift).
 */
function SelectItem({
    className,
    children,
    description,
    ...props
}: ComponentProps<typeof SelectPrimitive.Item> & { description?: ReactNode }) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                'relative flex min-h-9 w-full cursor-default flex-col items-start justify-center rounded-sm py-1.5 ps-2.5 pe-8 text-[14px] leading-5 font-medium outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:text-ink-4 data-[highlighted]:bg-surface-hover data-[state=checked]:font-semibold data-[state=checked]:text-cyan-700',
                className,
            )}
            {...props}
        >
            <span
                data-slot="select-item-indicator"
                className="absolute end-2.5 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center"
            >
                <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="size-4" />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
            {description && (
                <span className="text-caption font-normal text-ink-3">
                    {description}
                </span>
            )}
        </SelectPrimitive.Item>
    );
}

function SelectSeparator({
    className,
    ...props
}: ComponentProps<typeof SelectPrimitive.Separator>) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn('pointer-events-none -mx-1 my-1 h-px bg-line-1', className)}
            {...props}
        />
    );
}

function SelectScrollUpButton({
    className,
    ...props
}: ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
    return (
        <SelectPrimitive.ScrollUpButton
            data-slot="select-scroll-up-button"
            className={cn(
                'flex cursor-default items-center justify-center py-1 text-ink-3',
                className,
            )}
            {...props}
        >
            <ChevronUpIcon className="size-4" />
        </SelectPrimitive.ScrollUpButton>
    );
}

function SelectScrollDownButton({
    className,
    ...props
}: ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
    return (
        <SelectPrimitive.ScrollDownButton
            data-slot="select-scroll-down-button"
            className={cn(
                'flex cursor-default items-center justify-center py-1 text-ink-3',
                className,
            )}
            {...props}
        >
            <ChevronDownIcon className="size-4" />
        </SelectPrimitive.ScrollDownButton>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
