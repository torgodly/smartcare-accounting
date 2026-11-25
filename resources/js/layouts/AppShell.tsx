import { Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { destroy as logout } from '@/actions/App/Http/Controllers/LoginController';
import { MonthPicker } from '@/components/MonthPicker';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Toaster } from '@/components/ui/sonner';
import { useMonth } from '@/hooks/use-month';
import { addMonths } from '@/lib/months';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { index as attendanceIndex } from '@/routes/attendance';
import { index as custodiesIndex } from '@/routes/custodies';
import { index as expensesIndex } from '@/routes/expenses';
import { index as purchasesIndex } from '@/routes/purchase-groups';
import { update as updateRegion } from '@/routes/region';
import { index as salariesIndex } from '@/routes/salaries';
import { index as treasuriesIndex } from '@/routes/treasuries';
import { index as usersIndex } from '@/routes/users';
import type { RegionFilter } from '@/types';

const NAV = [
    { label: 'الرئيسية', route: home, match: (path: string) => path === '/' },
    {
        label: 'الرواتب',
        route: salariesIndex,
        match: (path: string) => path.startsWith('/salaries'),
    },
    {
        label: 'الحضور',
        route: attendanceIndex,
        match: (path: string) => path.startsWith('/attendance'),
    },
    {
        label: 'المشتريات',
        route: purchasesIndex,
        match: (path: string) => path.startsWith('/purchases'),
    },
    {
        label: 'المصروفات',
        route: expensesIndex,
        match: (path: string) => path.startsWith('/expenses'),
    },
    {
        label: 'العُهد',
        route: custodiesIndex,
        match: (path: string) => path.startsWith('/custodies'),
    },
    {
        label: 'الخزائن',
        route: treasuriesIndex,
        match: (path: string) => path.startsWith('/treasuries'),
    },
];

/**
 * East / West / all switcher; the choice is kept in the session and every page reloads for it.
 */
function RegionSwitcher() {
    const { region, regions, auth } = usePage().props;

    // Regional accounts are locked to their region: show it, no switching.
    if (auth.user && !auth.user.is_admin) {
        const label =
            regions.find((option) => option.value === region)?.label ?? '';

        return (
            <span className="inline-flex h-7 items-center rounded-full bg-accent-soft px-3 text-[13px] font-semibold text-accent">
                منطقة {label}
            </span>
        );
    }

    function change(next: RegionFilter) {
        if (next === region) {
            return;
        }

        router.put(
            updateRegion.url(),
            { region: next },
            { preserveScroll: true },
        );
    }

    return (
        <SegmentedControl<RegionFilter>
            ariaLabel="المنطقة"
            size="sm"
            value={region}
            onChange={change}
            options={[
                { value: 'all', label: 'الكل' },
                ...regions.map((option) => ({
                    value: option.value as RegionFilter,
                    label: option.label,
                })),
            ]}
        />
    );
}

/**
 * Shows flash messages from the server as toasts.
 */
export function useFlashToasts() {
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = event.detail.flash;

            if (flash.success) {
                toast(flash.success);
            }

            if (flash.error) {
                toast(`لم يتم الحفظ: ${flash.error}`);
            }
        });
    }, []);
}

/**
 * The app shell: sticky top bar with brand, nav, month selector and user.
 */
export default function AppShell({ children }: { children: ReactNode }) {
    const page = usePage();
    const { month, currentMonth, setMonth } = useMonth();
    const path = new URL(page.url, 'http://local').pathname;
    const user = page.props.auth.user;
    const navRef = useRef<HTMLElement>(null);

    useFlashToasts();

    // On phones the nav scrolls sideways; bring the current page's link into view.
    useEffect(() => {
        navRef.current
            ?.querySelector('[aria-current="page"]')
            ?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }, [path]);

    return (
        <div className="min-h-screen bg-bg">
            <header className="sticky top-0 z-40 bg-surface">
                <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
                    <Link
                        href={home.url({ query: { month } })}
                        className="order-1 flex shrink-0 items-center gap-2.5"
                    >
                        <img
                            src="/img/logo-mark.svg"
                            alt=""
                            className="h-7 w-auto"
                        />
                        <span className="flex flex-col leading-tight">
                            <span className="font-display text-[18px] font-bold">
                                الرعاية الذكية
                            </span>
                            <span className="text-[11.5px] text-gold-ink">
                                نظام المحاسبة
                            </span>
                        </span>
                    </Link>

                    <nav
                        ref={navRef}
                        aria-label="التنقل الرئيسي"
                        className="order-4 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto"
                    >
                        {[
                            ...NAV,
                            ...(user?.is_admin
                                ? [
                                      {
                                          label: 'المستخدمون',
                                          route: usersIndex,
                                          match: (current: string) =>
                                              current.startsWith('/users'),
                                      },
                                  ]
                                : []),
                        ].map((item) => {
                            const active = item.match(path);

                            return (
                                <Link
                                    key={item.label}
                                    href={item.route.url({ query: { month } })}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'rounded-full px-3.5 py-1.5 text-[14px] font-semibold whitespace-nowrap transition-colors',
                                        active
                                            ? 'bg-accent-soft text-accent'
                                            : 'text-muted hover:bg-sunk hover:text-ink',
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="order-3 sm:ms-auto">
                        <RegionSwitcher />
                    </div>

                    <div className="order-3 flex items-center gap-0.5 rounded-full bg-sunk p-1">
                        <button
                            type="button"
                            onClick={() => setMonth(addMonths(month, -1))}
                            className="flex size-8 items-center justify-center rounded-full hover:bg-surface"
                            aria-label="الشهر السابق"
                        >
                            <ChevronRight className="size-[18px]" />
                        </button>
                        <MonthPicker
                            month={month}
                            currentMonth={currentMonth}
                            onSelect={setMonth}
                        />
                        <button
                            type="button"
                            onClick={() => setMonth(addMonths(month, 1))}
                            className="flex size-8 items-center justify-center rounded-full hover:bg-surface"
                            aria-label="الشهر التالي"
                        >
                            <ChevronLeft className="size-[18px]" />
                        </button>
                    </div>

                    <div className="order-2 ms-auto flex items-center gap-2 sm:order-4 sm:ms-0">
                        {user && (
                            <span className="hidden text-[13px] text-muted sm:inline">
                                {user.name}
                            </span>
                        )}
                        <Link
                            href={logout()}
                            as="button"
                            className="h-8 rounded-md px-3 text-[13px] font-semibold text-ink hover:bg-sunk"
                        >
                            تسجيل الخروج
                        </Link>
                    </div>
                </div>
                <div className="flex h-[3px]" aria-hidden>
                    <div className="w-[60%] bg-brand" />
                    <div className="flex-1 bg-gold" />
                </div>
            </header>

            <main className="mx-auto max-w-[1180px] px-4 py-6 sm:py-8">
                {children}
            </main>

            <Toaster />
        </div>
    );
}

/**
 * Page title, description and actions on the end.
 */
export function PageHeader({
    title,
    description,
    actions,
    breadcrumb,
}: {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    breadcrumb?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl min-w-0">
                {breadcrumb}
                <h1 className="font-display text-[28px] leading-tight font-semibold">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1.5 text-[14px] text-muted">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
