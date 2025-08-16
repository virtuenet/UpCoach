/**
 * Custom test matchers
 */

import { expect } from 'vitest';

// Custom matchers for better assertions
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveStatus(response: any, status: number) {
    const pass = response.status === status;
    if (pass) {
      return {
        message: () => `expected response not to have status ${status}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to have status ${status}, but got ${response.status}`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeValidUrl(received: string) {
    try {
      new URL(received);
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true,
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },

  toContainKeys(received: object, keys: string[]) {
    const receivedKeys = Object.keys(received);
    const pass = keys.every(key => receivedKeys.includes(key));
    if (pass) {
      return {
        message: () => `expected object not to contain keys ${keys.join(', ')}`,
        pass: true,
      };
    } else {
      const missingKeys = keys.filter(key => !receivedKeys.includes(key));
      return {
        message: () => `expected object to contain keys ${missingKeys.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Type declarations for TypeScript
declare global {
  namespace Vi {
    interface Assertion {
      toBeWithinRange(floor: number, ceiling: number): void;
      toHaveStatus(status: number): void;
      toBeValidEmail(): void;
      toBeValidUrl(): void;
      toContainKeys(keys: string[]): void;
    }
    interface AsymmetricMatchersContaining {
      toBeWithinRange(floor: number, ceiling: number): void;
      toHaveStatus(status: number): void;
      toBeValidEmail(): void;
      toBeValidUrl(): void;
      toContainKeys(keys: string[]): void;
    }
  }
}