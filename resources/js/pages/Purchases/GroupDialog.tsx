import { router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/PurchaseGroupController';
import { AppDialog } from '@/components/AppDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Field } from '@/components/Field';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import type { PurchaseGroup } from '@/types';

export function GroupDialog({
    open,
    onOpenChange,
    group,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: PurchaseGroup | null;
}) {
    const { month } = useMonth();
    const form = useForm({ name: '', code: '' });
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (open) {
            form.clearErrors();
            form.setData({ name: group?.name ?? '', code: group?.code ?? '' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, group?.id]);

    function submit(event: FormEvent) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: () => toast('لم يتم الحفظ: راجع الحقول المطلوبة'),
        };

        if (group) {
            form.put(update.url(group.id), options);
        } else {
            form.post(store.url({ query: { month } }), options);
        }
    }

    function remove() {
        if (!group) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(group.id, { query: { month } }), {
            onFinish: () => setDeleting(false),
        });
    }

    return (
        <>
            <AppDialog
                open={open}
                onOpenChange={onOpenChange}
                title={group ? 'إعدادات المجموعة' : 'مجموعة جديدة'}
                footer={
                    <>
                        <Button
                            type="submit"
                            form="group-form"
                            disabled={form.processing}
                        >
                            {form.processing ? 'جارٍ الحفظ…' : 'حفظ'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            إلغاء
                        </Button>
                        {group && (
                            <Button
                                variant="danger"
                                className="ms-auto"
                                onClick={() => setConfirming(true)}
                            >
                                حذف المجموعة
                            </Button>
                        )}
                    </>
                }
            >
                <form
                    id="group-form"
                    onSubmit={submit}
                    className="flex flex-col gap-4"
                    noValidate
                >
                    <Field
                        label="اسم المجموعة"
                        htmlFor="group-name"
                        error={form.errors.name}
                    >
                        <input
                            id="group-name"
                            className="field-input"
                            placeholder="مثال: مشتريات داخلية"
                            value={form.data.name}
                            aria-invalid={!!form.errors.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            autoFocus
                        />
                    </Field>
                    <Field
                        label="رمز الترقيم"
                        htmlFor="group-code"
                        hint="أحرف إنجليزية، يظهر في رقم الفاتورة"
                        error={form.errors.code}
                    >
                        <input
                            id="group-code"
                            dir="ltr"
                            className="field-input text-right font-mono uppercase"
                            placeholder="IN"
                            maxLength={4}
                            value={form.data.code}
                            onChange={(event) =>
                                form.setData(
                                    'code',
                                    event.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z0-9]/g, '')
                                        .slice(0, 4),
                                )
                            }
                        />
                    </Field>
                </form>
            </AppDialog>

            {group && (
                <ConfirmDialog
                    open={confirming}
                    onOpenChange={setConfirming}
                    message={`ستُحذف مجموعة «${group.name}» وجميع فواتيرها في كل الأشهر.`}
                    confirmLabel="حذف المجموعة"
                    processing={deleting}
                    onConfirm={remove}
                />
            )}
        </>
    );
}
