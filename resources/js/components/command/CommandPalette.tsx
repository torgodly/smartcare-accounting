import { router, usePage } from '@inertiajs/react';
import { Command as Cmdk } from 'cmdk';
import {
    CalendarClock,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { destroy as logout } from '@/actions/App/Http/Controllers/LoginController';
import { Kbd } from '@/components/Kbd';
import { BottomSheet } from '@/components/ResponsiveDialog';
import { useCommandPalette, useRegisteredCommands } from '@/hooks/use-commands';
import type { Command } from '@/hooks/use-commands';
import { useIsPhone } from '@/hooks/use-media';
import { useMonth } from '@/hooks/use-month';
import { NAV_ITEMS } from '@/layouts/navigation';
import { normalizeArabic } from '@/lib/arabic';
import { monthLabel, parseMonthQuery, splitMonth } from '@/lib/months';
import { cn } from '@/lib/utils';

/**
 * cmdk filter: Arabic-normalized, case-insensitive substring match over the label and keywords.
 */
function arabicFilter(
    value: string,
    search: string,
    keywords?: string[],
): number {
    const query = normalizeArabic(search);

    if (query === '') {
        return 1;
    }

    const haystack = normalizeArabic([value, ...(keywords ?? [])].join(' '));

    return haystack.includes(query) ? 1 : 0;
}

type PaletteItem = {
    id: string;
    label: string;
    icon?: LucideIcon;
    meta?: ReactNode;
    shortcut?: string;
    keywords?: string[];
    disabled?: boolean;
    forceMount?: boolean;
    onSelect: () => void;
};

function PaletteGroup({
    heading,
    items,
    onRun,
}: {
    heading: string;
    items: PaletteItem[];
    onRun: (item: PaletteItem) => void;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <Cmdk.Group
            heading={heading}
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-th [&_[cmdk-group-heading]]:text-ink-3"
        >
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <Cmdk.Item
                        key={item.id}
                        value={item.id}
                        keywords={[item.label, ...(item.keywords ?? [])]}
                        disabled={item.disabled}
                        forceMount={item.forceMount}
                        onSelect={() => onRun(item)}
                        className="group/item flex h-11 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[14px] leading-5 font-medium text-ink-1 select-none data-[disabled=true]:cursor-default data-[disabled=true]:text-ink-4 data-[selected=true]:bg-selected"
                    >
                        {Icon && (
                            <Icon
                                aria-hidden
                                className="size-[18px] shrink-0 text-ink-3 group-data-[selected=true]/item:text-cyan-700"
                            />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                            {item.label}
                        </span>
                        {item.meta && (
                            <span className="shrink-0 text-[12.5px] text-ink-3">
                                {item.meta}
                            </span>
                        )}
                        {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                    </Cmdk.Item>
                );
            })}
        </Cmdk.Group>
    );
}

function fromCommand(command: Command): PaletteItem {
    return {
        id: `cmd-${command.id}`,
        label: command.label,
        icon: command.icon,
        meta: command.meta,
        shortcut: command.shortcut,
        keywords: command.keywords,
        disabled: command.disabled,
        onSelect: command.onSelect,
    };
}

/**
 * The palette body: input, grouped results and the hint footer.
 */
