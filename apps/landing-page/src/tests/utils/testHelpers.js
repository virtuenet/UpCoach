import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Custom render function with providers
export function renderWithProviders(ui, options) {
    // Add any global providers here
    const Wrapper = ({ children }) => {
        return _jsx(_Fragment, { children: children });
    };
    return {
        user: userEvent.setup(),
        ...render(ui, { wrapper: Wrapper, ...options }),
    };
}
// Mock analytics tracking
export const mockAnalytics = {
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
    trackAppDownload: jest.fn(),
    trackFormSubmit: jest.fn(),
    trackModalView: jest.fn(),
    trackPricingView: jest.fn(),
    trackPlanSelect: jest.fn(),
    trackCTAClick: jest.fn(),
};
// Mock API responses
export const mockApiResponses = {
    leadCapture: {
        success: {
            success: true,
            message: 'Lead captured successfully',
            data: {
                id: 'lead-123',
                email: 'test@example.com',
                createdAt: new Date().toISOString(),
            },
        },
        error: {
            success: false,
            error: 'Failed to capture lead',
        },
    },
    newsletter: {
        success: {
            success: true,
            message: 'Subscribed successfully',
        },
        error: {
            success: false,
            error: 'Email already subscribed',
        },
    },
};
// Test data generators
export const generateTestUser = (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    ...overrides,
});
export const generateTestLead = (overrides = {}) => ({
    name: 'John Doe',
    email: 'john@company.com',
    company: 'Acme Inc',
    role: 'manager',
    interest: 'productivity',
    marketingConsent: true,
    source: 'test',
    ...overrides,
});
// Accessibility testing helpers
export const checkAccessibility = async (container) => {
    const results = [];
    // Check for alt text on images
    const images = container.querySelectorAll('img');
    images.forEach(img => {
        if (!img.alt) {
            results.push(`Image missing alt text: ${img.src}`);
        }
    });
    // Check for form labels
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const id = input.id;
        if (id) {
            const label = container.querySelector(`label[for="${id}"]`);
            if (!label) {
                results.push(`Input missing label: ${id}`);
            }
        }
    });
    // Check for heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach(heading => {
        const level = parseInt(heading.tagName[1]);
        if (level > lastLevel + 1) {
            results.push(`Heading hierarchy issue: ${heading.tagName} after H${lastLevel}`);
        }
        lastLevel = level;
    });
    return results;
};
// Performance testing helpers
export const measureRenderTime = async (component) => {
    const start = performance.now();
    act(() => {
        render(component());
    });
    const end = performance.now();
    return end - start;
};
// Mock IntersectionObserver with controls
export class MockIntersectionObserver {
    constructor() {
        this.callbacks = new Map();
        this.observer = {
            observe: (_target) => {
                // Store callback for manual triggering
            },
            unobserve: (target) => {
                this.callbacks.delete(target);
            },
            disconnect: () => {
                this.callbacks.clear();
            },
            takeRecords: () => [],
            root: null,
            rootMargin: '',
            thresholds: [],
        };
        global.IntersectionObserver = jest.fn(callback => {
            this.callbacks.set(document.body, callback);
            return this.observer;
        });
    }
    triggerIntersection(entries) {
        this.callbacks.forEach(callback => {
            callback(entries, this.observer);
        });
    }
}
// Wait for animations to complete
export const waitForAnimation = (duration = 1000) => new Promise(resolve => setTimeout(resolve, duration));
// Mock fetch with response queue
export class MockFetch {
    constructor() {
        this.responses = [];
        this.callCount = 0;
    }
    addResponse(response, error = false) {
        this.responses.push({ response, error });
        return this;
    }
    init() {
        global.fetch = jest.fn((_input, _init) => {
            const { response, error } = this.responses[this.callCount] || {
                response: {},
                error: false,
            };
            this.callCount++;
            if (error) {
                return Promise.reject(new Error(response));
            }
            return Promise.resolve({
                ok: true,
                json: async () => response,
                ...response,
            });
        });
    }
    reset() {
        this.responses = [];
        this.callCount = 0;
        global.fetch.mockClear();
    }
    getCalls() {
        return global.fetch.mock.calls;
    }
}
//# sourceMappingURL=testHelpers.js.map