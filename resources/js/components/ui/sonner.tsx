import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';
import { useIsPhone } from '@/hooks/use-media';

/**
 * Toasts: inverse surface, white 14/20 text, radius 12, e3. Desktop bottom-left (away from the
 * sidebar), phone top-center under the top bar. 4s, errors 6s. Use toast.success / toast.error.
 */
const Toaster = (props: ToasterProps) => {
    const isPhone = useIsPhone();

    return (
        <Sonner
            theme="light"
            dir="rtl"
            position={isPhone ? 'top-center' : 'bottom-left'}
            offset={isPhone ? 64 : 24}
            mobileOffset={{ top: 64 }}
            duration={4000}
            gap={8}
            className="toaster"
            icons={{
                success: (
                    <CheckCircle2 aria-hidden className="size-[18px] text-ok-500" />
                ),
                error: (
                    <AlertCircle aria-hidden className="size-[18px] text-bad-500" />
                ),
            }}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'flex w-full max-w-[380px] items-center gap-2.5 rounded-[12px] bg-inverse px-4 py-3 text-[14px] leading-5 font-medium text-white shadow-e3 font-sans',
                    icon: 'flex shrink-0 items-center',
                    content: 'min-w-0 flex-1',
                    title: 'text-[14px] leading-5 font-medium',
                    description: 'text-[13px] leading-[18px] text-white/80',
                    actionButton:
                        'shrink-0 rounded-sm bg-white/10 px-2.5 py-1 text-[13px] font-semibold text-white hover:bg-white/20 focus-visible:outline-white',
                    cancelButton:
                        'shrink-0 rounded-sm px-2.5 py-1 text-[13px] font-semibold text-white/80 hover:text-white focus-visible:outline-white',
                    error: 'toast-error',
                },
            }}
            style={{ zIndex: 80 } as ToasterProps['style']}
            {...props}
        />
    );
};

export { Toaster };
