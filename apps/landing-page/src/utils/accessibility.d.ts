/**
 * Accessibility utility functions and constants
 */
export declare const ARIA_LIVE: {
    readonly OFF: "off";
    readonly POLITE: "polite";
    readonly ASSERTIVE: "assertive";
};
export declare const ARIA_ROLES: {
    readonly ALERT: "alert";
    readonly BUTTON: "button";
    readonly DIALOG: "dialog";
    readonly NAVIGATION: "navigation";
    readonly MAIN: "main";
    readonly BANNER: "banner";
    readonly CONTENTINFO: "contentinfo";
    readonly SEARCH: "search";
    readonly FORM: "form";
    readonly REGION: "region";
    readonly COMPLEMENTARY: "complementary";
    readonly STATUS: "status";
};
export declare const KEYS: {
    readonly ENTER: "Enter";
    readonly SPACE: " ";
    readonly ESCAPE: "Escape";
    readonly TAB: "Tab";
    readonly ARROW_UP: "ArrowUp";
    readonly ARROW_DOWN: "ArrowDown";
    readonly ARROW_LEFT: "ArrowLeft";
    readonly ARROW_RIGHT: "ArrowRight";
    readonly HOME: "Home";
    readonly END: "End";
};
/**
 * Trap focus within a container element
 */
export declare function trapFocus(container: HTMLElement): () => void;
/**
 * Announce message to screen readers
 */
export declare function announceToScreenReader(message: string, politeness?: keyof typeof ARIA_LIVE): void;
/**
 * Get accessible name for an element
 */
export declare function getAccessibleName(element: HTMLElement): string;
/**
 * Check if element is focusable
 */
export declare function isFocusable(element: HTMLElement): boolean;
/**
 * Get contrast ratio between two colors
 */
export declare function getContrastRatio(color1: string, color2: string): number;
/**
 * Check if contrast meets WCAG standards
 */
export declare function meetsContrastStandard(ratio: number, level?: 'AA' | 'AAA', largeText?: boolean): boolean;
/**
 * Create skip link for keyboard navigation
 */
export declare function createSkipLink(targetId: string, text?: string): HTMLAnchorElement;
/**
 * Debounce function for reducing announcement frequency
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Format time for screen readers
 */
export declare function formatTimeForScreenReader(seconds: number): string;
//# sourceMappingURL=accessibility.d.ts.map