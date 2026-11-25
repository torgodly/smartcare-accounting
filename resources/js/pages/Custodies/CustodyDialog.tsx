import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/CustodyController';
import { AppDialog } from '@/components/AppDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Field } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { NativeSelect } from '@/components/NativeSelect';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import type { Custody, Region, TreasuryRef } from '@/types';

type CustodyForm = {
    holder_name: string;
    title: string;
    region: Region;
    treasury_id: string;
    amount: string;
    date: string;
    note: string;
};

/**
 * Open a new custody (issues the float from a treasury), or rename / delete one.
 */
export function CustodyDialog({
    open,
    custody,
    treasuries,
    holders = [],
    onOpenChange,
}: {
    open: boolean;
    custody: Custody | null;
    treasuries: TreasuryRef[];
    holders?: string[];
    onOpenChange: (open: boolean) => void;
}) {
    const { month } = useMonth();
    const { region, regions, today, auth } = usePage().props;
    const isAdmin = auth.user?.is_admin ?? false;
    const defaultRegion: Region = region === 'all' ? 'east' : region;
    const firstTreasuryOf = (target: Region) =>
        String(treasuries.find((item) => item.region === target)?.id ?? '');
    const form = useForm<CustodyForm>({
        holder_name: '',
        title: '',
        region: defaultRegion,
        treasury_id: '',
        amount: '',
        date: today,
        note: '',
    });
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const regionTreasuries = treasuries.filter(
        (item) => item.region === form.data.region,
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        form.clearErrors();
        form.setData({
            holder_name: custody?.holder_name ?? '',
            title: custody?.title ?? '',
            region: custody?.region ?? defaultRegion,
            treasury_id: firstTreasuryOf(custody?.region ?? defaultRegion),
            amount: '',
            date: today,
            note: '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, custody?.id]);

    function submit(event: FormEvent) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (errors: Record<string, string>) =>
                toast(`لم يتم الحفظ: ${Object.values(errors)[0] ?? ''}`),
        };

        if (custody) {
            form.put(update.url(custody.id), options);
        } else {
            form.post(store.url({ query: { month } }), options);
        }
    }

    function remove() {
        if (!custody) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(custody.id, { query: { month } }), {
            onFinish: () => setDeleting(false),
        });
    }

    return (
        <>
            <AppDialog
                open={open}
                onOpenChange={onOpenChange}
                title={custody ? 'إعدادات العهدة' : 'عهدة جديدة'}
                footer={
                    <>
                        <Button
                            type="submit"
                            form="custody-form"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? 'جارٍ الحفظ…'
                                : custody
                                  ? 'حفظ'
                                  : 'صرف العهدة'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            إلغاء
                        </Button>
                        {custody && (
                            <Button
                                variant="danger"
                                className="ms-auto"
                                onClick={() => setConfirming(true)}
                            >
                                حذف العهدة
                            </Button>
                        )}
                    </>
                }
            >
                <form
                    id="custody-form"
                    onSubmit={submit}
                    className="flex flex-col gap-4"
                    noValidate
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field
                            label="مستلم العهدة"
                            htmlFor="custody-holder"
                            error={form.errors.holder_name}
                        >
                            <input
                                id="custody-holder"
                                className="field-input"
                                list="custody-holders"
                                maxLength={120}
                                value={form.data.holder_name}
                                aria-invalid={!!form.errors.holder_name}
                                onChange={(event) =>
                                    form.setData(
                                        'holder_name',
                                        event.target.value,
                                    )
                                }
                                autoFocus
                            />
                            <datalist id="custody-holders">
                                {holders.map((name) => (
                                    <option key={name} value={name} />
                                ))}
                            </datalist>
                        </Field>
                        <Field
                            label="الغرض (اختياري)"
                            htmlFor="custody-title"
                            error={form.errors.title}
                        >
                            <input
                                id="custody-title"
                                className="field-input"
                                placeholder="مثال: مصروفات الفرع"
                                maxLength={160}
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />
                        </Field>
                    </div>

                    {!custody && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {isAdmin && (
                                    <Field
                                        label="المنطقة"
                                        htmlFor="custody-region"
                                        error={form.errors.region}
                                    >
                                        <NativeSelect
                                            id="custody-region"
                                            value={form.data.region}
                                            onChange={(event) => {
                                                const next = event.target
                                                    .value as Region;
                                                form.setData((data) => ({
                                                    ...data,
                                                    region: next,
                                                    treasury_id:
                                                        firstTreasuryOf(next),
                                                }));
                                            }}
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
                                <Field
                                    label="تُصرف من خزينة"
                                    htmlFor="custody-treasury"
                                    error={form.errors.treasury_id}
                                >
                                    <NativeSelect
                                        id="custody-treasury"
                                        value={form.data.treasury_id}
                                        onChange={(event) =>
                                            form.setData(
                                                'treasury_id',
                                                event.target.value,
                                            )
                                        }
                                    >
                                        <option value="">اختر الخزينة</option>
                                        {regionTreasuries.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.name}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field
                                    label="قيمة العهدة (د.ل)"
                                    htmlFor="custody-amount"
                                    error={form.errors.amount}
                                >
                                    <MoneyInput
                                        id="custody-amount"
                                        placeholder="0"
                                        value={form.data.amount}
                                        aria-invalid={!!form.errors.amount}
                                        onChange={(event) =>
                                            form.setData(
                                                'amount',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="تاريخ الصرف"
                                    htmlFor="custody-date"
                                    error={form.errors.date}
                                >
                                    <input
                                        id="custody-date"
                                        type="date"
                                        dir="ltr"
                                        className="field-input text-right"
                                        value={form.data.date}
                                        onChange={(event) =>
                                            form.setData(
                                                'date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                            <p className="rounded-md bg-sunk px-3 py-2 text-[13px] text-muted">
                                يصرف المستلم من العهدة ويُدخل الفواتير عليها، ثم
                                «تجديد العهدة» يعوّضه من الخزينة بمجموع الفواتير
                                فتعود العهدة لقيمتها.
                            </p>
                        </>
                    )}
                </form>
            </AppDialog>

            {custody && (
                <ConfirmDialog
                    open={confirming}
                    onOpenChange={setConfirming}
                    message={`ستُحذف عهدة ${custody.label} وحركاتها، ويرجع مبلغها لرصيد الخزينة. لا يمكن حذف عهدة عليها فواتير.`}
                    confirmLabel="حذف العهدة"
                    processing={deleting}
                    onConfirm={remove}
                />
            )}
        </>
    );
}
