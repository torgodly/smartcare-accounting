import { X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import {
    useEffect,
    useLayoutEffect,
    useState,
    useSyncExternalStore,
} from 'react';
import type {
    ComponentType,
    KeyboardEvent,
    ReactNode,
    RefObject,
    UIEvent,
} from 'react';
import { Drawer } from 'vaul';
import { IconButton } from '@/components/IconButton';
import { useIsDesktop, useIsPhone } from '@/hooks/use-media';
import { springSheet } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';
export type DialogLayer = 'base' | 'nested' | 'palette';

const WIDTHS: Record<DialogSize, string> = {
    sm: 'max-w-[440px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[760px]',
    xl: 'max-w-[920px]',
};

/** z-index per layer: scrim / content (§4.6). */
const LAYERS: Record<DialogLayer, { overlay: string; content: string }> = {
    base: { overlay: 'z-60', content: 'z-61' },
    nested: { overlay: 'z-62', content: 'z-62' },
    palette: { overlay: 'z-70', content: 'z-70' },
};

/*
 * Nested-layer registry. A dialog that closes in the same moment a nested dialog opens
 * (e.g. `open={open && !qrOpen}`) is only hidden: it stays mounted so nothing inside it
 * loses state, and it reappears when its `open` comes back.
 */
let nestedOpenCount = 0;
const nestedListeners = new Set<() => void>();

const nestedLayers = {
    subscribe(listener: () => void): () => void {
        nestedListeners.add(listener);

        return () => nestedListeners.delete(listener);
    },
    get: (): number => nestedOpenCount,
    change(delta: number): void {
        nestedOpenCount = Math.max(0, nestedOpenCount + delta);
        nestedListeners.forEach((listener) => listener());
    },
};

type Visibility = 'open' | 'hidden' | 'closed';

/**
 * Open / hidden / closed state for a dialog root. `rootOpen` is what Radix or vaul receives.
 */
function useDialogVisibility(
    open: boolean,
    layer: DialogLayer,
): { rootOpen: boolean; hidden: boolean } {
    const [visibility, setVisibility] = useState<Visibility>(
        open ? 'open' : 'closed',
    );
    const nestedOpen = useSyncExternalStore(
        nestedLayers.subscribe,
        nestedLayers.get,
        () => 0,
    );

    if (open && visibility !== 'open') {
        setVisibility('open');
    }

    useLayoutEffect(() => {
        if (layer !== 'nested' || !open) {
            return;
        }

        nestedLayers.change(1);

        return () => nestedLayers.change(-1);
    }, [layer, open]);

    useEffect(() => {
        if (open) {
            return;
        }

        // Read the live count: a nested dialog opened in this same commit has registered by now.
        const nestedNow = nestedLayers.get();

        if (visibility === 'open') {
            setVisibility(
                layer === 'base' && nestedNow > 0 ? 'hidden' : 'closed',
            );
        } else if (visibility === 'hidden' && nestedNow === 0) {
            setVisibility('closed');
        }
    }, [open, visibility, layer, nestedOpen]);

    return {
        rootOpen: visibility !== 'closed',
        hidden: visibility === 'hidden',
    };
}

/** Ctrl/⌘ + Enter submits; Ctrl/⌘ + Shift + Enter runs the secondary ("and next") submit. */
function submitShortcutHandler(
    onSubmitShortcut?: () => void,
    onSecondarySubmitShortcut?: () => void,
) {
    return (event: KeyboardEvent<HTMLElement>): void => {
        if (
            event.key !== 'Enter' ||
            !(event.metaKey || event.ctrlKey) ||
            event.nativeEvent.isComposing
        ) {
            return;
        }

        const handler = event.shiftKey
            ? onSecondarySubmitShortcut
            : onSubmitShortcut;

        if (handler) {
            event.preventDefault();
            handler();
        }
    };
}

function useScrolled(): [boolean, (event: UIEvent<HTMLElement>) => void] {
    const [scrolled, setScrolled] = useState(false);

    return [
        scrolled,
        (event: UIEvent<HTMLElement>) =>
            setScrolled(event.currentTarget.scrollTop > 2),
    ];
}

type FrameParts = {
    Title: ComponentType<{ className?: string; children: ReactNode }>;
    Description: ComponentType<{ className?: string; children: ReactNode }>;
    Close: ComponentType<{ asChild?: boolean; children: ReactNode }>;
};

const RADIX_PARTS: FrameParts = {
    Title: DialogPrimitive.Title,
    Description: DialogPrimitive.Description,
    Close: DialogPrimitive.Close,
};

const DRAWER_PARTS: FrameParts = {
    Title: Drawer.Title,
    Description: Drawer.Description,
    Close: Drawer.Close,
};

/**
 * Header + scrolling body + footer shared by the dialog, side sheet and bottom sheet.
 */
function DialogFrame({
    parts,
    title,
    description,
    headerIcon,
    footer,
    children,
    bodyClassName,
    phone,
    hideTitle = false,
}: {
    parts: FrameParts;
    title: ReactNode;
    description?: ReactNode;
    headerIcon?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    bodyClassName?: string;
    phone: boolean;
    hideTitle?: boolean;
}) {
    const [scrolled, onScroll] = useScrolled();
    const { Title, Description, Close } = parts;

    return (
        <>
            <div
                data-scrolled={scrolled || undefined}
                className={cn(
                    'flex shrink-0 items-start gap-3 border-b border-transparent transition-colors duration-140 data-scrolled:border-line-1',
                    phone ? 'px-4 pt-3 pb-2' : 'px-6 pt-5 pb-4',
                    hideTitle && 'sr-only',
                )}
            >
                {headerIcon && <div className="shrink-0">{headerIcon}</div>}
                <div className="min-w-0 flex-1">
                    <Title className="text-title-2 text-ink-1">{title}</Title>
                    {description && (
                        <Description className="mt-1 text-[13.5px] leading-5 text-ink-3">
                            {description}
                        </Description>
                    )}
                </div>
                <Close asChild>
                    <IconButton
                        label="إغلاق"
                        icon={X}
                        size="md"
                        variant="ghost"
                        tooltip={false}
                        className="-me-1.5 -mt-1"
                    />
                </Close>
            </div>
            <div
                onScroll={onScroll}
                className={cn(
                    'min-h-0 flex-1 overflow-y-auto overscroll-contain',
                    phone ? 'px-4 py-4' : 'px-6 py-6',
                    !hideTitle && !phone && 'pt-2',
                    bodyClassName,
                )}
            >
                {children}
            </div>
            {footer && (
                <div
                    data-slot="dialog-footer"
                    className={cn(
                        'flex shrink-0 border-t border-line-1 bg-surface',
                        phone
                            ? 'flex-col gap-2 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] *:ms-0! *:w-full [&>a]:h-12 [&>button]:h-12'
                            : 'flex-wrap items-center justify-start gap-2 px-6 py-4',
                    )}
                >
                    {footer}
                </div>
            )}
        </>
    );
}

export type ResponsiveDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    /** 440 / 560 / 760 / 920 (default md). */
    size?: DialogSize;
    /** `side-sheet` applies only at ≥ 1024px (otherwise a dialog). */
    desktop?: 'dialog' | 'side-sheet';
    headerIcon?: ReactNode;
    footer?: ReactNode;
    /** Ctrl/⌘ + Enter from anywhere in the dialog. */
    onSubmitShortcut?: () => void;
    /** Ctrl/⌘ + Shift + Enter ("save and next" variants). */
    onSecondarySubmitShortcut?: () => void;
    initialFocus?: RefObject<HTMLElement | null>;
    /** `nested` sits above another dialog (QR over invoice, confirm over a dialog). */
    layer?: 'base' | 'nested';
    bodyClassName?: string;
    /** Extra classes for the dialog / sheet surface. */
    className?: string;
    children: ReactNode;
};

