import NumberFlow from '@number-flow/react';
import { formatNumber } from '@/lib/money';
import { cn } from '@/lib/utils';

/** Money scale (§3.2): number px / weight, phone overrides in CSS. */
const SIZES = {
    hero: 'money-hero',
    dialog: 'money-dialog',
    kpi: 'money-kpi',
    card: 'money-card',
    footer: 'money-footer',
    'cell-strong': 'money-cell-strong',
    cell: 'money-cell',
    inline: 'money-inline',
    tile: 'money-tile',
    input: 'money-field',
} as const;

export type MoneySize = keyof typeof SIZES;

/** Legacy size names mapped to the new scale (removed in the cleanup pass). */
type LegacyMoneySize =
    | 'summary'
    | 'counter'
    | 'breakdown'
    | 'total'
    | 'month'
    | 'base';

const LEGACY_SIZES: Record<LegacyMoneySize, MoneySize> = {
    summary: 'kpi',
    counter: 'kpi',
    breakdown: 'card',
    total: 'dialog',
    month: 'cell-strong',
    base: 'cell',
};

const TONES = {
    default: 'text-ink-1',
    ok: 'text-ok-700',
    warn: 'text-warn-700',
    bad: 'text-bad-700',
    muted: 'text-ink-3',
    inherit: 'text-inherit',
} as const;

export type MoneyTone = keyof typeof TONES;

const NUMBER_FLOW_TIMING = {
    duration: 650,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
};

function resolveSize(size: MoneySize | LegacyMoneySize): MoneySize {
    return size in LEGACY_SIZES
        ? LEGACY_SIZES[size as LegacyMoneySize]
        : (size as MoneySize);
}

/**
 * The number itself: plain formatted text, or a rolling NumberFlow when animated.
 */
function NumberText({
    value,
    sign,
    animated,
}: {
    value: number;
    sign?: '+' | '−';
    animated: boolean;
}) {
    if (animated) {
        return (
            <NumberFlow
                value={Number.isFinite(value) ? value : 0}
                locales="en-US"
                format={{ maximumFractionDigits: 2 }}
                prefix={sign}
                willChange
                transformTiming={NUMBER_FLOW_TIMING}
                spinTiming={NUMBER_FLOW_TIMING}
                respectMotionPreference
            />
        );
    }

    return (
        <>
            {sign}
            {formatNumber(value)}
        </>
    );
}

/**
 * A money amount: tabular number followed by a small muted «د.ل».
 * `animated` rolls the digits (StatCards, hero, footers, breakdowns); never in table body cells.
 * Signs: '+' for bonus, '−' (U+2212) for deductions.
 */
export function Money({
    value,
    size = 'cell',
    tone = 'default',
    sign,
    hideCurrency = false,
    animated = false,
    className,
}: {
    value: number;
    /** Default `cell`. Legacy summary / counter / breakdown / total / month / base are mapped. */
    size?: MoneySize | LegacyMoneySize;
    tone?: MoneyTone;
    sign?: '+' | '−';
    hideCurrency?: boolean;
    animated?: boolean;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'money',
                SIZES[resolveSize(size)],
                TONES[tone],
                className,
            )}
        >
            <span dir="ltr" className="num">
                <NumberText value={value} sign={sign} animated={animated} />
            </span>
            {!hideCurrency && <span className="cur">د.ل</span>}
        </span>
    );
}

/**
 * A count on the money scale (no currency), e.g. invoices or absent days.
 */
export function Count({
    value,
    size = 'cell',
    tone = 'default',
    animated = false,
    className,
}: {
    value: number;
    size?: MoneySize | LegacyMoneySize;
    tone?: MoneyTone;
    animated?: boolean;
    className?: string;
}) {
    return (
        <span
            dir="ltr"
            className={cn(
                'num inline-block whitespace-nowrap',
                SIZES[resolveSize(size)],
                TONES[tone],
                className,
            )}
        >
            <NumberText value={value} animated={animated} />
        </span>
    );
}
