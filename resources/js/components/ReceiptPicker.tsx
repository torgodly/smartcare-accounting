import { ImageOff, QrCode, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { store as storeReceipt } from '@/actions/App/Http/Controllers/ReceiptController';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/http';
import { compressImage } from '@/lib/image';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { ReceiptRef } from '@/types';

function firstImage(files: FileList | null | undefined): File | null {
    return (
        Array.from(files ?? []).find((file) =>
            file.type.startsWith('image/'),
        ) ?? null
    );
}

/**
 * Receipt image: preview, upload from the computer (compressed in the browser), drag-and-drop,
 * paste, or capture by phone (QR). Upload path: compressImage → POST receipts.store (FormData
 * `file`) → `{id, url}` → onChange. «إزالة» sets null (takes effect on save).
 */
export function ReceiptPicker({
    receipt,
    onChange,
    onQr,
    emphasis = false,
    layout = 'column',
    onPreview,
}: {
    receipt: ReceiptRef | null;
    onChange: (receipt: ReceiptRef | null) => void;
    onQr: () => void;
    /** Amber dashed border (auto invoices missing a receipt). */
    emphasis?: boolean;
    /** `strip` = phone compact (72px preview + buttons). */
    layout?: 'column' | 'strip';
    /** Opens the ReceiptViewer; default opens the image URL in a new tab. */
    onPreview?: () => void;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [shaking, setShaking] = useState(false);
    const [previousId, setPreviousId] = useState(receipt?.id ?? null);
    const [arrived, setArrived] = useState(false);
    const strip = layout === 'strip';

    if ((receipt?.id ?? null) !== previousId) {
        setPreviousId(receipt?.id ?? null);
        setArrived(receipt !== null);
    }

    async function upload(file: File): Promise<void> {
        const preview = URL.createObjectURL(file);
        setLocalPreview(preview);
        setUploading(true);

        try {
            const blob = await compressImage(file);
            const body = new FormData();
            body.append('file', blob, 'receipt.jpg');
            onChange(await http.post<ReceiptRef>(storeReceipt.url(), body));
        } catch (error) {
            toast.error(
                `فشل رفع الصورة${error instanceof Error && error.message !== 'فشل رفع الصورة' ? `: ${error.message}` : ''}`,
            );
            setShaking(true);
        } finally {
            setUploading(false);
            setLocalPreview(null);
            URL.revokeObjectURL(preview);
        }
    }

    function handleInput(event: ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (file) {
            void upload(file);
        }
    }

    const uploadRef = useRef(upload);

    useEffect(() => {
        uploadRef.current = upload;
    });

    // Paste an image anywhere inside the surrounding dialog.
    useEffect(() => {
        const scope =
            rootRef.current?.closest<HTMLElement>('[role="dialog"]') ?? null;

        if (!scope) {
            return;
        }

        function onPaste(event: ClipboardEvent): void {
            const file = firstImage(event.clipboardData?.files);

            if (file) {
                event.preventDefault();
                void uploadRef.current(file);
            }
        }

        scope.addEventListener('paste', onPaste);

        return () => scope.removeEventListener('paste', onPaste);
    }, []);

    function handleDragOver(event: DragEvent<HTMLDivElement>): void {
        if (uploading || !event.dataTransfer.types.includes('Files')) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setDragging(true);
    }

    function handleDrop(event: DragEvent<HTMLDivElement>): void {
        event.preventDefault();
        setDragging(false);
        const file = firstImage(event.dataTransfer.files);

        if (file && !uploading) {
            void upload(file);
        }
    }

    const previewSource = localPreview ?? receipt?.url ?? null;

    const preview = previewSource ? (
        <div
            className={cn(
                'relative shrink-0 overflow-hidden rounded-[12px] border border-line-1 bg-sunken',
                strip ? 'size-[72px]' : 'aspect-[4/3] w-full max-w-[280px]',
                arrived && !uploading && 'anim-receipt-in',
            )}
            onAnimationEnd={() => setArrived(false)}
        >
            {receipt && !uploading ? (
                onPreview ? (
                    <button
                        type="button"
                        onClick={onPreview}
                        title="فتح الصورة"
                        className="block size-full"
                    >
                        <img
                            src={receipt.url}
                            alt="صورة الإيصال"
                            className="size-full object-cover"
                        />
                    </button>
                ) : (
                    <a
                        href={receipt.url}
                        target="_blank"
                        rel="noreferrer"
                        title="فتح الصورة"
                        className="block size-full"
                    >
                        <img
                            src={receipt.url}
                            alt="صورة الإيصال"
                            className="size-full object-cover"
                        />
                    </a>
                )
            ) : (
                <img
                    src={previewSource}
                    alt=""
                    className="size-full scale-105 object-cover blur-[3px]"
                />
            )}
            {uploading && (
                <div className="progress-indeterminate absolute inset-x-0 bottom-0" />
            )}
        </div>
    ) : (
        <div
            className={cn(
                'flex shrink-0 flex-col items-center justify-center gap-1.5 text-center text-ink-3',
                strip ? 'size-[72px] rounded-[12px] bg-sunken' : 'py-2',
            )}
        >
            <ImageOff aria-hidden className="size-6" />
            {!strip && (
                <>
                    <span className="text-label-sm">لا توجد صورة</span>
                    <span className="text-caption max-sm:hidden">
                        اسحب الصورة هنا أو الصقها
                    </span>
                </>
            )}
            {uploading && (
                <div className="progress-indeterminate mt-2 w-24 rounded-full" />
            )}
        </div>
    );

    return (
        <div
            ref={rootRef}
            onDragOver={handleDragOver}
            onDragLeave={(event) => {
                if (
                    !event.currentTarget.contains(event.relatedTarget as Node)
                ) {
                    setDragging(false);
                }
            }}
            onDrop={handleDrop}
            onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) {
                    setShaking(false);
                }
            }}
            className={cn(
                'relative flex gap-4 rounded-lg border-[1.5px] border-dashed bg-surface-2 transition-colors duration-140',
                strip
                    ? 'items-center p-3'
                    : 'flex-col items-center p-6 text-center max-sm:p-4',
                emphasis ? 'border-warn-500' : 'border-line-field',
                dragging && 'border-solid border-cyan-600 bg-cyan-50',
                shaking && 'anim-shake',
            )}
        >
            {preview}

            <div
                className={cn(
                    'flex flex-wrap items-center gap-2',
                    !strip && 'justify-center',
                )}
            >
                {uploading ? (
                    <span className="text-body-sm text-ink-3">جارٍ الرفع…</span>
                ) : (
                    <>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={Upload}
                            onClick={() => inputRef.current?.click()}
                        >
                            رفع من الجهاز
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={QrCode}
                            onClick={onQr}
                        >
                            التقاط بالهاتف (QR)
                        </Button>
                        {receipt && (
                            <Button
                                variant="danger"
                                size="sm"
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
                    onChange={handleInput}
                />
            </div>

            {dragging && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-cyan-50/90 text-label text-cyan-700">
                    أفلت الصورة هنا
                </div>
            )}
        </div>
    );
}
