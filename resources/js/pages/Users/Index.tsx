import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/UserController';
import { AppDialog } from '@/components/AppDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Field } from '@/components/Field';
import { RowItem, RowList } from '@/components/RowList';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import AppShell, { PageHeader } from '@/layouts/AppShell';
import type { Region } from '@/types';

type Role = 'admin' | 'user';

type Account = {
    id: number;
    name: string;
    email: string;
    role: Role;
    region: Region | null;
    region_label: string | null;
    is_me: boolean;
};

export default function UsersIndex({ users }: { users: Account[] }) {
    const [dialog, setDialog] = useState<{
        open: boolean;
        user: Account | null;
    }>({ open: false, user: null });

    const openNew = () => setDialog({ open: true, user: null });

    return (
        <AppShell>
            <Head title="المستخدمون" />
            <PageHeader
                title="المستخدمون"
                description="المدير يرى كل المناطق ويدير الحسابات. حساب الشرق يرى بيانات الشرق فقط، وحساب الغرب يرى بيانات الغرب فقط."
                actions={
                    <Button onClick={openNew}>
                        <Plus />
                        حساب
                    </Button>
                }
            />

            <RowList>
                {users.map((user) => (
                    <RowItem
                        key={user.id}
                        onOpen={() => setDialog({ open: true, user })}
                        leading={
                            <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-[15px] font-bold text-accent">
                                {user.name.trim().charAt(0)}
                            </span>
                        }
                        title={
                            <>
                                {user.name}
                                {user.is_me && (
                                    <span className="ms-1.5 text-[12px] font-normal text-muted">
                                        (أنت)
                                    </span>
                                )}
                            </>
                        }
                        meta={
                            <span dir="ltr" className="font-mono">
                                {user.email}
                            </span>
                        }
                        end={
                            user.role === 'admin' ? (
                                <StatusPill kind="accent">
                                    <ShieldCheck className="size-3.5" />
                                    مدير · كل المناطق
                                </StatusPill>
                            ) : (
                                <StatusPill kind="neutral">
                                    {user.region_label}
                                </StatusPill>
                            )
                        }
                    />
                ))}
            </RowList>

            <UserDialog
                open={dialog.open}
                user={dialog.user}
                onOpenChange={(open) =>
                    setDialog((state) => ({ ...state, open }))
                }
            />
        </AppShell>
    );
}

function UserDialog({
    open,
    user,
    onOpenChange,
}: {
    open: boolean;
    user: Account | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { regions } = usePage().props;
    const form = useForm<{
        name: string;
        email: string;
        password: string;
        role: Role;
        region: Region | '';
    }>({ name: '', email: '', password: '', role: 'user', region: 'east' });
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (open) {
            form.clearErrors();
            form.setData({
                name: user?.name ?? '',
                email: user?.email ?? '',
                password: '',
                role: user?.role ?? 'user',
                region: user?.region ?? 'east',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user?.id]);

    function submit(event: FormEvent) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (errors: Record<string, string>) =>
                toast(`لم يتم الحفظ: ${Object.values(errors)[0] ?? ''}`),
        };

        if (user) {
            form.put(update.url(user.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    function remove() {
        if (!user) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(user.id), {
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
                title={user ? 'تعديل الحساب' : 'حساب جديد'}
                footer={
                    <>
                        <Button
                            type="submit"
                            form="user-form"
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
                        {user && !user.is_me && (
                            <Button
                                variant="danger"
                                className="ms-auto"
                                onClick={() => setConfirming(true)}
                            >
                                حذف الحساب
                            </Button>
                        )}
                    </>
                }
            >
                <form
                    id="user-form"
                    onSubmit={submit}
                    className="flex flex-col gap-4"
                    noValidate
                >
                    <Field
                        label="الاسم"
                        htmlFor="user-name"
                        error={form.errors.name}
                    >
                        <input
                            id="user-name"
                            className="field-input"
                            maxLength={120}
                            value={form.data.name}
                            aria-invalid={!!form.errors.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            autoFocus
                        />
                    </Field>
                    <Field
                        label="البريد الإلكتروني (لتسجيل الدخول)"
                        htmlFor="user-email"
                        error={form.errors.email}
                    >
                        <input
                            id="user-email"
                            type="email"
                            dir="ltr"
                            autoComplete="off"
                            className="field-input text-right"
                            value={form.data.email}
                            aria-invalid={!!form.errors.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label={
                            user
                                ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء على الحالية)'
                                : 'كلمة المرور'
                        }
                        htmlFor="user-password"
                        error={form.errors.password}
                    >
                        <input
                            id="user-password"
                            type="password"
                            dir="ltr"
                            autoComplete="new-password"
                            className="field-input text-right"
                            value={form.data.password}
                            aria-invalid={!!form.errors.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                        />
                    </Field>
                    <Field label="الصلاحية">
                        <SegmentedControl<Role>
                            ariaLabel="الصلاحية"
                            fullWidth
                            value={form.data.role}
                            onChange={(value) => form.setData('role', value)}
                            options={[
                                { value: 'user', label: 'حساب منطقة' },
                                { value: 'admin', label: 'مدير (كل المناطق)' },
                            ]}
                        />
                    </Field>
                    {form.data.role === 'user' && (
                        <Field label="المنطقة" error={form.errors.region}>
                            <SegmentedControl<Region>
                                ariaLabel="المنطقة"
                                fullWidth
                                value={form.data.region || null}
                                onChange={(value) =>
                                    form.setData('region', value)
                                }
                                options={regions}
                            />
                        </Field>
                    )}
                    <p className="rounded-md bg-sunk px-3 py-2 text-[13px] text-muted">
                        {form.data.role === 'admin'
                            ? 'المدير يرى بيانات الشرق والغرب معاً، ويضيف الحسابات ويعدّلها.'
                            : 'هذا الحساب يرى ويُدخل بيانات منطقته فقط: الموظفين، الرواتب، المشتريات، المصروفات، العُهد والخزائن.'}
                    </p>
                </form>
            </AppDialog>

            {user && (
                <ConfirmDialog
                    open={confirming}
                    onOpenChange={setConfirming}
                    message={`سيُحذف حساب ${user.name} ولن يتمكن من تسجيل الدخول.`}
                    confirmLabel="حذف الحساب"
                    processing={deleting}
                    onConfirm={remove}
                />
            )}
        </>
    );
}
