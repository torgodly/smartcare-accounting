import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    destroy as destroyToken,
    show as showToken,
    store as storeToken,
} from '@/actions/App/Http/Controllers/UploadTokenController';
import { ResponsiveDialog } from '@/components/ResponsiveDialog';
import { Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/http';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { ReceiptRef } from '@/types';

type TokenResponse = {
    token: string;
    url: string;
    expires_at: string;
    expires_in: number;
};
type PollResponse = { state: string; receipt: ReceiptRef | null };

const RING_SIZE = 64;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * 64px countdown ring with mm:ss in the middle (warn under 1:00, bad at 0).
 */
function CountdownRing({
    secondsLeft,
    total,
}: {
    secondsLeft: number;
    total: number;
}) {
    const remaining = Math.max(secondsLeft, 0);
    const fraction = total > 0 ? remaining / total : 0;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    return (
        <div
            className="relative flex size-16 shrink-0 items-center justify-center"
            role="timer"
            aria-live="off"
        >
            <svg
                width={RING_SIZE}
                height={RING_SIZE}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                className="absolute inset-0 -rotate-90"
                aria-hidden
            >
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="var(--sunken)"
                    strokeWidth={RING_STROKE}
                />
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="var(--cyan-700)"
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={RING_LENGTH}
                    strokeDashoffset={RING_LENGTH * (1 - fraction)}
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
            </svg>
            <span
                className={cn(
                    'num relative text-[15px] leading-5 font-bold',
                    remaining === 0
                        ? 'text-bad-700'
                        : remaining < 60
                          ? 'text-warn-700'
                          : 'text-ink-1',
                )}
            >
                {String(minutes).padStart(2, '0')}:
                {String(seconds).padStart(2, '0')}
            </span>
        </div>
    );
}

/**
 * Shows a one-time QR code (10 minutes); polls every 2 s until the phone sends the photo.
 * Closing deletes the token unless a photo was received; a photo is accepted only once.
 */
export function QrUploadDialog({
    open,
    onClose,
    onReceived,
}: {
    open: boolean;
    onClose: () => void;
    onReceived: (receipt: ReceiptRef) => void;
}) {
    const [token, setToken] = useState<TokenResponse | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [total, setTotal] = useState(600);
    const [error, setError] = useState<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const receivedRef = useRef(false);

    const create = useCallback(async () => {
        setError(null);
        setToken(null);

        try {
            const created = await http.post<TokenResponse>(storeToken.url());
            tokenRef.current = created.token;
            setToken(created);
            setSecondsLeft(created.expires_in);
            setTotal(created.expires_in);
        } catch (exception) {
            setError((exception as Error).message);
        }
    }, []);

    useEffect(() => {
        if (open) {
            receivedRef.current = false;
            void create();
        }
    }, [open, create]);

    // Countdown.
    useEffect(() => {
        if (!open || !token || secondsLeft <= 0) {
            return;
        }

        const timer = window.setTimeout(
            () => setSecondsLeft((seconds) => seconds - 1),
            1000,
        );

        return () => window.clearTimeout(timer);
    }, [open, token, secondsLeft]);

    // Polling every 2 seconds while the code is valid.
    useEffect(() => {
        if (!open || !token || secondsLeft <= 0) {
            return;
        }

        const interval = window.setInterval(async () => {
            try {
                const result = await http.get<PollResponse>(
                    showToken.url(token.token),
                );

                if (result.receipt && !receivedRef.current) {
                    receivedRef.current = true;
                    tokenRef.current = null;
                    toast.success('وصلت صورة الإيصال من الهاتف');
                    onReceived(result.receipt);
                }
            } catch {
                // Keep polling; a temporary network error should not stop the flow.
            }
        }, 2000);

        return () => window.clearInterval(interval);
        // Polling restarts only for a new token.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, token?.token, secondsLeft <= 0]);

    function close() {
        if (tokenRef.current) {
            void http
                .delete(destroyToken.url(tokenRef.current))
                .catch(() => undefined);
            tokenRef.current = null;
        }

        setToken(null);
        onClose();
    }

    const expired = token !== null && secondsLeft <= 0;

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={(next) => !next && close()}
            title="التقاط الإيصال بالهاتف"
            size="sm"
            layer="nested"
        >
            <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex items-center gap-5 max-sm:flex-col">
                    <div className="rounded-lg border border-line-1 bg-white p-3">
                        {token ? (
                            <QRCodeSVG
                                value={token.url}
                                size={208}
                                marginSize={0}
                                className={cn(
                                    'transition-[opacity,filter] duration-200',
                                    expired && 'opacity-20 blur-[3px]',
                                )}
                            />
                        ) : (
                            <Skeleton
                                shape="control"
                                className="size-[208px]"
                            />
                        )}
                    </div>
                    {token && (
                        <CountdownRing
                            secondsLeft={secondsLeft}
                            total={total}
                        />
                    )}
                </div>

                <p className="max-w-sm text-body-sm text-ink-3">
                    امسح الرمز بكاميرا الهاتف، صوّر الإيصال واضغط «إرسال». ستظهر
                    الصورة هنا تلقائياً. لا يحتاج الهاتف إلى تسجيل دخول.
                </p>

                {error && <p className="text-body-sm text-bad-700">{error}</p>}

                {expired ? (
                    <div className="flex flex-col items-center gap-3">
                        <StatusPill kind="bad" size="lg">
                            انتهت صلاحية الرمز
                        </StatusPill>
                        <Button onClick={() => void create()}>
                            إنشاء رمز جديد
                        </Button>
                    </div>
                ) : (
                    token && (
                        <p className="flex items-center gap-2 text-label-sm text-ink-2">
                            <span
                                aria-hidden
                                className="size-2 animate-pulse-dot rounded-full bg-ok-500"
                            />
                            بانتظار الصورة من الهاتف…
                        </p>
                    )
                )}
            </div>
        </ResponsiveDialog>
    );
}
