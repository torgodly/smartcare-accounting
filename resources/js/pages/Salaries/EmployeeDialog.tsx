import { router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/EmployeeController';
import { AppDialog } from '@/components/AppDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Field } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { formatNumber, parseMoney } from '@/lib/money';
import type { Employee } from '@/types';

type EmployeeForm = {
    name: string;
    job_title: string;
    base_salary: string;
    start_month: string;
    absence_day_rate: string;
};

export function EmployeeDialog({
    open,
    employee,
    defaultStartMonth,
    onOpenChange,
}: {
    open: boolean;
    employee: Employee | null;
    defaultStartMonth: string;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm<EmployeeForm>({
        name: '',
        job_title: '',
        base_salary: '',
        start_month: defaultStartMonth,
        absence_day_rate: '',
    });
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        form.clearErrors();
        form.setData({
            name: employee?.name ?? '',
            job_title: employee?.job_title ?? '',
            base_salary: employee ? String(employee.base_salary) : '',
            start_month: employee?.start_month ?? defaultStartMonth,
            absence_day_rate:
                employee?.absence_day_rate != null
                    ? String(employee.absence_day_rate)
                    : '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, employee?.id]);

    const computedRate =
        Math.round((parseMoney(form.data.base_salary) / 30) * 100) / 100;

    function submit(event: React.FormEvent) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: () => toast('لم يتم الحفظ: راجع الحقول المطلوبة'),
        };

        if (employee) {
            form.put(update.url(employee.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    function remove() {
        if (!employee) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(employee.id), {
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
                open={open}
                onOpenChange={onOpenChange}
                title={employee ? 'تعديل الموظف' : 'موظف جديد'}
                footer={
                    <>
                        <Button
                            type="submit"
                            form="employee-form"
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
                        {employee && (
                            <Button
                                variant="danger"
                                className="ms-auto"
                                onClick={() => setConfirming(true)}
                            >
                                حذف الموظف
                            </Button>
                        )}
                    </>
                }
            >
                <form
                    id="employee-form"
                    onSubmit={submit}
                    className="flex flex-col gap-4"
                    noValidate
                >
                    <Field
                        label="الاسم"
                        htmlFor="employee-name"
                        error={form.errors.name}
                    >
                        <input
                            id="employee-name"
                            className="field-input"
                            value={form.data.name}
                            aria-invalid={!!form.errors.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            autoFocus
                        />
                    </Field>
                    <Field
                        label="الوظيفة (اختياري)"
                        htmlFor="employee-job"
                        error={form.errors.job_title}
                    >
                        <input
                            id="employee-job"
                            className="field-input"
                            value={form.data.job_title}
                            onChange={(event) =>
                                form.setData('job_title', event.target.value)
                            }
                        />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field
                            label="الراتب الأساسي (د.ل)"
                            htmlFor="employee-base"
                            error={form.errors.base_salary}
                        >
                            <MoneyInput
                                id="employee-base"
                                placeholder="0"
                                value={form.data.base_salary}
                                aria-invalid={!!form.errors.base_salary}
                                onChange={(event) =>
                                    form.setData(
                                        'base_salary',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            label="بداية الاحتساب"
                            htmlFor="employee-start"
                            error={form.errors.start_month}
                        >
                            <input
                                id="employee-start"
                                type="month"
                                dir="ltr"
                                className="field-input h-[46px] text-right"
                                value={form.data.start_month}
                                onChange={(event) =>
                                    form.setData(
                                        'start_month',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                    </div>
                    <Field
                        label={
                            <>
                                خصم يوم الغياب (د.ل){' '}
                                <span className="font-normal text-muted">
                                    (فارغ = الراتب ÷ 30)
                                </span>
                            </>
                        }
                        htmlFor="employee-rate"
                        error={form.errors.absence_day_rate}
                    >
                        <MoneyInput
                            id="employee-rate"
                            placeholder={formatNumber(computedRate)}
                            value={form.data.absence_day_rate}
                            onChange={(event) =>
                                form.setData(
                                    'absence_day_rate',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    <p className="rounded-md bg-sunk px-3 py-2 text-[13px] text-muted">
                        تُرحّل المبالغ غير المدفوعة ابتداءً من شهر بداية الاحتساب.
                    </p>
                </form>
            </AppDialog>

            {employee && (
                <ConfirmDialog
                    open={confirming}
                    onOpenChange={setConfirming}
                    message={`سيُحذف ${employee.name} وكل سجلات رواتبه.`}
                    confirmLabel="حذف الموظف"
                    processing={deleting}
                    onConfirm={remove}
                />
            )}
        </>
    );
}
