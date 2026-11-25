import { ImageOff, Repeat } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatNumber } from '@/lib/money';
import { cn } from '@/lib/utils';

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'accent';

const TONES: Record<Tone, { pill: string; dot: string }> = {
    ok: { pill: 'bg-ok-50 text-ok-700', dot: 'bg-ok-500' },
    warn: { pill: 'bg-warn-50 text-warn-700', dot: 'bg-warn-500' },
    bad: { pill: 'bg-bad-50 text-bad-700', dot: 'bg-bad-500' },
    info: { pill: 'bg-info-50 text-info-700', dot: 'bg-info-500' },
    neutral: { pill: 'bg-neutral-50 text-ink-2', dot: 'bg-ink-4' },
    accent: { pill: 'bg-cyan-50 text-cyan-700', dot: 'bg-cyan-600' },
};

type Leading = 'dot' | 'hollow' | 'repeat' | 'image-off' | 'none';

const KINDS = {
    paid: { tone: 'ok', leading: 'dot', label: 'مدفوع' },
    partial: { tone: 'warn', leading: 'dot', label: 'مدفوع جزئياً' },
    unpaid: { tone: 'bad', leading: 'dot', label: 'غير مدفوع' },
    not_started: { tone: 'neutral', leading: 'hollow', label: 'لم يبدأ' },
    recurring: { tone: 'accent', leading: 'repeat', label: 'متكرر' },
    once: { tone: 'neutral', leading: 'none', label: 'مرة واحدة' },
    no_receipt: { tone: 'warn', leading: 'image-off', label: 'بلا إيصال' },
    present: { tone: 'ok', leading: 'dot', label: 'حاضر' },
    absent: { tone: 'bad', leading: 'dot', label: 'غائب' },
    excuse: { tone: 'warn', leading: 'dot', label: 'عذر' },
    leave: { tone: 'info', leading: 'dot', label: 'إجازة' },
    neutral: { tone: 'neutral', leading: 'none', label: '' },
    accent: { tone: 'accent', leading: 'none', label: '' },
    ok: { tone: 'ok', leading: 'none', label: '' },
    warn: { tone: 'warn', leading: 'none', label: '' },
    bad: { tone: 'bad', leading: 'none', label: '' },
    info: { tone: 'info', leading: 'none', label: '' },
} as const satisfies Record<
    string,
    { tone: Tone; leading: Leading; label: string }
>;

export type PillKind = keyof typeof KINDS;

/**
 * Soft status pill: -50 background, -700 text, -500 dot. Status kinds carry their fixed
 * Arabic label; tone kinds (neutral / accent / ok / warn / bad / info) show `children`.
 */
export function StatusPill({
    kind,
    size = 'sm',
    children,
    className,
}: {
    kind: PillKind;
    /** sm h22 · lg h26. */
    size?: 'sm' | 'lg';
    children?: ReactNode;
    className?: string;
}) {
    const { tone, leading, label } = KINDS[kind];
    const colors = TONES[tone];

    return (
        <span
            data-kind={kind}
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors duration-140',
                size === 'sm'
                    ? 'h-[22px] px-2 text-[12px] leading-4'
                    : 'h-[26px] px-2.5 text-[13px] leading-[18px]',
                colors.pill,
                leading === 'hollow' && 'border border-dashed border-line-2',
                className,
            )}
        >
            {leading === 'dot' && (
                <span
                    aria-hidden
                    className={cn('size-1.5 shrink-0 rounded-full', colors.dot)}
                />
            )}
            {leading === 'hollow' && (
                <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full border-[1.5px] border-ink-4"
                />
            )}
            {leading === 'repeat' && (
                <Repeat aria-hidden className="size-3 shrink-0" />
            )}
            {leading === 'image-off' && (
                <ImageOff aria-hidden className="size-3 shrink-0" />
            )}
            {children ?? label}
        </span>
    );
}

/**
 * Small numeric badge (h18): neutral sunken / ink-2, or bad solid red with white text.
 */
export function CounterBadge({
    value,
    tone = 'neutral',
    className,
}: {
    value: number;
    tone?: 'neutral' | 'bad';
    className?: string;
}) {
    return (
        <span
            className={cn(
                'num inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[11px] leading-[14px] font-bold',
                tone === 'bad'
                    ? 'bg-bad-700 text-white'
                    : 'bg-sunken text-ink-2',
                className,
            )}
        >
            {formatNumber(value)}
        </span>
    );
}
