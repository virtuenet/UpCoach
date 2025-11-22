/**
 * Accessibility testing setup for Jest
 * Configures axe-core and jest-axe for automated accessibility testing
 */
import '@testing-library/jest-dom';
declare const axeConfig: (html: Element | string) => Promise<import("jest-axe").AxeResults>;
declare global {
    namespace jest {
        interface Matchers<R> {
            toHaveNoViolations(): R;
        }
    }
}
export declare const accessibilityMatchers: {
    toHaveAccessibleName: (element: HTMLElement, expectedName?: string) => {
        pass: boolean;
        message: () => string;
    };
    toBeKeyboardAccessible: (element: HTMLElement) => {
        pass: boolean;
        message: () => string;
    };
    toHaveGoodColorContrast: (element: HTMLElement) => {
        pass: boolean;
        message: () => string;
    };
};
export { axeConfig };
export default axeConfig;
//# sourceMappingURL=setupA11y.d.ts.map