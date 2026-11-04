import { Form, Head } from '@inertiajs/react';
import { store } from '@/actions/App/Http/Controllers/LoginController';
import { Button } from '@/components/ui/button';

export default function Login() {
    return (
        <>
            <Head title="تسجيل الدخول" />
            <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
                <div className="w-full max-w-[400px] rounded-[10px] border border-t-4 border-line border-t-accent bg-surface p-8">
                    <div className="mb-7 flex flex-col items-center text-center">
                        <img
                            src="/img/logo-full.png"
                            alt="الرعاية الذكية"
                            className="w-[220px] max-w-full"
                        />
                        <h1 className="mt-4 font-display text-[20px] font-semibold">
                            نظام المحاسبة
                        </h1>
                        <p className="mt-0.5 text-[13px] text-gold">
                            الرواتب · الحضور · المشتريات
                        </p>
                    </div>

                    <Form {...store.form()} resetOnError={['password']}>
                        {({ errors, processing }) => (
                            <div className="flex flex-col gap-4">
                                {(errors.email || errors.password) && (
                                    <div
                                        role="alert"
                                        className="rounded-md bg-bad-soft px-3 py-2.5 text-[14px] text-bad"
                                    >
                                        {errors.email ?? errors.password}
                                    </div>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="email"
                                        className="text-[13px] font-semibold"
                                    >
                                        البريد الإلكتروني
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        dir="ltr"
                                        required
                                        autoFocus
                                        autoComplete="username"
                                        className="field-input text-left"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="password"
                                        className="text-[13px] font-semibold"
                                    >
                                        كلمة المرور
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        dir="ltr"
                                        required
                                        autoComplete="current-password"
                                        className="field-input text-left"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="mt-1 w-full"
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'جارٍ الدخول…'
                                        : 'تسجيل الدخول'}
                                </Button>
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}
