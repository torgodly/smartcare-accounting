import { Head } from '@inertiajs/react';
import { Camera, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
    show as showUpload,
    store as storeUpload,
} from '@/actions/App/Http/Controllers/PhoneUploadController';
import { Button } from '@/components/ui/button';
import { HttpError, http } from '@/lib/http';
import { compressImage } from '@/lib/image';

type State =
    | 'checking'
    | 'invalid'
    | 'used'
    | 'expired'
    | 'ok'
    | 'sending'
    | 'done';

const INVALID_TITLES: Partial<Record<State, string>> = {
    invalid: 'الرمز غير صالح',
    used: 'تم استخدام هذا الرمز',
    expired: 'انتهت صلاحية الرمز',
};

/**
 * Phone page opened from the QR code: take a photo of the receipt and send it (no login).
 */
export default function Upload({ token }: { token: string }) {
    const [state, setState] = useState<State>('checking');
    const [expiresIn, setExpiresIn] = useState(0);
    const [photo, setPhoto] = useState<{ blob: Blob; preview: string } | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        http.get<{ state: State; expires_in: number }>(showUpload.url(token))
            .then((data) => {
                setState(data.state);
                setExpiresIn(data.expires_in);
            })
            .catch(() => setState('invalid'));
    }, [token]);

    useEffect(
        () => () => {
            if (photo) {
                URL.revokeObjectURL(photo.preview);
            }
        },
        [photo],
    );

    async function choose(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setError(null);
        const blob = await compressImage(file).catch(() => file);
        setPhoto({ blob, preview: URL.createObjectURL(blob) });
    }

    async function send() {
        if (!photo) {
            return;
        }

        setState('sending');
        setError(null);

        try {
            const body = new FormData();
            body.append('file', photo.blob, 'receipt.jpg');
            await http.post(storeUpload.url(token), body);
            setState('done');
        } catch (exception) {
            if (exception instanceof HttpError && exception.status === 410) {
                const data = exception.data as { state?: State } | null;
                setState(
                    data?.state && INVALID_TITLES[data.state]
                        ? data.state
                        : 'invalid',
                );

                return;
            }

            setState('ok');
            setError('فشل رفع الصورة');
        }
    }

    const minutes = Math.max(1, Math.ceil(expiresIn / 60));

    return (
        <>
            <Head title="إرسال صورة الإيصال" />
            <div className="min-h-screen bg-bg px-4 py-8">
                <div className="mx-auto flex max-w-[460px] flex-col items-center gap-5 text-center">
                    <img
                        src="/img/logo-full.png"
                        alt="الرعاية الذكية"
                        className="w-[200px] max-w-full"
                    />
                    <h1 className="font-display text-[22px] font-semibold">
                        إرسال صورة الإيصال
                    </h1>

                    {state === 'checking' && (
                        <p className="text-muted">جارٍ التحقق من الرمز…</p>
                    )}

                    {INVALID_TITLES[state] && (
                        <div className="panel w-full px-5 py-6">
                            <p className="text-[18px] font-semibold text-bad">
                                {INVALID_TITLES[state]}
                            </p>
                            <p className="mt-2 text-[14px] text-muted">
                                أنشئ رمزاً جديداً من شاشة الفاتورة على الحاسوب.
                            </p>
                        </div>
                    )}

                    {(state === 'ok' || state === 'sending') && !photo && (
                        <>
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="flex min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-accent bg-surface px-4 text-accent active:bg-accent-soft"
                            >
                                <Camera className="size-12" />
                                <span className="text-[18px] font-semibold">
                                    اضغط لتصوير الإيصال
                                </span>
                                <span className="text-[14px] text-muted">
                                    أو اختر صورة من المعرض
                                </span>
                            </button>
                            <p className="text-[13px] text-muted">
                                الرمز صالح لمدة {minutes} دقيقة تقريباً
                            </p>
                        </>
                    )}

                    {(state === 'ok' || state === 'sending') && photo && (
                        <div className="flex w-full flex-col gap-3">
                            <img
                                src={photo.preview}
                                alt="معاينة الإيصال"
                                className="max-h-[60vh] w-full rounded-[10px] border border-line bg-surface object-contain"
                            />
                            <Button
                                className="h-auto w-full py-[13px] text-[16px]"
                                disabled={state === 'sending'}
                                onClick={send}
                            >
                                {state === 'sending'
                                    ? 'جارٍ الإرسال…'
                                    : 'إرسال إلى النظام'}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                disabled={state === 'sending'}
                                onClick={() => inputRef.current?.click()}
                            >
                                إعادة التصوير
                            </Button>
                        </div>
                    )}

                    {error && <p className="text-[14px] text-bad">{error}</p>}

                    {state === 'done' && (
                        <div className="panel flex w-full flex-col items-center gap-2 px-5 py-6">
                            <CheckCircle2 className="size-10 text-ok" />
                            <p className="text-[20px] font-semibold text-ok">
                                تم الإرسال ✓
                            </p>
                            <p className="text-[14px] text-muted">
                                ظهرت الصورة في الفاتورة على الحاسوب. يمكنك إغلاق
                                هذه الصفحة.
                            </p>
                        </div>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={choose}
                    />
                </div>
            </div>
        </>
    );
}
