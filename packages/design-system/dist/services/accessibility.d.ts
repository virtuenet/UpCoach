/**
 * Accessibility Service
 * WCAG 2.1 AA compliance utilities and helpers for UpCoach applications
 */
export declare class ColorContrast {
    /**
     * Calculate relative luminance of a color
     */
    private static getRelativeLuminance;
    /**
     * Calculate contrast ratio between two colors
     */
    static getContrastRatio(color1: string, color2: string): number;
    /**
     * Check if contrast ratio meets WCAG AA standard (4.5:1)
     */
    static meetsWCAGAA(foreground: string, background: string): boolean;
    /**
     * Check if contrast ratio meets WCAG AAA standard (7:1)
     */
    static meetsWCAGAAA(foreground: string, background: string): boolean;
    /**
     * Check if large text contrast meets WCAG AA standard (3:1)
     */
    static meetsWCAGAALarge(foreground: string, background: string): boolean;
}
export declare class KeyboardNavigation {
    /**
     * Get focusable elements within a container
     */
    static getFocusableElements(container: HTMLElement): HTMLElement[];
    /**
     * Trap focus within a container (useful for modals)
     */
    static trapFocus(container: HTMLElement): () => void;
    /**
     * Create skip links for better keyboard navigation
     */
    static createSkipLink(targetId: string, text?: string): HTMLAnchorElement;
}
export declare class ARIAUtils {
    /**
     * Generate unique ID for ARIA relationships
     */
    static generateId(prefix?: string): string;
    /**
     * Set up ARIA describedby relationship
     */
    static setDescribedBy(element: HTMLElement, descriptionId: string): void;
    /**
     * Set up ARIA labelledby relationship
     */
    static setLabelledBy(element: HTMLElement, labelId: string): void;
    /**
     * Announce message to screen readers
     */
    static announce(message: string, priority?: 'polite' | 'assertive'): void;
    /**
     * Create accessible error message
     */
    static createErrorMessage(fieldId: string, message: string): HTMLElement;
}
export declare class FormAccessibility {
    /**
     * Enhance form with accessibility features
     */
    static enhanceForm(form: HTMLFormElement): void;
    /**
     * Ensure input has proper label
     */
    private static ensureLabel;
    /**
     * Add required field indicator
     */
    private static addRequiredIndicator;
    /**
     * Add validation support
     */
    private static addValidationSupport;
}
export declare class ScreenReaderUtils {
    /**
     * Create screen reader only text
     */
    static createSROnlyText(text: string): HTMLSpanElement;
    /**
     * Add screen reader description to element
     */
    static addDescription(element: HTMLElement, description: string): void;
}
export declare class AccessibilityChecker {
    /**
     * Check page for common accessibility issues
     */
    static checkPage(): {
        errors: string[];
        warnings: string[];
        suggestions: string[];
    };
}
export declare const useA11y: () => {
    ColorContrast: typeof ColorContrast;
    KeyboardNavigation: typeof KeyboardNavigation;
    ARIAUtils: typeof ARIAUtils;
    FormAccessibility: typeof FormAccessibility;
    ScreenReaderUtils: typeof ScreenReaderUtils;
    AccessibilityChecker: typeof AccessibilityChecker;
    announce: typeof ARIAUtils.announce;
    generateId: typeof ARIAUtils.generateId;
};
declare const _default: {
    ColorContrast: typeof ColorContrast;
    KeyboardNavigation: typeof KeyboardNavigation;
    ARIAUtils: typeof ARIAUtils;
    FormAccessibility: typeof FormAccessibility;
    ScreenReaderUtils: typeof ScreenReaderUtils;
    AccessibilityChecker: typeof AccessibilityChecker;
};
export default _default;
//# sourceMappingURL=accessibility.d.ts.map