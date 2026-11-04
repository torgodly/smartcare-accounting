import { router, usePage } from '@inertiajs/react';

/**
 * The global selected month (?month=YYYY-MM) and a setter that reloads the current page for it.
 */
export function useMonth() {
    const page = usePage();
    const month = page.props.month;

    function setMonth(next: string) {
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
        currentMonth: page.props.currentMonth,
        today: page.props.today,
        setMonth,
    };
}
