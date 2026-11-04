import { createInertiaApp } from '@inertiajs/react';

const appName = 'الرعاية الذكية · نظام المحاسبة';

void createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    progress: {
        color: '#0779a6',
    },
});
