import {
    CalendarCheck2,
    HandCoins,
    Landmark,
    LayoutGrid,
    ReceiptText,
    Wallet,
    WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { home } from '@/routes';
import { index as attendanceIndex } from '@/routes/attendance';
import { index as custodiesIndex } from '@/routes/custodies';
import { index as expensesIndex } from '@/routes/expenses';
import { index as purchasesIndex } from '@/routes/purchase-groups';
import { index as salariesIndex } from '@/routes/salaries';
import { index as treasuriesIndex } from '@/routes/treasuries';

export type NavItem = {
    key:
        | 'home'
        | 'salaries'
        | 'attendance'
        | 'purchases'
        | 'expenses'
        | 'custodies'
        | 'treasuries';
    label: string;
    icon: LucideIcon;
    href: (month: string) => string;
    match: (path: string) => boolean;
};

/** Main navigation; every link keeps ?month. */
export const NAV_ITEMS: NavItem[] = [
    {
        key: 'home',
        label: 'الرئيسية',
        icon: LayoutGrid,
        href: (month) => home.url({ query: { month } }),
        match: (path) => path === '/',
    },
    {
        key: 'salaries',
        label: 'الرواتب',
        icon: Wallet,
        href: (month) => salariesIndex.url({ query: { month } }),
        match: (path) => path.startsWith('/salaries'),
    },
    {
        key: 'attendance',
        label: 'الحضور',
        icon: CalendarCheck2,
        href: (month) => attendanceIndex.url({ query: { month } }),
        match: (path) => path.startsWith('/attendance'),
    },
    {
        key: 'purchases',
        label: 'المشتريات',
        icon: ReceiptText,
        href: (month) => purchasesIndex.url({ query: { month } }),
        match: (path) => path.startsWith('/purchases'),
    },
    {
        key: 'expenses',
        label: 'المصروفات',
        icon: WalletCards,
        href: (month) => expensesIndex.url({ query: { month } }),
        match: (path) => path.startsWith('/expenses'),
    },
    {
        key: 'custodies',
        label: 'العُهد',
        icon: HandCoins,
        href: (month) => custodiesIndex.url({ query: { month } }),
        match: (path) => path.startsWith('/custodies'),
    },
    {
        key: 'treasuries',
        label: 'الخزائن',
        icon: Landmark,
        href: (month) => treasuriesIndex.url({ query: { month } }),
        match: (path) => path.startsWith('/treasuries'),
    },
];

/** Path of an Inertia page URL ("/salaries?month=…" → "/salaries"). */
export function pathOf(url: string): string {
    return new URL(url, 'http://local').pathname;
}
