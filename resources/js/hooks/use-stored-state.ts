import { useState } from 'react';
import { readStored, writeStored } from '@/lib/storage';

/**
 * State persisted per viewer in localStorage (falls back to `initial` when storage is
 * unavailable or the stored value is invalid).
 */
export function useStoredState<T>(
    key: string,
    initial: T,
    isValid: (value: unknown) => value is T,
): [T, (next: T) => void] {
    const [value, setValue] = useState<T>(() =>
        readStored(key, initial, isValid),
    );

    function update(next: T): void {
        setValue(next);
        writeStored(key, next);
    }

    return [value, update];
}
