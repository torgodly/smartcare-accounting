import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            month: string;
            currentMonth: string;
            today: string;
            settings: { work_start: string; work_end: string } | null;
            [key: string]: unknown;
        };
        flashDataType: {
            success?: string;
            error?: string;
        };
    }
}
