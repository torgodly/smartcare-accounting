import { router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/InvoiceController';
import { AppDialog } from '@/components/AppDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Field } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { QrUploadDialog } from '@/components/QrUploadDialog';
import { ReceiptPicker } from '@/components/ReceiptPicker';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import { cn } from '@/lib/utils';
import type { Invoice, InvoiceType, PurchaseGroup, ReceiptRef } from '@/types';

type InvoiceForm = {
    title: string;
    price: string;
    reason: string;
    type: InvoiceType;
    receipt_id: string | null;
};

export function InvoiceDialog({
    open,
    invoice,
    group,
    onOpenChange,
}: {
    open: boolean;
    invoice: Invoice | null;
    group: PurchaseGroup;
    onOpenChange: (open: boolean) => void;
}) {
    const { month } = useMonth();
    const form = useForm<InvoiceForm>({
        title: '',
        price: '',
        reason: '',
        type: 'once',
        receipt_id: null,
    });
    const [receipt, setReceipt] = useState<ReceiptRef | null>(null);
    const [qrOpen, setQrOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        form.clearErrors();
        form.setData({
            title: invoice?.title ?? '',
            price: invoice ? String(invoice.price) : '',
            reason: invoice?.reason ?? '',
            type: invoice?.type ?? 'once',
            receipt_id: invoice?.receipt?.id ?? null,
        });
        setReceipt(invoice?.receipt ?? null);
        setQrOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, invoice?.id]);

    function changeReceipt(next: ReceiptRef | null) {
        setReceipt(next);
        form.setData('receipt_id', next?.id ?? null);
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (errors: Record<string, string>) =>
                toast(`لم يتم الحفظ: ${Object.values(errors)[0] ?? ''}`),
        };

        if (invoice) {
            form.put(update.url(invoice.id), options);
        } else {
            form.transform((data) => ({ ...data, month }));
            form.post(store.url(group.id), options);
        }
    }

    function remove() {
        if (!invoice) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(invoice.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirming(false);
                onOpenChange(false);
            },
            onFinish: () => setDeleting(false),
        });
    }

    return (
        <>
            <AppDialog
                open={open && !qrOpen}
                onOpenChange={onOpenChange}
                title={
                    invoice ? (
                        <>
                            فاتورة{' '}
                            <span className="serial text-[15px]">
                                {invoice.serial}
                            </span>
                        </>
                    ) : (
                        `فاتورة جديدة · ${group.name}`
                    )
                }
                footer={
                    <>
                        <Button
                            type="submit"
                            form="invoice-form"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? 'جارٍ الحفظ…'
                                : invoice
                                  ? 'حفظ'
                                  : 'إضافة الفاتورة'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            إلغاء
                        </Button>
                        {invoice && (
                            <Button
                                variant="danger"
                                className="ms-auto"
                                onClick={() => setConfirming(true)}
                            >
                                حذف
                            </Button>
                        )}
                    </>
                }
            >
                <form
                    id="invoice-form"
                    onSubmit={submit}
                    className="flex flex-col gap-4"
                    noValidate
                >
                    <Field label="صورة الإيصال">
                        <ReceiptPicker
                            receipt={receipt}
                            onChange={changeReceipt}
                            onQr={() => setQrOpen(true)}
                        />
                    </Field>
                    <Field
                        label="العنوان"
                        htmlFor="invoice-title"
                        error={form.errors.title}
                    >
                        <input
                            id="invoice-title"
                            className="field-input"
                            placeholder="مثال: أحبار طابعة"
                            maxLength={160}
                            value={form.data.title}
                            aria-invalid={!!form.errors.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="السعر (د.ل)"
                        htmlFor="invoice-price"
                        error={form.errors.price}
                    >
                        <MoneyInput
                            id="invoice-price"
                            placeholder="0"
                            value={form.data.price}
                            aria-invalid={!!form.errors.price}
                            onChange={(event) =>
                                form.setData('price', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="سبب الشراء (اختياري)"
                        htmlFor="invoice-reason"
                        error={form.errors.reason}
                    >
                        <textarea
                            id="invoice-reason"
                            rows={2}
                            className="field-input h-auto py-2"
                            value={form.data.reason}
                            onChange={(event) =>
                                form.setData('reason', event.target.value)
                            }
                        />
                    </Field>
                    <fieldset className="flex flex-col gap-1.5">
                        <legend className="mb-1.5 text-[13px] font-semibold">
                            النوع
                        </legend>
                        <div
                            className="grid grid-cols-2 gap-2"
                            role="radiogroup"
                        >
                            {(
                                [
                                    ['once', 'مرة واحدة'],
                                    ['recurring', 'متكرر شهرياً'],
                                ] as const
                            ).map(([value, label]) => (
                                <label
                                    key={value}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-[14px] font-semibold transition-colors',
                                        form.data.type === value
                                            ? 'border-accent bg-accent-soft text-accent'
                                            : 'border-line hover:bg-sunk',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="invoice-type"
                                        value={value}
                                        checked={form.data.type === value}
                                        onChange={() =>
                                            form.setData('type', value)
                                        }
                                        className="accent-[var(--accent)]"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                        <p className="text-[12.5px] text-muted">
                            الفاتورة المتكررة تُنشأ تلقائياً في الشهر التالي،
                            وتحتاج فقط لصورة الإيصال الجديد.
                        </p>
                    </fieldset>
                </form>
            </AppDialog>

            <QrUploadDialog
                open={open && qrOpen}
                onClose={() => setQrOpen(false)}
                onReceived={(received) => {
                    changeReceipt(received);
                    setQrOpen(false);
                }}
            />

            {invoice && (
                <ConfirmDialog
                    open={confirming}
                    onOpenChange={setConfirming}
                    message={`ستُحذف الفاتورة ${invoice.serial} «${invoice.title}».`}
                    processing={deleting}
                    onConfirm={remove}
                />
            )}
        </>
    );
}
