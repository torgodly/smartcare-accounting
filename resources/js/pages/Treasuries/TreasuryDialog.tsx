import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/TreasuryController';
import { AppDialog } from '@/components/AppDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Field } from '@/components/Field';
import { NativeSelect } from '@/components/NativeSelect';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import type { Region, TreasuryRef } from '@/types';

/**
 * Create a treasury, or rename / move / delete one.
 */
export function TreasuryDialog({
    open,
    treasury,
    canDelete = false,
    onOpenChange,
}: {
    open: boolean;
    treasury: TreasuryRef | null;
    canDelete?: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { month } = useMonth();
    const { region, regions, auth } = usePage().props;
    const isAdmin = auth.user?.is_admin ?? false;
    const defaultRegion: Region = region === 'all' ? 'east' : region;
    const form = useForm<{ name: string; region: Region }>({
        name: '',
        region: defaultRegion,
    });
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (open) {
            form.clearErrors();
            form.setData({
                name: treasury?.name ?? '',
                region: treasury?.region ?? defaultRegion,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, treasury?.id]);

    function submit(event: FormEvent) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: () => toast('لم يتم الحفظ: راجع الحقول المطلوبة'),
        };

        if (treasury) {
            form.put(update.url(treasury.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    function remove() {
        if (!treasury) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(treasury.id, { query: { month } }), {
            onFinish: () => setDeleting(false),
        });
    }

    return (
        <>
            <AppDialog
                open={open}
                onOpenChange={onOpenChange}
                title={treasury ? 'إعدادات الخزينة' : 'خزينة جديدة'}
                footer={
                    <>
                        <Button
                            type="submit"
                            form="treasury-form"
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
                        {treasury && canDelete && (
                            <Button
                                variant="danger"
                                className="ms-auto"
                                onClick={() => setConfirming(true)}
                            >
                                حذف الخزينة
                            </Button>
                        )}
                    </>
                }
            >
                <form
                    id="treasury-form"
                    onSubmit={submit}
                    className="flex flex-col gap-4"
                    noValidate
                >
                    <Field
                        label="اسم الخزينة"
                        htmlFor="treasury-name"
                        error={form.errors.name}
                    >
                        <input
                            id="treasury-name"
                            className="field-input"
                            placeholder="مثال: خزينة المصرف"
                            maxLength={120}
                            value={form.data.name}
                            aria-invalid={!!form.errors.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            autoFocus
                        />
                    </Field>
                    {isAdmin && (
                        <Field
                            label="المنطقة"
                            htmlFor="treasury-region"
                            error={form.errors.region}
                        >
                            <NativeSelect
                                id="treasury-region"
                                value={form.data.region}
                                onChange={(event) =>
                                    form.setData(
                                        'region',
                                        event.target.value as Region,
                                    )
                                }
                            >
                                {regions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                    )}
                </form>
            </AppDialog>

            {treasury && (
                <ConfirmDialog
                    open={confirming}
                    onOpenChange={setConfirming}
                    message={`ستُحذف «${treasury.name}». لا توجد عليها أي حركات.`}
                    confirmLabel="حذف الخزينة"
                    processing={deleting}
                    onConfirm={remove}
                />
            )}
        </>
    );
}
