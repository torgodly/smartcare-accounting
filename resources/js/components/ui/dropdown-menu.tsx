import { CheckIcon, ChevronLeftIcon, CircleIcon } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const ITEM =
    "relative flex min-h-9 cursor-default items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[14px] leading-5 font-medium text-ink-1 outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:text-ink-4 data-[highlighted]:bg-surface-hover data-[variant=destructive]:text-bad-700 data-[variant=destructive]:data-[highlighted]:bg-bad-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-ink-3 data-[variant=destructive]:[&_svg]:text-bad-700";

function DropdownMenu(props: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" dir="rtl" {...props} />;
}

function DropdownMenuPortal(
    props: ComponentProps<typeof DropdownMenuPrimitive.Portal>,
) {
    return (
        <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
    );
}

function DropdownMenuTrigger(
    props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
    return (
        <DropdownMenuPrimitive.Trigger
            data-slot="dropdown-menu-trigger"
            {...props}
        />
    );
}

/**
 * Menu surface like a popover (radius 12, e3, padding 4).
 */
function DropdownMenuContent({
    className,
    sideOffset = 6,
    collisionPadding = 12,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                data-slot="dropdown-menu-content"
                dir="rtl"
                sideOffset={sideOffset}
                collisionPadding={collisionPadding}
                className={cn(
                    'anim-pop z-65 max-h-(--radix-dropdown-menu-content-available-height) min-w-[11rem] overflow-x-hidden overflow-y-auto rounded-[12px] bg-surface p-1 text-ink-1 shadow-e3 outline-none',
                    className,
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

function DropdownMenuGroup(
    props: ComponentProps<typeof DropdownMenuPrimitive.Group>,
) {
    return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

/**
 * Item h36 with a leading 16px icon; `variant="destructive"` is red. Use `asChild` for links.
 */
function DropdownMenuItem({
    className,
    inset,
    variant = 'default',
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
}) {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-inset={inset}
            data-variant={variant}
            className={cn(ITEM, inset && 'ps-8', className)}
            {...props}
        />
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            className={cn(ITEM, 'pe-8', className)}
            checked={checked}
            {...props}
        >
            <span className="pointer-events-none absolute end-2.5 flex size-4 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CheckIcon className="size-4 text-cyan-700" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuRadioGroup(
    props: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>,
) {
    return (
        <DropdownMenuPrimitive.RadioGroup
            data-slot="dropdown-menu-radio-group"
            {...props}
        />
    );
}

function DropdownMenuRadioItem({
    className,
    children,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
    return (
        <DropdownMenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            className={cn(ITEM, 'pe-8', className)}
            {...props}
        >
            <span className="pointer-events-none absolute end-2.5 flex size-4 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CircleIcon className="size-2 fill-current text-cyan-700" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    inset,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
    return (
        <DropdownMenuPrimitive.Label
            data-slot="dropdown-menu-label"
            data-inset={inset}
            className={cn('px-2.5 py-1.5 text-th text-ink-3', inset && 'ps-8', className)}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return (
        <DropdownMenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn('-mx-1 my-1 h-px bg-line-1', className)}
            {...props}
        />
    );
}

function DropdownMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={cn('ms-auto text-[12px] text-ink-3', className)}
            {...props}
        />
    );
}

function DropdownMenuSub(props: ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
    return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.SubTrigger
            data-slot="dropdown-menu-sub-trigger"
            data-inset={inset}
            className={cn(ITEM, 'data-[state=open]:bg-surface-hover', inset && 'ps-8', className)}
            {...props}
        >
            {children}
            <ChevronLeftIcon className="ms-auto size-4" />
        </DropdownMenuPrimitive.SubTrigger>
    );
}

function DropdownMenuSubContent({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
    return (
        <DropdownMenuPrimitive.SubContent
            data-slot="dropdown-menu-sub-content"
            className={cn(
                'anim-pop z-65 min-w-[8rem] overflow-hidden rounded-[12px] bg-surface p-1 text-ink-1 shadow-e3',
                className,
            )}
            {...props}
        />
    );
}

export {
    DropdownMenu,
    DropdownMenuPortal,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
};
