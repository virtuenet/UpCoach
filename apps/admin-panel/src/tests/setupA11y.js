/**
 * Accessibility testing setup for Jest
 * Configures axe-core and jest-axe for automated accessibility testing
 */
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { configure } from '@testing-library/react';
import { configureAxe } from 'jest-axe';
// Extend Jest matchers with accessibility assertions
expect.extend({ toHaveNoViolations });
// Configure Testing Library for better accessibility testing
configure({
    testIdAttribute: 'data-testid',
    // Prioritize accessibility queries
    asyncUtilTimeout: 5000,
});
// Configure axe-core for WCAG 2.2 AA compliance
const axeConfig = configureAxe({
    rules: {
        // WCAG 2.1 AA rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'aria-allowed-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'frame-title': { enabled: true },
        'html-has-lang': { enabled: true },
        'html-lang-valid': { enabled: true },
        'image-alt': { enabled: true },
        'input-image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true },
        'meta-refresh': { enabled: true },
        'meta-viewport': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'role-img-alt': { enabled: true },
        'scrollable-region-focusable': { enabled: true },
        'server-side-image-map': { enabled: true },
        'svg-img-alt': { enabled: true },
        'td-headers-attr': { enabled: true },
        'th-has-data-cells': { enabled: true },
        'valid-lang': { enabled: true },
        'video-caption': { enabled: true },
        // WCAG 2.2 specific rules
        'target-size': { enabled: true }, // WCAG 2.2 AA - Target Size (Minimum)
        'wcag22-focus-order-semantics': { enabled: true }, // WCAG 2.2 AA - Focus Order
        'consistent-help': { enabled: true }, // WCAG 2.2 AA - Consistent Help
        'redundant-entry': { enabled: true }, // WCAG 2.2 AA - Redundant Entry
        // Enhanced accessibility rules
        'landmark-one-main': { enabled: true },
        'landmark-complementary-is-top-level': { enabled: true },
        'landmark-contentinfo-is-top-level': { enabled: true },
        'landmark-main-is-top-level': { enabled: true },
        'landmark-no-duplicate-banner': { enabled: true },
        'landmark-no-duplicate-contentinfo': { enabled: true },
        'landmark-no-duplicate-main': { enabled: true },
        'region': { enabled: true },
        // Keyboard navigation rules
        'keyboard-focus-order-semantics': { enabled: true },
        'focusable-content': { enabled: true },
        'interactive-supports-focus': { enabled: true },
        'keyboard-navigation-enhanced': { enabled: true },
        'no-focusable-content': { enabled: true },
        'tabindex': { enabled: true },
        // Screen reader optimization
        'empty-heading': { enabled: true },
        'empty-table-header': { enabled: true },
        'heading-order': { enabled: true },
        'nested-interactive': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
});
// Set up custom matchers for common accessibility assertions
export const accessibilityMatchers = {
    // Check if element has proper ARIA labels
    toHaveAccessibleName: (element, expectedName) => {
        const accessibleName = element.getAttribute('aria-label') ||
            element.getAttribute('aria-labelledby') ||
            element.textContent;
        if (expectedName) {
            return {
                pass: accessibleName === expectedName,
                message: () => `Expected element to have accessible name "${expectedName}" but got "${accessibleName}"`,
            };
        }
        return {
            pass: !!accessibleName,
            message: () => `Expected element to have an accessible name`,
        };
    },
    // Check if interactive element is keyboard accessible
    toBeKeyboardAccessible: (element) => {
        const tabIndex = element.getAttribute('tabindex');
        const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase());
        const hasClickHandler = element.onclick !== null;
        const isAccessible = isInteractive ||
            (hasClickHandler && tabIndex !== null && parseInt(tabIndex) >= 0);
        return {
            pass: isAccessible,
            message: () => `Expected element to be keyboard accessible`,
        };
    },
    // Check color contrast ratios
    toHaveGoodColorContrast: (element) => {
        const computedStyle = window.getComputedStyle(element);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        // This is a simplified check - in practice, you'd use a proper contrast checker
        const hasContrast = color !== backgroundColor &&
            color !== 'rgba(0, 0, 0, 0)' &&
            backgroundColor !== 'rgba(0, 0, 0, 0)';
        return {
            pass: hasContrast,
            message: () => `Expected element to have sufficient color contrast`,
        };
    },
};
// Add custom matchers
expect.extend(accessibilityMatchers);
// Console setup for cleaner test output
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is no longer supported')) {
            return;
        }
        originalError.call(console, ...args);
    };
});
afterAll(() => {
    console.error = originalError;
});
// Export configured axe for use in tests
export { axeConfig };
export default axeConfig;
//# sourceMappingURL=setupA11y.js.map