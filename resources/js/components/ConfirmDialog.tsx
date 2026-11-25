import { AlertTriangle } from 'lucide-react';
import { useRef } from 'react';
import { ResponsiveDialog } from '@/components/ResponsiveDialog';
import { Button } from '@/components/ui/button';

/**
 * In-app confirmation (size sm, nested layer) with a solid red confirm button.
 * Focus starts on «إلغاء» so Enter never deletes by accident.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title = 'تأكيد الحذف',
    message,
    confirmLabel = 'حذف',
    processing = false,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Default «تأكيد الحذف». */
    title?: string;
    message: string;
    /** Default «حذف». */
    confirmLabel?: string;
    /** The confirm button shows «جارٍ الحذف…». */
    processing?: boolean;
    onConfirm: () => void;
}) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            size="sm"
            layer="nested"
            initialFocus={cancelRef}
            headerIcon={
                <span className="flex size-11 items-center justify-center rounded-full bg-bad-50 text-bad-700">
                    <AlertTriangle className="size-[22px]" aria-hidden />
                </span>
            }
            footer={
                <>
                    <Button
                        variant="danger-solid"
                        loading={processing}
                        onClick={onConfirm}
                    >
                        {processing ? 'جارٍ الحذف…' : confirmLabel}
                    </Button>
                    <Button
                        ref={cancelRef}
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                    >
                        إلغاء
                    </Button>
                </>
            }
        >
            <p className="text-body text-ink-1">{message}</p>
        </ResponsiveDialog>
    );
}
