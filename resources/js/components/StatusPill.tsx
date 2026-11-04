import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const KINDS = {
    paid: { className: 'bg-ok-soft text-ok', label: 'مدفوع' },
    partial: { className: 'bg-warn-soft text-warn', label: 'مدفوع جزئياً' },
    unpaid: { className: 'bg-bad-soft text-bad', label: 'غير مدفوع' },
    not_started: { className: 'bg-sunk text-muted', label: 'لم يبدأ' },
    recurring: { className: 'bg-accent-soft text-accent', label: 'متكرر' },
    once: { className: 'bg-sunk text-muted', label: 'مرة واحدة' },
    no_receipt: { className: 'bg-warn-soft text-warn', label: 'بلا إيصال' },
    present: { className: 'bg-ok-soft text-ok', label: 'حاضر' },
    absent: { className: 'bg-bad-soft text-bad', label: 'غائب' },
    excuse: { className: 'bg-warn-soft text-warn', label: 'عذر' },
    leave: { className: 'bg-info-soft text-info', label: 'إجازة' },
    neutral: { className: 'bg-sunk text-muted', label: '' },
    accent: { className: 'bg-accent-soft text-accent', label: '' },
    warn: { className: 'bg-warn-soft text-warn', label: '' },
    bad: { className: 'bg-bad-soft text-bad', label: '' },
    ok: { className: 'bg-ok-soft text-ok', label: '' },
} as const;

export type PillKind = keyof typeof KINDS;

/**
 * Status pill: 12px, 600, 99px radius.
 */
export function StatusPill({
    kind,
    children,
    className,
}: {
    kind: PillKind;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-[9px] py-[2px] text-[12px] leading-[1.5] font-semibold whitespace-nowrap',
                KINDS[kind].className,
                className,
            )}
        >
            {children ?? KINDS[kind].label}
        </span>
    );
}
