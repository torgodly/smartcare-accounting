/**
 * Per-viewer browser storage. Every access is wrapped in try/catch because storage can be
 * blocked (private mode, disabled cookies); callers always get a usable fallback.
 */
export function readStored<T>(
    key: string,
    fallback: T,
    isValid: (value: unknown) => value is T,
): T {
    try {
        const raw = window.localStorage.getItem(key);

        if (raw === null) {
            return fallback;
        }

        const parsed: unknown = JSON.parse(raw);

        return isValid(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

/**
 * Save a JSON value; failures are ignored.
 */
export function writeStored(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage is optional.
    }
}
