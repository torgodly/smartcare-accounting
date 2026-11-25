import type { ReactNode } from 'react';
import { ResponsiveDialog } from '@/components/ResponsiveDialog';

/**
 * Legacy wrapper around ResponsiveDialog (`wide` → size lg, otherwise md).
 * New code uses ResponsiveDialog directly. Removed in the cleanup pass.
 */
export function AppDialog({
    open,
    onOpenChange,
    title,
    description,
    wide = false,
    children,
    footer,
    className,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    wide?: boolean;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            size={wide ? 'lg' : 'md'}
            footer={footer}
            className={className}
        >
            {children}
        </ResponsiveDialog>
    );
}
