import { Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { destroy as logout } from '@/actions/App/Http/Controllers/LoginController';
import { MonthPicker } from '@/components/MonthPicker';
import { Toaster } from '@/components/ui/sonner';
import { useMonth } from '@/hooks/use-month';
import { addMonths } from '@/lib/months';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { index as attendanceIndex } from '@/routes/attendance';
import { index as purchasesIndex } from '@/routes/purchase-groups';
import { index as salariesIndex } from '@/routes/salaries';

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
];

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

    useFlashToasts();

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
                        aria-label="التنقل الرئيسي"
                        className="order-4 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto"
                    >
                        {NAV.map((item) => {
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

                    <div className="order-3 flex items-center gap-0.5 rounded-full bg-sunk p-1 sm:ms-auto">
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
