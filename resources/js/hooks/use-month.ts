import { router, usePage } from '@inertiajs/react';
import { addMonths } from '@/lib/months';

/**
 * The global selected month (?month=YYYY-MM) and setters that reload the current page for it.
 * Changing the month drops `day` and keeps the scroll position.
 */
export function useMonth(): {
    month: string;
    currentMonth: string;
    today: string;
    setMonth: (next: string) => void;
    stepMonth: (delta: number) => void;
    goToCurrentMonth: () => void;
} {
    const page = usePage();
    const month = page.props.month;
    const currentMonth = page.props.currentMonth;

    function setMonth(next: string): void {
        const url = new URL(page.url, window.location.origin);
        url.searchParams.set('month', next);
        url.searchParams.delete('day');

        router.get(
            url.pathname,
            Object.fromEntries(url.searchParams.entries()),
            { preserveScroll: true },
        );
    }

    return {
        month,
        currentMonth,
        today: page.props.today,
        setMonth,
        stepMonth: (delta: number) => setMonth(addMonths(month, delta)),
        goToCurrentMonth: () => setMonth(currentMonth),
    };
}
