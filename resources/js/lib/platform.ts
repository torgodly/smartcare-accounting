/**
 * True on macOS / iOS (shortcuts show ⌘ instead of Ctrl).
 */
export function isApple(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    const platform =
        (navigator as Navigator & { userAgentData?: { platform?: string } })
            .userAgentData?.platform ??
        navigator.platform ??
        '';

    return /mac|iphone|ipad|ipod/i.test(platform || navigator.userAgent);
}
