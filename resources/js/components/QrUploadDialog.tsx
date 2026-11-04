import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    destroy as destroyToken,
    show as showToken,
    store as storeToken,
} from '@/actions/App/Http/Controllers/UploadTokenController';
import { AppDialog } from '@/components/AppDialog';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/http';
import type { ReceiptRef } from '@/types';

type TokenResponse = {
    token: string;
    url: string;
    expires_at: string;
    expires_in: number;
};
type PollResponse = { state: string; receipt: ReceiptRef | null };

/**
 * Shows a one-time QR code (10 minutes); polls every 2 s until the phone sends the photo.
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
                    toast('وصلت صورة الإيصال من الهاتف');
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
    const minutes = Math.floor(Math.max(secondsLeft, 0) / 60);
    const seconds = Math.max(secondsLeft, 0) % 60;

    return (
        <AppDialog
            open={open}
            onOpenChange={(next) => !next && close()}
            title="التقاط الإيصال بالهاتف"
        >
            <div className="flex flex-col items-center gap-4 py-2 text-center">
                <div className="rounded-[10px] border border-line bg-white p-4">
                    {token ? (
                        <QRCodeSVG
                            value={token.url}
                            size={220}
                            marginSize={0}
                            className={expired ? 'opacity-20' : ''}
                        />
                    ) : (
                        <div className="size-[220px] animate-pulse rounded bg-sunk" />
                    )}
                </div>

                {token && (
                    <div
                        className={`num font-display text-[34px] font-semibold ${expired ? 'text-bad' : ''}`}
                    >
                        {String(minutes).padStart(2, '0')}:
                        {String(seconds).padStart(2, '0')}
                    </div>
                )}

                <p className="max-w-sm text-[14px] text-muted">
                    امسح الرمز بكاميرا الهاتف، صوّر الإيصال واضغط «إرسال». ستظهر
                    الصورة هنا تلقائياً. لا يحتاج الهاتف إلى تسجيل دخول.
                </p>

                {error && <p className="text-[14px] text-bad">{error}</p>}

                {expired ? (
                    <div className="flex flex-col items-center gap-3">
                        <StatusPill kind="bad">انتهت صلاحية الرمز</StatusPill>
                        <Button onClick={() => void create()}>
                            إنشاء رمز جديد
                        </Button>
                    </div>
                ) : (
                    token && (
                        <StatusPill kind="neutral">
                            بانتظار الصورة من الهاتف…
                        </StatusPill>
                    )
                )}
            </div>
        </AppDialog>
    );
}
