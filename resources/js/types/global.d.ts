import type { Auth } from '@/types/auth';
import type {
    Option,
    PaymentMethod,
    Region,
    RegionFilter,
} from '@/types/models';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            month: string;
            currentMonth: string;
            today: string;
            region: RegionFilter;
            regions: Option<Region>[];
            paymentMethods: Option<PaymentMethod>[];
            settings: { work_start: string; work_end: string } | null;
            [key: string]: unknown;
        };
        flashDataType: {
            success?: string;
            error?: string;
        };
    }
}
