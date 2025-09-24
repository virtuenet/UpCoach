/**
 * Accessibility utility functions and constants
 */
// ARIA live region politeness levels
export const ARIA_LIVE = {
    OFF: 'off',
    POLITE: 'polite',
    ASSERTIVE: 'assertive',
};
// Common ARIA roles
export const ARIA_ROLES = {
    ALERT: 'alert',
    BUTTON: 'button',
    DIALOG: 'dialog',
    NAVIGATION: 'navigation',
    MAIN: 'main',
    BANNER: 'banner',
    CONTENTINFO: 'contentinfo',
    SEARCH: 'search',
    FORM: 'form',
    REGION: 'region',
    COMPLEMENTARY: 'complementary',
    STATUS: 'status',
};
// Keyboard codes
export const KEYS = {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
};
/**
 * Trap focus within a container element
 */
export function trapFocus(container) {
    const focusableElements = container.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    function handleKeyDown(e) {
        if (e.key !== KEYS.TAB)
            return;
        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
            }
        }
        else {
            // Tab
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable?.focus();
            }
        }
    }
    container.addEventListener('keydown', handleKeyDown);
    // Focus first element
    firstFocusable?.focus();
    // Return cleanup function
    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
}
/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message, politeness = 'POLITE') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', ARIA_ROLES.STATUS);
    announcement.setAttribute('aria-live', ARIA_LIVE[politeness]);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}
/**
 * Get accessible name for an element
 */
export function getAccessibleName(element) {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel)
        return ariaLabel;
    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
        const labelElement = document.getElementById(labelledBy);
        if (labelElement)
            return labelElement.textContent || '';
    }
    // Check for associated label (for form inputs)
    if (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement) {
        const id = element.id;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label)
                return label.textContent || '';
        }
    }
    // Check for text content
    return element.textContent || '';
}
/**
 * Check if element is focusable
 */
export function isFocusable(element) {
    if (element.tabIndex >= 0)
        return true;
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (focusableTags.includes(element.tagName)) {
        return !element.disabled;
    }
    return false;
}
/**
 * Get contrast ratio between two colors
 */
export function getContrastRatio(color1, color2) {
    // Convert hex to RGB
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2)
        return 0;
    // Calculate relative luminance
    const lum1 = getRelativeLuminance(rgb1);
    const lum2 = getRelativeLuminance(rgb2);
    // Calculate contrast ratio
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}
function getRelativeLuminance(rgb) {
    const { r, g, b } = rgb;
    const sRGB = [r / 255, g / 255, b / 255];
    const rgb2 = sRGB.map(val => {
        if (val <= 0.03928) {
            return val / 12.92;
        }
        return Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb2[0] + 0.7152 * rgb2[1] + 0.0722 * rgb2[2];
}
/**
 * Check if contrast meets WCAG standards
 */
export function meetsContrastStandard(ratio, level = 'AA', largeText = false) {
    if (level === 'AA') {
        return largeText ? ratio >= 3 : ratio >= 4.5;
    }
    else {
        return largeText ? ratio >= 4.5 : ratio >= 7;
    }
}
/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(targetId, text = 'Skip to main content') {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.className =
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50';
    skipLink.textContent = text;
    skipLink.addEventListener('click', e => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.tabIndex = -1;
            target.focus();
            target.scrollIntoView();
        }
    });
    return skipLink;
}
/**
 * Debounce function for reducing announcement frequency
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
/**
 * Format time for screen readers
 */
export function formatTimeForScreenReader(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (hours > 0)
        parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0)
        parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (secs > 0 || parts.length === 0)
        parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
    return parts.join(', ');
}
//# sourceMappingURL=accessibility.js.map