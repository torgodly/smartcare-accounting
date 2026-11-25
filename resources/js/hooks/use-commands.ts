import type { LucideIcon } from 'lucide-react';
import {
    createContext,
    useContext,
    useEffect,
    useId,
    useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';

/** A page command shown in the palette («إجراءات» or a records group). */
export type Command = {
    id: string;
    label: string;
    group: 'actions' | 'records';
    /** Group heading for records, e.g. «الموظفون», «الفواتير», «المجموعات». */
    recordsLabel?: string;
    /** Extra match text (serial, code, price). */
    keywords?: string[];
    icon?: LucideIcon;
    /** Trailing meta (serial, Money inline). */
    meta?: ReactNode;
    /** Shortcut hint, e.g. 'N'. */
    shortcut?: string;
    disabled?: boolean;
    onSelect: () => void;
};

/**
 * External store behind the palette: registered commands and the open state.
 * Kept outside React state so registering never re-renders the page.
 */
export class CommandStore {
    private registry = new Map<string, Command[]>();
    private listeners = new Set<() => void>();
    private open = false;
    private version = 0;
    private snapshot: Command[] = [];

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    };

    getVersion = (): number => this.version;

    getIsOpen = (): boolean => this.open;

    getCommands = (): Command[] => this.snapshot;

    setOpen = (open: boolean): void => {
        if (this.open !== open) {
            this.open = open;
            this.emit();
        }
    };

    register = (id: string, commands: Command[]): void => {
        this.registry.set(id, commands);
        this.rebuild();
    };

    unregister = (id: string): void => {
        if (this.registry.delete(id)) {
            this.rebuild();
        }
    };

    private rebuild(): void {
        this.snapshot = Array.from(this.registry.values()).flat();
        this.emit();
    }

    private emit(): void {
        this.version += 1;
        this.listeners.forEach((listener) => listener());
    }
}

export const CommandContext = createContext<CommandStore | null>(null);

function useStore(): CommandStore | null {
    return useContext(CommandContext);
}

/**
 * Register page commands while the component is mounted (re-registered on every render, so
 * labels and handlers stay current).
 */
export function useCommands(commands: Command[]): void {
    const store = useStore();
    const id = useId();

    useEffect(() => {
        store?.register(id, commands);
    });

    useEffect(() => {
        return () => store?.unregister(id);
    }, [store, id]);
}

/**
 * Open / close the command palette.
 */
export function useCommandPalette(): {
    open: () => void;
    close: () => void;
    isOpen: boolean;
} {
    const store = useStore();
    const isOpen = useSyncExternalStore(
        store?.subscribe ?? noopSubscribe,
        () => store?.getIsOpen() ?? false,
        () => false,
    );

    return {
        open: () => store?.setOpen(true),
        close: () => store?.setOpen(false),
        isOpen,
    };
}

/** All registered commands (for the palette). */
export function useRegisteredCommands(): Command[] {
    const store = useStore();

    return useSyncExternalStore(
        store?.subscribe ?? noopSubscribe,
        () => store?.getCommands() ?? EMPTY,
        () => EMPTY,
    );
}

const EMPTY: Command[] = [];

function noopSubscribe(): () => void {
    return () => undefined;
}
