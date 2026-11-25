import { useForm, usePage } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import { update } from '@/actions/App/Http/Controllers/PayrollController';
import { AppDialog } from '@/components/AppDialog';
import { Field } from '@/components/Field';
import { Money } from '@/components/Money';
import { MoneyInput } from '@/components/MoneyInput';
import { NativeSelect } from '@/components/NativeSelect';
import { Button } from '@/components/ui/button';
import { useMonth } from '@/hooks/use-month';
import { formatNumber, moneyInputValue, parseMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Employee, PaymentMethod, PayrollRow, TreasuryRef } from '@/types';

/**
 * Record bonus, extra deduction and payment for one month, with a live breakdown.
 */
export function PaymentDialog({
    open,
    employee,
    payroll,
    treasuries,
    title,
    onOpenChange,
}: {
    open: boolean;
    employee: Employee;
    payroll: PayrollRow;
    treasuries: TreasuryRef[];
    title: string;
    onOpenChange: (open: boolean) => void;
}) {
    const { month } = useMonth();
    const { paymentMethods } = usePage().props;
    const regionTreasuries = treasuries.filter(
        (treasury) => treasury.region === employee.region,
    );
    const otherTreasuries = treasuries.filter(
        (treasury) => treasury.region !== employee.region,
    );
    const form = useForm({
        bonus: moneyInputValue(payroll.bonus),
        manual_deduction: moneyInputValue(payroll.manual_deduction),
        paid_amount: moneyInputValue(payroll.paid),
        treasury_id: String(
            payroll.treasury_id ?? regionTreasuries[0]?.id ?? '',
        ),
        payment_method: (payroll.payment_method ??
            employee.payment_method) as PaymentMethod,
        account_number: payroll.account_number ?? employee.account_number ?? '',
        note: payroll.note ?? '',
    });

    // Live preview in cents (the only salary math done in the browser).
    const cents = (value: number) => Math.round(value * 100);
    const totalCents =
        cents(payroll.base) +
        cents(parseMoney(form.data.bonus)) -
        cents(parseMoney(form.data.manual_deduction)) -
        cents(payroll.absence_deduction) +
        cents(payroll.carry);
    const paidCents = cents(parseMoney(form.data.paid_amount));
    const total = totalCents / 100;
    const carryOut = (totalCents - paidCents) / 100;

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(update.url([employee.id, month]), {
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
            title={title}
            footer={
                <>
                    <Button
                        type="submit"
                        form="payment-form"
                        disabled={form.processing}
                    >
                        {form.processing ? 'جارٍ الحفظ…' : 'حفظ'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() =>
                            form.setData('paid_amount', String(total))
                        }
                    >
                        دفع المستحق كاملاً
                    </Button>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        إلغاء
                    </Button>
                </>
            }
        >
            <form
                id="payment-form"
                onSubmit={submit}
                className="flex flex-col gap-4"
                noValidate
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field
                        label="مكافأة"
                        htmlFor="pay-bonus"
                        error={form.errors.bonus}
                    >
                        <MoneyInput
                            id="pay-bonus"
                            placeholder="0"
                            value={form.data.bonus}
                            onChange={(event) =>
                                form.setData('bonus', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="خصم إضافي"
                        htmlFor="pay-deduction"
                        error={form.errors.manual_deduction}
                    >
                        <MoneyInput
                            id="pay-deduction"
                            placeholder="0"
                            value={form.data.manual_deduction}
                            onChange={(event) =>
                                form.setData(
                                    'manual_deduction',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    <Field
                        label="المبلغ المدفوع"
                        htmlFor="pay-paid"
                        error={form.errors.paid_amount}
                    >
                        <MoneyInput
                            id="pay-paid"
                            placeholder="0"
                            value={form.data.paid_amount}
                            onChange={(event) =>
                                form.setData('paid_amount', event.target.value)
                            }
                            autoFocus
                        />
                    </Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field
                        label="صُرف من خزينة"
                        htmlFor="pay-treasury"
                        error={form.errors.treasury_id}
                    >
                        <NativeSelect
                            id="pay-treasury"
                            value={form.data.treasury_id}
                            aria-invalid={!!form.errors.treasury_id}
                            onChange={(event) =>
                                form.setData('treasury_id', event.target.value)
                            }
                        >
                            <option value="">اختر الخزينة</option>
                            {regionTreasuries.map((treasury) => (
                                <option key={treasury.id} value={treasury.id}>
                                    {treasury.name}
                                </option>
                            ))}
                            {otherTreasuries.length > 0 && (
                                <optgroup label="مناطق أخرى">
                                    {otherTreasuries.map((treasury) => (
                                        <option
                                            key={treasury.id}
                                            value={treasury.id}
                                        >
                                            {treasury.name} (
                                            {treasury.region_label})
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </NativeSelect>
                    </Field>
                    <Field
                        label="نوع الخلاص"
                        htmlFor="pay-method"
                        error={form.errors.payment_method}
                    >
                        <NativeSelect
                            id="pay-method"
                            value={form.data.payment_method}
                            onChange={(event) =>
                                form.setData(
                                    'payment_method',
                                    event.target.value as PaymentMethod,
                                )
                            }
                        >
                            {paymentMethods.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>
                    <Field
                        label={
                            form.data.payment_method === 'cheque'
                                ? 'رقم الصك'
                                : 'رقم الحساب'
                        }
                        htmlFor="pay-account"
                        error={form.errors.account_number}
                    >
                        <input
                            id="pay-account"
                            dir="ltr"
                            className="field-input text-right font-mono"
                            maxLength={64}
                            value={form.data.account_number}
                            onChange={(event) =>
                                form.setData(
                                    'account_number',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                </div>
                <Field
                    label="ملاحظة (اختياري)"
                    htmlFor="pay-note"
                    error={form.errors.note}
                >
                    <input
                        id="pay-note"
                        className="field-input"
                        placeholder="مثال: خصم غياب يومين"
                        value={form.data.note}
                        maxLength={255}
                        onChange={(event) =>
                            form.setData('note', event.target.value)
                        }
                    />
                </Field>

                <dl className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1.5 rounded-lg bg-sunk px-4 py-3 text-[14px]">
                    <Line label="الأساسي">
                        <Money value={payroll.base} size="breakdown" />
                    </Line>
                    <Line label="+ مكافأة">
                        <Money
                            value={parseMoney(form.data.bonus)}
                            size="breakdown"
                            tone="ok"
                        />
                    </Line>
                    <Line label="− خصم إضافي">
                        <Money
                            value={parseMoney(form.data.manual_deduction)}
                            size="breakdown"
                            tone="bad"
                        />
                    </Line>
                    <Line
                        label={`− خصم الغياب (${payroll.absent_days} يوم × ${formatNumber(payroll.day_rate)})`}
                    >
                        <Money
                            value={payroll.absence_deduction}
                            size="breakdown"
                            tone="bad"
                        />
                    </Line>
                    <Line label="+ مرحّل من الأشهر السابقة">
                        <Money
                            value={payroll.carry}
                            size="breakdown"
                            tone="warn"
                        />
                    </Line>
                    <div className="col-span-2 my-1 border-t border-line" />
                    <Line
                        label={<b className="text-[15px] text-ink">المستحق</b>}
                    >
                        <Money value={total} size="total" />
                    </Line>
                    <Line label="المدفوع">
                        <Money value={paidCents / 100} size="breakdown" />
                    </Line>
                    <div className="col-span-2 my-1 border-t border-line" />
                    <Line
                        label={
                            <b
                                className={cn(
                                    'text-[15px]',
                                    carryOut > 0 ? 'text-warn' : 'text-ok',
                                )}
                            >
                                يُرحّل للشهر القادم
                            </b>
                        }
                    >
                        <Money
                            value={carryOut}
                            size="total"
                            tone={carryOut > 0 ? 'warn' : 'ok'}
                        />
                    </Line>
                </dl>
            </form>
        </AppDialog>
    );
}

function Line({ label, children }: { label: ReactNode; children: ReactNode }) {
    return (
        <>
            <dt className="text-muted">{label}</dt>
            <dd className="text-end">{children}</dd>
        </>
    );
}
