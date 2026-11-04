import { formatNumber } from '@/lib/money';
import { cn } from '@/lib/utils';

/** Number sizes from the spec (px), with phone sizes where they differ. */
const SIZES = {
    tile: 'text-[21px] min-[430px]:text-[24px] sm:text-[30px] font-bold',
    summary: 'text-[27px] sm:text-[32px] font-bold',
    counter: 'text-[26px] font-bold',
    card: 'text-[23px] font-bold',
    breakdown: 'text-[21px] font-bold',
    total: 'text-[24px] font-bold',
    cell: 'text-[19px] font-bold',
    footer: 'text-[21px] font-bold',
    month: 'text-[17px] font-semibold',
    base: 'text-[15px] font-semibold',
} as const;

const TONES = {
    default: '',
    ok: 'text-ok',
    bad: 'text-bad',
    warn: 'text-warn',
    muted: 'text-muted',
    inherit: 'text-inherit',
} as const;

export type MoneySize = keyof typeof SIZES;

/**
 * A money amount: big tabular number followed by a small muted "د.ل".
 */
export function Money({
    value,
    size = 'cell',
    tone = 'default',
    sign,
    className,
    hideCurrency = false,
}: {
    value: number;
    size?: MoneySize;
    tone?: keyof typeof TONES;
    sign?: '+' | '−';
    className?: string;
    hideCurrency?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex flex-wrap items-baseline gap-x-1 leading-tight',
                TONES[tone],
                className,
            )}
        >
            <span className={cn('num whitespace-nowrap', SIZES[size])}>
                {sign}
                {formatNumber(value)}
            </span>
            {!hideCurrency && (
                <span className="text-[13px] font-normal text-muted">د.ل</span>
            )}
        </span>
    );
}
