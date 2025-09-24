/**
 * Admin Panel Test Setup
 * Configures Jest for React component testing with accessibility support
 */
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { configure } from '@testing-library/react';
import { configureAxe } from 'jest-axe';
// Extend Jest matchers with accessibility and DOM assertions
expect.extend({ toHaveNoViolations });
// Configure Testing Library for better React testing
configure({
    testIdAttribute: 'data-testid',
    asyncUtilTimeout: 5000,
});
// Configure axe-core for WCAG 2.2 AA compliance
const axeConfig = configureAxe({
    rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'aria-allowed-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'button-name': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'landmark-one-main': { enabled: true },
        'region': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
});
// Global test utilities - Types are now handled by @types/jest-axe
// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));
// Suppress console warnings during tests
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
                args[0].includes('Warning: React.createFactory() is deprecated'))) {
            return;
        }
        originalError.call(console, ...args);
    };
});
afterAll(() => {
    console.error = originalError;
});
export { axeConfig };
//# sourceMappingURL=setup.js.map