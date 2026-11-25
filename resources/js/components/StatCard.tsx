import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Count, Money } from '@/components/Money';
import { cn } from '@/lib/utils';

export type StatTone = 'default' | 'ok' | 'warn' | 'bad';
export type ProgressTone = 'ok' | 'warn' | 'bad' | 'accent';

const BAR_TONES: Record<ProgressTone, string> = {
    ok: 'bg-ok-500',
    warn: 'bg-warn-500',
    bad: 'bg-bad-500',
    accent: 'bg-cyan-600',
};

/**
 * Progress bar (h6, starts at inline-start). Animates its width over 600ms.
 */
export function ProgressBar({
    value,
    max,
    tone,
    track = 'sunken',
    label,
    className,
}: {
    value: number;
    max: number;
    tone: ProgressTone;
    track?: 'sunken' | 'amber';
    /** aria-label */
    label?: string;
    className?: string;
}) {
    const percent =
        max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={value}
            className={cn(
                'h-1.5 w-full overflow-hidden rounded-full',
                track === 'amber' ? 'bg-amber-100' : 'bg-sunken',
                className,
            )}
        >
            <div
                className={cn(
                    'progress-fill h-full rounded-full',
                    BAR_TONES[tone],
                )}
                style={{ inlineSize: `${percent}%` }}
            />
        </div>
    );
}

/**
 * KPI card: label (+icon, +pill) → big animated value → sub-line → optional progress.
 * `hero` spans 2 columns on desktop (full row on phone) with a logo watermark and a children slot.
 * Pages pass `tone` only when the value is non-zero (remaining > 0 → warn, deduction > 0 → bad).
 */
export function StatCard({
    label,
    value,
    format = 'money',
    icon: Icon,
    pill,
    sub,
    tone = 'default',
    progress,
    variant = 'default',
    animated = true,
    className,
    children,
}: {
    label: string;
    value: number;
    format?: 'money' | 'count';
    icon?: LucideIcon;
    pill?: ReactNode;
    sub?: ReactNode;
    tone?: StatTone;
    progress?: {
        value: number;
        max: number;
        tone: ProgressTone;
        label?: string;
    };
    variant?: 'default' | 'hero';
    animated?: boolean;
    className?: string;
    children?: ReactNode;
}) {
    const hero = variant === 'hero';
    const size = hero ? 'hero' : 'kpi';

    return (
        <div
            className={cn(
                'relative flex min-w-0 flex-col overflow-clip rounded-lg border border-line-1 bg-surface shadow-e1',
                hero
                    ? 'col-span-full gap-3 p-6 max-sm:p-5 lg:col-span-2'
                    : 'min-h-28 gap-2 px-[18px] py-4 max-sm:min-h-[100px] max-sm:p-3.5',
                className,
            )}
        >
            {hero && (
                <img
                    src="/img/logo-mark.svg"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute -end-6 -bottom-8 w-40 opacity-[0.06] select-none"
                />
            )}
            <div className="relative flex items-center gap-2">
                {Icon && (
                    <Icon aria-hidden className="size-4 shrink-0 text-ink-3" />
                )}
                <span
                    className={cn(
                        'min-w-0 flex-1 truncate',
                        hero
                            ? 'text-label text-ink-2'
                            : 'text-label-sm text-ink-3',
                    )}
                >
                    {label}
                </span>
                {pill && <span className="shrink-0">{pill}</span>}
            </div>
            <div className="relative">
                {format === 'money' ? (
                    <Money
                        value={value}
                        size={size}
                        tone={tone}
                        animated={animated}
                    />
                ) : (
                    <Count
                        value={value}
                        size={size}
                        tone={tone}
                        animated={animated}
                    />
                )}
            </div>
            {sub && (
                <div className="relative text-caption text-ink-3">{sub}</div>
            )}
            {progress && (
                <ProgressBar
                    className="relative mt-auto"
                    value={progress.value}
                    max={progress.max}
                    tone={progress.tone}
                    label={progress.label}
                />
            )}
            {children && <div className="relative">{children}</div>}
        </div>
    );
}

/**
 * KPI grid: auto-fit minmax(200px, 1fr), gap 16; phone 2 columns, gap 10.
 */
export function StatGrid({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 max-sm:grid-cols-2 max-sm:gap-2.5',
                className,
            )}
        >
            {children}
        </div>
    );
}
