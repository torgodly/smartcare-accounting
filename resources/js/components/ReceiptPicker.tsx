import { ImageOff, QrCode, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { store as storeReceipt } from '@/actions/App/Http/Controllers/ReceiptController';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/http';
import { compressImage } from '@/lib/image';
import type { ReceiptRef } from '@/types';

/**
 * Receipt image: preview, upload from the computer (compressed in the browser) or capture by phone (QR).
 */
export function ReceiptPicker({
    receipt,
    onChange,
    onQr,
}: {
    receipt: ReceiptRef | null;
    onChange: (receipt: ReceiptRef | null) => void;
    onQr: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function upload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setUploading(true);

        try {
            const blob = await compressImage(file);
            const body = new FormData();
            body.append('file', blob, 'receipt.jpg');
            onChange(await http.post<ReceiptRef>(storeReceipt.url(), body));
        } catch (error) {
            toast(
                `فشل رفع الصورة${error instanceof Error && error.message !== 'فشل رفع الصورة' ? `: ${error.message}` : ''}`,
            );
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-4 rounded-[10px] border-2 border-dashed border-line p-3">
            {receipt ? (
                <a
                    href={receipt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block size-24 shrink-0 overflow-hidden rounded-md border border-line bg-sunk"
                    title="فتح الصورة"
                >
                    <img
                        src={receipt.url}
                        alt="صورة الإيصال"
                        className="size-full object-cover"
                    />
                </a>
            ) : (
                <div className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-md bg-sunk text-center text-[12px] text-muted">
                    <ImageOff className="size-5" />
                    لا توجد صورة
                </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
                {uploading ? (
                    <span className="text-[14px] text-muted">جارٍ الرفع…</span>
                ) : (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                        >
                            <Upload />
                            رفع من الجهاز
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onQr}
                        >
                            <QrCode />
                            التقاط بالهاتف (QR)
                        </Button>
                        {receipt && (
                            <Button
                                type="button"
                                variant="danger"
                                size="xs"
                                onClick={() => onChange(null)}
                            >
                                إزالة
                            </Button>
                        )}
                    </>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={upload}
                />
            </div>
        </div>
    );
}
