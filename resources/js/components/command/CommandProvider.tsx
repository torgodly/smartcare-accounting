import { useState } from 'react';
import type { ReactNode } from 'react';
import { CommandContext, CommandStore } from '@/hooks/use-commands';

/**
 * Holds the command palette store. Mounted once at the app root (app.tsx) so every page can
 * call useCommands / useCommandPalette.
 */
export function CommandProvider({ children }: { children: ReactNode }) {
    const [store] = useState(() => new CommandStore());

    return (
        <CommandContext.Provider value={store}>
            {children}
        </CommandContext.Provider>
    );
}
