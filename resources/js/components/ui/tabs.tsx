import { m } from 'motion/react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { createContext, useContext, useId, useState } from 'react';
import type { ComponentProps } from 'react';
import { springSnappy } from '@/lib/motion';
import { cn } from '@/lib/utils';

const TabsContext = createContext<{ value: string | undefined; id: string }>({
    value: undefined,
    id: '',
});

/**
 * Radix Tabs (RTL) that tracks the active value for the sliding indicator.
 */
function Tabs({
    className,
    value,
    defaultValue,
    onValueChange,
    ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
    const id = useId();
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const current = value ?? uncontrolled;

    return (
        <TabsContext.Provider value={{ value: current, id }}>
            <TabsPrimitive.Root
                data-slot="tabs"
                dir="rtl"
                value={current}
                onValueChange={(next) => {
                    setUncontrolled(next);
                    onValueChange?.(next);
                }}
                className={cn('flex flex-col gap-4', className)}
                {...props}
            />
        </TabsContext.Provider>
    );
}

/**
 * Tab list: h44 with a bottom hairline, tabs 24px apart.
 */
function TabsList({
    className,
    ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                'flex h-11 items-stretch gap-6 overflow-x-auto border-b border-line-1',
                className,
            )}
            {...props}
        />
    );
}

/**
 * Tab 15/22 600; inactive ink-3, active ink-1 with a 2px cyan-700 indicator that slides.
 */
function TabsTrigger({
    className,
    value,
    children,
    ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
    const context = useContext(TabsContext);
    const active = context.value === value;

    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            value={value}
            className={cn(
                'relative inline-flex shrink-0 items-center gap-2 text-[15px] leading-[22px] font-semibold whitespace-nowrap text-ink-3 transition-colors duration-140 outline-offset-[-2px] hover:text-ink-2 disabled:pointer-events-none disabled:opacity-45 data-[state=active]:text-ink-1 [&_svg]:size-4',
                className,
            )}
            {...props}
        >
            {children}
            {active && (
                <m.span
                    aria-hidden
                    layoutId={`tabs-indicator-${context.id}`}
                    transition={springSnappy}
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-cyan-700"
                />
            )}
        </TabsPrimitive.Trigger>
    );
}

function TabsContent({
    className,
    ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            className={cn('flex-1 outline-none', className)}
            {...props}
        />
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
