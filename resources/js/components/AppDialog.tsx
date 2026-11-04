import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * App dialog: 520px (760px wide), 14px radius, sticky header with title + ✕,
 * footer buttons aligned to the start (destructive buttons use ms-auto to go to the end).
 */
export function AppDialog({
    open,
    onOpenChange,
    title,
    description,
    wide = false,
    children,
    footer,
    className,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    wide?: boolean;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(20,30,36,.45)]" />
                <DialogPrimitive.Content
                    dir="rtl"
                    aria-describedby={undefined}
                    className={cn(
                        'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_50px_rgba(0,0,0,.25)] outline-none',
                        wide ? 'max-w-[760px]' : 'max-w-[520px]',
                        className,
                    )}
                >
                    <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
                        <div className="min-w-0">
                            <DialogPrimitive.Title className="font-display text-[19px] leading-snug font-semibold">
                                {title}
                            </DialogPrimitive.Title>
                            {description && (
                                <DialogPrimitive.Description className="mt-0.5 text-[13px] text-muted">
                                    {description}
                                </DialogPrimitive.Description>
                            )}
                        </div>
                        <DialogPrimitive.Close
                            className="-me-1.5 flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-sunk hover:text-ink"
                            aria-label="إغلاق"
                        >
                            <XIcon className="size-[18px]" />
                        </DialogPrimitive.Close>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                        {children}
                    </div>
                    {footer && (
                        <div className="flex flex-wrap items-center justify-start gap-2 border-t border-line bg-surface px-5 py-3">
                            {footer}
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
