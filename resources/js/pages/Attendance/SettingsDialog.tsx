import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { update } from '@/actions/App/Http/Controllers/AttendanceSettingsController';
import { AppDialog } from '@/components/AppDialog';
import { Field } from '@/components/Field';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/money';
import type { AttendanceMode, Employee } from '@/types';
import { MODE_LABELS } from './shared';

type EmployeeSettings = {
    id: number;
    name: string;
    base_salary: number;
    attendance_mode: AttendanceMode;
    shift_start: string;
    shift_end: string;
    absence_day_rate: string;
};

export function SettingsDialog({
    open,
    onOpenChange,
    employees,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: Employee[];
}) {
    const settings = usePage().props.settings;
    const form = useForm<{
        work_start: string;
        work_end: string;
        employees: EmployeeSettings[];
    }>({
        work_start: '08:00',
        work_end: '16:00',
        employees: [],
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        form.clearErrors();
        form.setData({
            work_start: settings?.work_start ?? '08:00',
            work_end: settings?.work_end ?? '16:00',
            employees: employees.map((employee) => ({
                id: employee.id,
                name: employee.name,
                base_salary: employee.base_salary,
                attendance_mode: employee.attendance_mode,
                shift_start: employee.shift_start ?? '',
                shift_end: employee.shift_end ?? '',
                absence_day_rate:
                    employee.absence_day_rate != null
                        ? String(employee.absence_day_rate)
                        : '',
            })),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function setEmployee(index: number, changes: Partial<EmployeeSettings>) {
        form.setData(
            'employees',
            form.data.employees.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...changes } : row,
            ),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            work_start: data.work_start,
            work_end: data.work_end,
            employees: data.employees.map((row) => ({
                id: row.id,
                attendance_mode: row.attendance_mode,
                shift_start: row.shift_start || null,
                shift_end: row.shift_end || null,
                absence_day_rate:
                    row.absence_day_rate === '' ? null : row.absence_day_rate,
            })),
        }));
        form.put(update.url(), {
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
            wide
            title="إعدادات الحضور والانصراف"
            footer={
                <>
                    <Button
                        type="submit"
                        form="attendance-settings"
                        disabled={form.processing}
                    >
                        {form.processing ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
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
                id="attendance-settings"
                onSubmit={submit}
                className="flex flex-col gap-6"
                noValidate
            >
                <section className="flex flex-col gap-3">
                    <h3 className="text-[16px] font-semibold">
                        الدوام الافتراضي لكل الموظفين
                    </h3>
                    <div className="grid max-w-md grid-cols-2 gap-3">
                        <Field
                            label="بداية الدوام"
                            htmlFor="work-start"
                            error={form.errors.work_start}
                        >
                            <input
                                id="work-start"
                                type="time"
                                dir="ltr"
                                className="field-input num"
                                value={form.data.work_start}
                                onChange={(event) =>
                                    form.setData(
                                        'work_start',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            label="نهاية الدوام"
                            htmlFor="work-end"
                            error={form.errors.work_end}
                        >
                            <input
                                id="work-end"
                                type="time"
                                dir="ltr"
                                className="field-input num"
                                value={form.data.work_end}
                                onChange={(event) =>
                                    form.setData('work_end', event.target.value)
                                }
                            />
                        </Field>
                    </div>
                </section>

                <section className="flex flex-col gap-2">
                    <h3 className="text-[16px] font-semibold">
                        طريقة الحضور وخصم الغياب لكل موظف
                    </h3>
                    <p className="text-[13px] text-muted">
                        اترك وقت الدوام فارغاً ليُستخدم الافتراضي، واترك الخصم
                        فارغاً ليُحسب الراتب ÷ 30.
                    </p>
                    <div className="-mx-5 overflow-x-auto">
                        <table className="w-full min-w-[680px] text-[14px]">
                            <thead>
                                <tr className="bg-sunk text-[13px] text-muted">
                                    {[
                                        'الموظف',
                                        'طريقة الحضور',
                                        'بداية',
                                        'نهاية',
                                        'خصم يوم الغياب',
                                    ].map((label) => (
                                        <th
                                            key={label}
                                            className="px-2 py-2 text-start font-semibold first:ps-5"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {form.data.employees.map((row, index) => {
                                    const timed =
                                        row.attendance_mode === 'time';
                                    const none = row.attendance_mode === 'none';

                                    return (
                                        <tr
                                            key={row.id}
                                            className="border-t border-line"
                                        >
                                            <td className="px-2 py-2 ps-5 font-semibold">
                                                {row.name}
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    aria-label={`طريقة حضور ${row.name}`}
                                                    className="field-input h-9 min-w-[160px] text-[14px]"
                                                    value={row.attendance_mode}
                                                    onChange={(event) =>
                                                        setEmployee(index, {
                                                            attendance_mode:
                                                                event.target
                                                                    .value as AttendanceMode,
                                                        })
                                                    }
                                                >
                                                    {(
                                                        Object.keys(
                                                            MODE_LABELS,
                                                        ) as AttendanceMode[]
                                                    ).map((mode) => (
                                                        <option
                                                            key={mode}
                                                            value={mode}
                                                        >
                                                            {MODE_LABELS[mode]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="time"
                                                    dir="ltr"
                                                    aria-label="بداية الدوام"
                                                    className="field-input num h-9 w-[112px] px-2 text-[14px]"
                                                    disabled={!timed}
                                                    placeholder={
                                                        settings?.work_start
                                                    }
                                                    value={row.shift_start}
                                                    onChange={(event) =>
                                                        setEmployee(index, {
                                                            shift_start:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="time"
                                                    dir="ltr"
                                                    aria-label="نهاية الدوام"
                                                    className="field-input num h-9 w-[112px] px-2 text-[14px]"
                                                    disabled={!timed}
                                                    placeholder={
                                                        settings?.work_end
                                                    }
                                                    value={row.shift_end}
                                                    onChange={(event) =>
                                                        setEmployee(index, {
                                                            shift_end:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-2 pe-5">
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    step="0.01"
                                                    min="0"
                                                    dir="ltr"
                                                    aria-label="خصم يوم الغياب"
                                                    className="field-input num h-9 w-[120px] text-right text-[15px] font-semibold"
                                                    disabled={none}
                                                    placeholder={formatNumber(
                                                        Math.round(
                                                            (row.base_salary /
                                                                30) *
                                                                100,
                                                        ) / 100,
                                                    )}
                                                    value={row.absence_day_rate}
                                                    onChange={(event) =>
                                                        setEmployee(index, {
                                                            absence_day_rate:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </form>
        </AppDialog>
    );
}
