/**
 * Custom test matchers
 */
import { expect } from 'vitest';
// Custom matchers for better assertions
// @ts-expect-error - Vitest expect.extend types not perfectly aligned
expect.extend({
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false,
            };
        }
    },
    toHaveStatus(response, status) {
        const pass = response.status === status;
        if (pass) {
            return {
                message: () => `expected response not to have status ${status}`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected response to have status ${status}, but got ${response.status}`,
                pass: false,
            };
        }
    },
    toBeValidEmail(received) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const pass = emailRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid email`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid email`,
                pass: false,
            };
        }
    },
    toBeValidUrl(received) {
        try {
            new URL(received);
            return {
                message: () => `expected ${received} not to be a valid URL`,
                pass: true,
            };
        }
        catch {
            return {
                message: () => `expected ${received} to be a valid URL`,
                pass: false,
            };
        }
    },
    toContainKeys(received, keys) {
        const receivedKeys = Object.keys(received);
        const pass = keys.every(key => receivedKeys.includes(key));
        if (pass) {
            return {
                message: () => `expected object not to contain keys ${keys.join(', ')}`,
                pass: true,
            };
        }
        else {
            const missingKeys = keys.filter(key => !receivedKeys.includes(key));
            return {
                message: () => `expected object to contain keys ${missingKeys.join(', ')}`,
                pass: false,
            };
        }
    },
});
//# sourceMappingURL=matchers.js.map