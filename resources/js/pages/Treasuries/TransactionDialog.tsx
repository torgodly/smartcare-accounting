import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { store } from '@/actions/App/Http/Controllers/TreasuryTransactionController';
import { AppDialog } from '@/components/AppDialog';
import { Field } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { NativeSelect } from '@/components/NativeSelect';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Button } from '@/components/ui/button';
import type { TreasuryRef } from '@/types';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer';

const TITLES: Record<TransactionType, string> = {
    deposit: 'إيداع',
    withdrawal: 'سحب',
    transfer: 'تحويل إلى خزينة أخرى',
};

/**
 * Deposit into, withdraw from or transfer out of a treasury.
 */
export function TransactionDialog({
    open,
    treasury,
    treasuries,
    initialType,
    onOpenChange,
}: {
    open: boolean;
    treasury: TreasuryRef;
    treasuries: TreasuryRef[];
    initialType: TransactionType;
    onOpenChange: (open: boolean) => void;
}) {
    const { today } = usePage().props;
    const targets = treasuries.filter((item) => item.id !== treasury.id);
    const form = useForm({
        type: initialType,
        amount: '',
        date: today,
        note: '',
        to_treasury_id: '',
    });

    useEffect(() => {
        if (open) {
            form.clearErrors();
            form.setData({
                type: initialType,
                amount: '',
                date: today,
                note: '',
                to_treasury_id: String(targets[0]?.id ?? ''),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialType, treasury.id]);

    function submit(event: FormEvent) {
        event.preventDefault();

        form.post(store.url(treasury.id), {
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
            title={`${TITLES[form.data.type]} · ${treasury.name}`}
            footer={
                <>
                    <Button
                        type="submit"
                        form="transaction-form"
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
                </>
            }
        >
            <form
                id="transaction-form"
                onSubmit={submit}
                className="flex flex-col gap-4"
                noValidate
            >
                <SegmentedControl<TransactionType>
                    ariaLabel="نوع الحركة"
                    fullWidth
                    value={form.data.type}
                    onChange={(value) => form.setData('type', value)}
                    options={[
                        { value: 'deposit', label: 'إيداع' },
                        { value: 'withdrawal', label: 'سحب' },
                        { value: 'transfer', label: 'تحويل' },
                    ]}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                        label="المبلغ (د.ل)"
                        htmlFor="transaction-amount"
                        error={form.errors.amount}
                    >
                        <MoneyInput
                            id="transaction-amount"
                            placeholder="0"
                            value={form.data.amount}
                            aria-invalid={!!form.errors.amount}
                            onChange={(event) =>
                                form.setData('amount', event.target.value)
                            }
                            autoFocus
                        />
                    </Field>
                    <Field
                        label="التاريخ"
                        htmlFor="transaction-date"
                        error={form.errors.date}
                    >
                        <input
                            id="transaction-date"
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
                {form.data.type === 'transfer' && (
                    <Field
                        label="إلى خزينة"
                        htmlFor="transaction-target"
                        error={form.errors.to_treasury_id}
                    >
                        <NativeSelect
                            id="transaction-target"
                            value={form.data.to_treasury_id}
                            onChange={(event) =>
                                form.setData(
                                    'to_treasury_id',
                                    event.target.value,
                                )
                            }
                        >
                            {targets.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.region_label})
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>
                )}
                <Field
                    label="البيان (اختياري)"
                    htmlFor="transaction-note"
                    error={form.errors.note}
                >
                    <input
                        id="transaction-note"
                        className="field-input"
                        maxLength={255}
                        placeholder="مثال: إيداع من الإدارة"
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