/**
 * One dialog API for every viewport: a centered Dialog at ≥ 640px, a drag-to-dismiss bottom
 * sheet below 640px, and optionally a side sheet at ≥ 1024px. Keep form state in the page
 * component; this component never resets it. When `open` turns false while a nested dialog
 * opens (`open={open && !qrOpen}`), the dialog is hidden but stays mounted.
 */
export function ResponsiveDialog(props: ResponsiveDialogProps) {
    const isPhone = useIsPhone();
    const isDesktop = useIsDesktop();

    if (isPhone) {
        return <SheetDialog {...props} />;
    }

    if (props.desktop === 'side-sheet' && isDesktop) {
        return <SideSheetDialog {...props} />;
    }

    return <CenteredDialog {...props} />;
}

function focusInitial(
    initialFocus: RefObject<HTMLElement | null> | undefined,
    event: Event,
): void {
    if (initialFocus?.current) {
        event.preventDefault();
        initialFocus.current.focus();
    }
}

function CenteredDialog({
    open,
    onOpenChange,
    title,
    description,
    size = 'md',
    headerIcon,
    footer,
    onSubmitShortcut,
    onSecondarySubmitShortcut,
    initialFocus,
    layer = 'base',
    bodyClassName,
    className,
    children,
}: ResponsiveDialogProps) {
    const { rootOpen, hidden } = useDialogVisibility(open, layer);
    const z = LAYERS[layer];

    return (
        <DialogPrimitive.Root open={rootOpen} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    data-dialog-hidden={hidden || undefined}
                    className={cn(
                        'anim-overlay fixed inset-0 bg-scrim backdrop-blur-[2px]',
                        z.overlay,
                    )}
                />
                <DialogPrimitive.Content
                    dir="rtl"
                    data-dialog-hidden={hidden || undefined}
                    {...(description ? {} : { 'aria-describedby': undefined })}
                    onOpenAutoFocus={(event) =>
                        focusInitial(initialFocus, event)
                    }
                    onKeyDown={submitShortcutHandler(
                        onSubmitShortcut,
                        onSecondarySubmitShortcut,
                    )}
                    className={cn(
                        'anim-dialog fixed inset-0 m-auto flex h-fit max-h-[calc(100dvh-48px)] w-[calc(100%-32px)] flex-col overflow-clip rounded-xl bg-surface text-ink-1 shadow-e4 outline-none',
                        WIDTHS[size],
                        z.content,
                        className,
                    )}
                >
                    <DialogFrame
                        parts={RADIX_PARTS}
                        title={title}
                        description={description}
                        headerIcon={headerIcon}
                        footer={footer}
                        bodyClassName={bodyClassName}
                        phone={false}
                    >
                        {children}
                    </DialogFrame>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function SideSheetDialog({
    open,
    onOpenChange,
    title,
    description,
    headerIcon,
    footer,
    onSubmitShortcut,
    onSecondarySubmitShortcut,
    initialFocus,
    layer = 'base',
    bodyClassName,
    className,
    children,
}: ResponsiveDialogProps) {
    const { rootOpen, hidden } = useDialogVisibility(open, layer);
    const z = LAYERS[layer];

    return (
        <DialogPrimitive.Root open={rootOpen} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {rootOpen && (
                    <DialogPrimitive.Portal forceMount>
                        <DialogPrimitive.Overlay forceMount asChild>
                            <m.div
                                data-dialog-hidden={hidden || undefined}
                                className={cn(
                                    'fixed inset-0 bg-scrim backdrop-blur-[2px]',
                                    z.overlay,
                                )}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{
                                    opacity: 0,
                                    transition: { duration: 0.2 },
                                }}
                            />
                        </DialogPrimitive.Overlay>
                        <DialogPrimitive.Content
                            forceMount
                            asChild
                            dir="rtl"
                            {...(description
                                ? {}
                                : { 'aria-describedby': undefined })}
                            onOpenAutoFocus={(event) =>
                                focusInitial(initialFocus, event)
                            }
                            onKeyDown={submitShortcutHandler(
                                onSubmitShortcut,
                                onSecondarySubmitShortcut,
                            )}
                        >
                            {/* Physical sign: the sheet sits at the left edge (inline-end in RTL) and slides in from the left. */}
                            <m.div
                                data-dialog-hidden={hidden || undefined}
                                className={cn(
                                    'fixed inset-y-3 end-3 flex w-[560px] max-w-[calc(100vw-24px)] flex-col overflow-clip rounded-xl bg-surface text-ink-1 shadow-e4 outline-none',
                                    z.content,
                                    className,
                                )}
                                initial={{ x: '-110%' }}
                                animate={{ x: 0, transition: springSheet }}
                                exit={{
                                    x: '-110%',
                                    transition: {
                                        duration: 0.2,
                                        ease: [0.55, 0, 1, 0.45],
                                    },
                                }}
                            >
                                <DialogFrame
                                    parts={RADIX_PARTS}
                                    title={title}
                                    description={description}
                                    headerIcon={headerIcon}
                                    footer={footer}
                                    bodyClassName={bodyClassName}
                                    phone={false}
                                >
                                    {children}
                                </DialogFrame>
                            </m.div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Portal>
                )}
            </AnimatePresence>
        </DialogPrimitive.Root>
    );
}

function SheetDialog({
    open,
    onOpenChange,
    title,
    description,
    headerIcon,
    footer,
    onSubmitShortcut,
    onSecondarySubmitShortcut,
    initialFocus,
    layer = 'base',
    bodyClassName,
    className,
    children,
}: ResponsiveDialogProps) {
    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            headerIcon={headerIcon}
            footer={footer}
            initialFocus={initialFocus}
            layer={layer}
            bodyClassName={bodyClassName}
            className={className}
            onSubmitShortcut={onSubmitShortcut}
            onSecondarySubmitShortcut={onSecondarySubmitShortcut}
        >
            {children}
        </BottomSheet>
    );
}

