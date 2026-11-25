import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    FileText,
    X,
} from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { KeyboardEvent } from 'react';
import { IconButton } from '@/components/IconButton';
import { Money } from '@/components/Money';
import { SerialChip } from '@/components/SerialChip';
import { cn } from '@/lib/utils';

export type ReceiptViewerItem = {
    url: string;
    /** Invoice title (also the accessible dialog title). */
    caption: string;
    serial?: string;
    amount?: number;
};

const DARK_BUTTON =
    'inline-flex h-9 items-center gap-2 rounded-md bg-white/10 px-3 text-[13px] leading-[18px] font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-white';

/**
 * Full-viewport receipt viewer (view only): image, caption bar, previous / next
 * (ArrowRight = previous, ArrowLeft = next), «فتح الصورة» in a new tab and «فتح الفاتورة».
 */
export function ReceiptViewer({
    open,
    onOpenChange,
    items,
    index,
    onIndexChange,
    onOpenInvoice,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: ReceiptViewerItem[];
    index: number;
    onIndexChange: (index: number) => void;
    onOpenInvoice?: (index: number) => void;
}) {
    const item = items[index] ?? null;
    const hasPrevious = index > 0;
    const hasNext = index < items.length - 1;

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'ArrowRight' && hasPrevious) {
            event.preventDefault();
            onIndexChange(index - 1);
        } else if (event.key === 'ArrowLeft' && hasNext) {
            event.preventDefault();
            onIndexChange(index + 1);
        }
    }

    return (
        <DialogPrimitive.Root
            open={open && item !== null}
            onOpenChange={onOpenChange}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-60 bg-[#0e1418]/92" />
                <DialogPrimitive.Content
                    dir="rtl"
                    aria-describedby={undefined}
                    onKeyDown={handleKeyDown}
                    className="anim-overlay fixed inset-0 z-61 flex flex-col text-white outline-none"
                >
                    {item && (
                        <>
                            <div className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                    {item.serial && (
                                        <SerialChip className="bg-white/10 text-white/80">
                                            {item.serial}
                                        </SerialChip>
                                    )}
                                    <DialogPrimitive.Title className="truncate text-body-strong">
                                        {item.caption}
                                    </DialogPrimitive.Title>
                                    {item.amount !== undefined && (
                                        <Money
                                            value={item.amount}
                                            size="inline"
                                            tone="inherit"
                                            className="[&_.cur]:text-white/70"
                                        />
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={DARK_BUTTON}
                                    >
                                        <ExternalLink
                                            aria-hidden
                                            className="size-4"
                                        />
                                        فتح الصورة
                                    </a>
                                    {onOpenInvoice && (
                                        <button
                                            type="button"
                                            onClick={() => onOpenInvoice(index)}
                                            className={DARK_BUTTON}
                                        >
                                            <FileText
                                                aria-hidden
                                                className="size-4"
                                            />
                                            فتح الفاتورة
                                        </button>
                                    )}
                                    <DialogPrimitive.Close asChild>
                                        <IconButton
                                            label="إغلاق"
                                            icon={X}
                                            tooltip={false}
                                            className="text-white hover:bg-white/10 hover:text-white"
                                        />
                                    </DialogPrimitive.Close>
                                </div>
                            </div>

                            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16">
                                <img
                                    key={item.url}
                                    src={item.url}
                                    alt="صورة الإيصال"
                                    className="anim-overlay max-h-full max-w-full rounded-md object-contain"
                                    data-state="open"
                                />
                                {items.length > 1 && (
                                    <>
                                        <IconButton
                                            label="السابق"
                                            icon={ChevronRight}
                                            size="lg"
                                            tooltip={false}
                                            disabled={!hasPrevious}
                                            onClick={() =>
                                                onIndexChange(index - 1)
                                            }
                                            className={cn(
                                                'absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white sm:start-4',
                                            )}
                                        />
                                        <IconButton
                                            label="التالي"
                                            icon={ChevronLeft}
                                            size="lg"
                                            tooltip={false}
                                            disabled={!hasNext}
                                            onClick={() =>
                                                onIndexChange(index + 1)
                                            }
                                            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white sm:end-4"
                                        />
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
