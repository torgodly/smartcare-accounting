import { Button } from '@/components/ui/button';
import { AppDialog } from '@/components/AppDialog';

/**
 * In-app confirmation with a red confirm button.
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
    title?: string;
    message: string;
    confirmLabel?: string;
    processing?: boolean;
    onConfirm: () => void;
}) {
    return (
        <AppDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            className="max-w-[440px]"
            footer={
                <>
                    <Button
                        variant="destructive"
                        disabled={processing}
                        onClick={onConfirm}
                    >
                        {processing ? 'جارٍ الحذف…' : confirmLabel}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        إلغاء
                    </Button>
                </>
            }
        >
            <p className="text-[15px]">{message}</p>
        </AppDialog>
    );
}
