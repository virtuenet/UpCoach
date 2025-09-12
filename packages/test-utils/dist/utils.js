import { jsx as _jsx } from "react/jsx-runtime";
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
export function renderWithProviders(ui, { initialRoute = '/', authState = null, theme = 'light', ...renderOptions } = {}) {
    const Wrapper = ({ children }) => {
        return (_jsx(MemoryRouter, { initialEntries: [initialRoute], children: _jsx("div", { "data-theme": theme, children: children }) }));
    };
    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    };
}
// Wait for async operations
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Mock API response
export const mockApiResponse = (data, delay = 0) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                ok: true,
                json: async () => data,
                text: async () => JSON.stringify(data),
                status: 200,
                headers: new Headers(),
            });
        }, delay);
    });
};
// Mock API error
export const mockApiError = (message = 'API Error', status = 500, delay = 0) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                ok: false,
                json: async () => ({ error: message }),
                text: async () => message,
                status,
                headers: new Headers(),
            });
        }, delay);
    });
};
// Test IDs helper
export const testIds = {
    // Auth
    loginForm: 'login-form',
    loginEmail: 'login-email',
    loginPassword: 'login-password',
    loginSubmit: 'login-submit',
    // Navigation
    navbar: 'navbar',
    sidebar: 'sidebar',
    menuToggle: 'menu-toggle',
    // Dashboard
    dashboardStats: 'dashboard-stats',
    revenueChart: 'revenue-chart',
    userChart: 'user-chart',
    // Content
    contentList: 'content-list',
    contentItem: 'content-item',
    contentEditor: 'content-editor',
    // Modals
    modal: 'modal',
    modalClose: 'modal-close',
    modalConfirm: 'modal-confirm',
    modalCancel: 'modal-cancel',
};
// Assert element visible
export const assertVisible = (element) => {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
};
// Assert element not visible
export const assertNotVisible = (element) => {
    if (element) {
        expect(element).not.toBeVisible();
    }
    else {
        expect(element).toBeNull();
    }
};
// Get by test id helper
export const getByTestId = (container, testId) => {
    return container.querySelector(`[data-testid="${testId}"]`);
};
// Fire event helpers
export { fireEvent, screen, waitFor as waitForElement } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
// Performance testing helper
export const measurePerformance = async (fn) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
};
// Accessibility testing helper
export const checkAccessibility = (container) => {
    // Check for ARIA labels
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
        expect(button.getAttribute('aria-label') || button.textContent).toBeTruthy();
    });
    // Check for alt text on images
    const images = container.querySelectorAll('img');
    images.forEach(img => {
        expect(img.getAttribute('alt')).toBeTruthy();
    });
    // Check for form labels
    const inputs = container.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        const id = input.getAttribute('id');
        if (id) {
            const label = container.querySelector(`label[for="${id}"]`);
            expect(label).toBeInTheDocument();
        }
    });
};
// Snapshot testing helper
export const createSnapshot = (component, name) => {
    const { container } = render(component);
    expect(container.firstChild).toMatchSnapshot(name);
};
// Form testing helpers
export const fillForm = async (container, values) => {
    for (const [name, value] of Object.entries(values)) {
        const input = container.querySelector(`[name="${name}"]`);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
};
export const submitForm = (container, formTestId) => {
    const form = formTestId
        ? container.querySelector(`[data-testid="${formTestId}"]`)
        : container.querySelector('form');
    if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
};
//# sourceMappingURL=utils.js.map