function PaletteBody({
    onRun,
    inputRef,
}: {
    onRun: (item: PaletteItem) => void;
    inputRef: RefObject<HTMLInputElement | null>;
}) {
    const page = usePage();
    const { month, currentMonth, setMonth, stepMonth } = useMonth();
    const commands = useRegisteredCommands();
    const [search, setSearch] = useState('');
    const year = splitMonth(currentMonth)[0];

    const navigation: PaletteItem[] = NAV_ITEMS.map((item) => ({
        id: `nav-${item.key}`,
        label: item.label,
        icon: item.icon,
        onSelect: () => router.visit(item.href(month)),
    }));

    const monthItems: PaletteItem[] = [
        {
            id: 'month-previous',
            label: 'الشهر السابق',
            icon: ChevronRight,
            onSelect: () => stepMonth(-1),
        },
        {
            id: 'month-next',
            label: 'الشهر التالي',
            icon: ChevronLeft,
            onSelect: () => stepMonth(1),
        },
        {
            id: 'month-current',
            label: 'الشهر الحالي',
            icon: CalendarClock,
            meta: monthLabel(currentMonth),
            disabled: month === currentMonth,
            onSelect: () => setMonth(currentMonth),
        },
        ...parseMonthQuery(search, year).map((target) => ({
            id: `month-go-${target}`,
            label: `الانتقال إلى ${monthLabel(target)}`,
            icon: CalendarDays,
            forceMount: true,
            onSelect: () => setMonth(target),
        })),
    ];

    const actions = commands
        .filter((command) => command.group === 'actions')
        .map(fromCommand);

    const recordGroups = new Map<string, PaletteItem[]>();

    for (const command of commands) {
        if (command.group !== 'records') {
            continue;
        }

        const heading = command.recordsLabel ?? '';
        recordGroups.set(heading, [
            ...(recordGroups.get(heading) ?? []),
            fromCommand(command),
        ]);
    }

    const account: PaletteItem[] = page.props.auth.user
        ? [
              {
                  id: 'account-logout',
                  label: 'تسجيل الخروج',
                  icon: LogOut,
                  onSelect: () => router.visit(logout()),
              },
          ]
        : [];

    return (
        <Cmdk
            filter={arabicFilter}
            loop
            label="بحث سريع"
            className="flex min-h-0 flex-1 flex-col"
        >
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line-1 px-4">
                <Search aria-hidden className="size-5 shrink-0 text-ink-3" />
                <Cmdk.Input
                    ref={inputRef}
                    value={search}
                    onValueChange={setSearch}
                    placeholder="ابحث عن صفحة أو موظف أو فاتورة أو إجراء…"
                    className="h-full min-w-0 flex-1 bg-transparent text-[16px] leading-6 text-ink-1 outline-none placeholder:text-ink-3"
                />
                <Kbd>Esc</Kbd>
            </div>
            <Cmdk.List className="max-h-[400px] min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 max-sm:max-h-none">
                <Cmdk.Empty className="px-3 py-8 text-center text-body-sm text-ink-3">
                    لا توجد نتائج
                </Cmdk.Empty>
                <PaletteGroup
                    heading="التنقل"
                    items={navigation}
                    onRun={onRun}
                />
                <PaletteGroup
                    heading="الشهر"
                    items={monthItems}
                    onRun={onRun}
                />
                <PaletteGroup heading="إجراءات" items={actions} onRun={onRun} />
                {Array.from(recordGroups.entries()).map(([heading, items]) => (
                    <PaletteGroup
                        key={heading}
                        heading={heading}
                        items={items}
                        onRun={onRun}
                    />
                ))}
                <PaletteGroup heading="الحساب" items={account} onRun={onRun} />
            </Cmdk.List>
            <div className="flex h-9 shrink-0 items-center border-t border-line-1 bg-surface-2 px-4 text-[12px] leading-4 text-ink-3 max-sm:hidden">
                ↑↓ للتنقل · ↵ للفتح · Esc للإغلاق
            </div>
        </Cmdk>
    );
}

/**
 * Command palette (⌘K / Ctrl K, «/», the sidebar «بحث سريع» button). Desktop dialog 600 wide
 * at 14vh; phone full-height bottom sheet. Groups: التنقل · الشهر · إجراءات · records · الحساب.
 */
export function CommandPalette() {
    const { isOpen, close } = useCommandPalette();
    const isPhone = useIsPhone();
    const inputRef = useRef<HTMLInputElement>(null);

    function run(item: PaletteItem): void {
        if (item.disabled) {
            return;
        }

        close();
        // Let the dialog close (and restore focus) before navigating or opening another dialog.
        window.setTimeout(item.onSelect, 0);
    }

    const body = <PaletteBody onRun={run} inputRef={inputRef} />;

    if (isPhone) {
        return (
            <BottomSheet
                open={isOpen}
                onOpenChange={(open) => !open && close()}
                title="بحث سريع"
                hideHeader
                layer="palette"
                fullHeight
                initialFocus={inputRef}
                bodyClassName="flex flex-col p-0"
            >
                {isOpen && body}
            </BottomSheet>
        );
    }

    return (
        <DialogPrimitive.Root
            open={isOpen}
            onOpenChange={(open) => !open && close()}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-70 bg-scrim backdrop-blur-[2px]" />
                <DialogPrimitive.Content
                    dir="rtl"
                    aria-describedby={undefined}
                    className={cn(
                        'anim-palette fixed inset-x-0 top-[14vh] z-70 mx-auto flex max-h-[calc(86vh-24px)] w-[calc(100%-32px)] max-w-[600px] flex-col overflow-clip rounded-xl bg-surface text-ink-1 shadow-e4 outline-none',
                    )}
                >
                    <DialogPrimitive.Title className="sr-only">
                        بحث سريع
                    </DialogPrimitive.Title>
                    {body}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
