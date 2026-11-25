import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import {
    close,
    replenish,
    topUp,
} from '@/actions/App/Http/Controllers/CustodyController';
import { AppDialog } from '@/components/AppDialog';
import { Field } from '@/components/Field';
import { Money } from '@/components/Money';
import { MoneyInput } from '@/components/MoneyInput';
import { NativeSelect } from '@/components/NativeSelect';
import { Button } from '@/components/ui/button';
import type { Custody, TreasuryRef } from '@/types';

export type MovementMode = 'replenish' | 'top-up' | 'close';

const COPY: Record<MovementMode, { title: string; submit: string }> = {
    replenish: { title: 'تجديد العهدة', submit: 'تجديد العهدة' },
    'top-up': { title: 'زيادة العهدة', submit: 'صرف الزيادة' },
    close: { title: 'إغلاق العهدة', submit: 'إغلاق العهدة' },
};

/**
 * Replenish (pay back what the invoices spent), top up, or close a custody.
 */
export function MovementDialog({
    open,
    mode,
    custody,
    treasuries,
    onOpenChange,
}: {
    open: boolean;
    mode: MovementMode;
    custody: Custody;
    treasuries: TreasuryRef[];
    onOpenChange: (open: boolean) => void;
}) {
    const { today } = usePage().props;
    const form = useForm({
        amount: '',
        date: today,
        note: '',
        treasury_id: String(custody.treasury.id),
    });

    useEffect(() => {
        if (open) {
            form.clearErrors();
            form.setData({
                amount: '',
                date: today,
                note: '',
                treasury_id: String(custody.treasury.id),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode]);

    function submit(event: FormEvent) {
        event.preventDefault();

        const action = { replenish, 'top-up': topUp, close }[mode];

        form.post(action.url(custody.id), {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (errors) =>
                toast(`لم يتم الحفظ: ${Object.values(errors)[0] ?? ''}`),
        });
    }

    return (
        <AppDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`${COPY[mode].title} · ${custody.label}`}
            footer={
                <>
                    <Button
                        type="submit"
                        form="movement-form"
                        variant={mode === 'close' ? 'danger-solid' : 'primary'}
                        disabled={
                            form.processing ||
                            (mode === 'replenish' && custody.pending <= 0)
                        }
                    >
                        {form.processing ? 'جارٍ الحفظ…' : COPY[mode].submit}
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
            <form
                id="movement-form"
                onSubmit={submit}
                className="flex flex-col gap-4"
                noValidate
            >
                {mode === 'replenish' && (
                    <Explain>
                        <Row label="فواتير بانتظار التجديد">
                            {custody.pending_count}
                        </Row>
                        <Row label="يُصرف من الخزينة للمستلم">
                            <Money value={custody.pending} size="total" />
                        </Row>
                        <Row label="النقد مع المستلم بعد التجديد">
                            <Money
                                value={custody.cash + custody.pending}
                                size="breakdown"
                            />
                        </Row>
                    </Explain>
                )}
                {mode === 'close' && (
                    <Explain>
                        <Row label="فواتير تُعتمد دون تعويض">
                            {custody.pending_count}
                        </Row>
                        <Row
                            label={
                                custody.cash >= 0
                                    ? 'يرجّعه المستلم للخزينة'
                                    : 'تدفعه الخزينة للمستلم (صرف زائد)'
                            }
                        >
                            <Money
                                value={Math.abs(custody.cash)}
                                size="total"
                                tone={custody.cash >= 0 ? 'ok' : 'warn'}
                            />
                        </Row>
                    </Explain>
                )}

                {mode === 'top-up' && (
                    <Field
                        label="مبلغ الزيادة (د.ل)"
                        htmlFor="movement-amount"
                        error={form.errors.amount}
                    >
                        <MoneyInput
                            id="movement-amount"
                            placeholder="0"
                            value={form.data.amount}
                            aria-invalid={!!form.errors.amount}
                            onChange={(event) =>
                                form.setData('amount', event.target.value)
                            }
                            autoFocus
                        />
                    </Field>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {mode !== 'close' && (
                        <Field
                            label="من خزينة"
                            htmlFor="movement-treasury"
                            error={form.errors.treasury_id}
                        >
                            <NativeSelect
                                id="movement-treasury"
                                value={form.data.treasury_id}
                                onChange={(event) =>
                                    form.setData(
                                        'treasury_id',
                                        event.target.value,
                                    )
                                }
                            >
                                {treasuries.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.region_label})
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                    )}
                    <Field
                        label="التاريخ"
                        htmlFor="movement-date"
                        error={form.errors.date}
                    >
                        <input
                            id="movement-date"
                            type="date"
                            dir="ltr"
                            className="field-input text-right"
                            value={form.data.date}
                            onChange={(event) =>
                                form.setData('date', event.target.value)
                            }
                        />
                    </Field>
                </div>
                <Field
                    label="ملاحظة (اختياري)"
                    htmlFor="movement-note"
                    error={form.errors.note}
                >
                    <input
                        id="movement-note"
                        className="field-input"
                        maxLength={255}
                        value={form.data.note}
                        onChange={(event) =>
                            form.setData('note', event.target.value)
                        }
                    />
                </Field>
            </form>
        </AppDialog>
    );
}

function Explain({ children }: { children: ReactNode }) {
    return (
        <dl className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1.5 rounded-lg bg-sunk px-4 py-3 text-[14px]">
            {children}
        </dl>
    );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <>
            <dt className="text-muted">{label}</dt>
            <dd className="num text-end font-semibold">{children}</dd>
        </>
    );
}