export type BottomSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    /** Visually hide the header (the title stays for screen readers). */
    hideHeader?: boolean;
    headerIcon?: ReactNode;
    footer?: ReactNode;
    initialFocus?: RefObject<HTMLElement | null>;
    layer?: DialogLayer;
    /** Fill 92dvh even when the content is short (command palette). */
    fullHeight?: boolean;
    bodyClassName?: string;
    className?: string;
    onSubmitShortcut?: () => void;
    onSecondarySubmitShortcut?: () => void;
    children: ReactNode;
};

/**
 * Phone bottom sheet (vaul): drag, scrim tap or Esc closes it; inputs stay above the keyboard.
 * Footer buttons are full width and stacked (primary first, destructive last).
 */
export function BottomSheet({
    open,
    onOpenChange,
    title,
    description,
    hideHeader = false,
    headerIcon,
    footer,
    initialFocus,
    layer = 'base',
    fullHeight = false,
    bodyClassName,
    className,
    onSubmitShortcut,
    onSecondarySubmitShortcut,
    children,
}: BottomSheetProps) {
    const { rootOpen, hidden } = useDialogVisibility(open, layer);
    const z = LAYERS[layer];

    return (
        <Drawer.Root
            open={rootOpen}
            onOpenChange={onOpenChange}
            direction="bottom"
            repositionInputs
        >
            <Drawer.Portal>
                <Drawer.Overlay
                    data-dialog-hidden={hidden || undefined}
                    className={cn('fixed inset-0 bg-scrim', z.overlay)}
                />
                <Drawer.Content
                    dir="rtl"
                    data-dialog-hidden={hidden || undefined}
                    {...(description ? {} : { 'aria-describedby': undefined })}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();

                        if (initialFocus?.current) {
                            initialFocus.current.focus();
                        } else {
                            (
                                event.currentTarget as HTMLElement | null
                            )?.focus();
                        }
                    }}
                    onKeyDown={submitShortcutHandler(
                        onSubmitShortcut,
                        onSecondarySubmitShortcut,
                    )}
                    className={cn(
                        'fixed inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-surface text-ink-1 shadow-e4 outline-none',
                        fullHeight && 'h-[92dvh]',
                        z.content,
                        className,
                    )}
                >
                    <div
                        aria-hidden
                        className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-ink-4/50"
                    />
                    <DialogFrame
                        parts={DRAWER_PARTS}
                        title={title}
                        description={description}
                        headerIcon={headerIcon}
                        footer={footer}
                        bodyClassName={bodyClassName}
                        phone
                        hideTitle={hideHeader}
                    >
                        {children}
                    </DialogFrame>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
