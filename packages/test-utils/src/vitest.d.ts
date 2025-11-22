declare module 'vitest' {
  export function afterEach(fn: () => void): void;
  export function beforeAll(fn: () => void): void;
  export function afterAll(fn: () => void): void;
  export function expect(value: any): {
    toBe: (expected: any) => void;
    toEqual: (expected: any) => void;
    toBeDefined: () => void;
    toBeUndefined: () => void;
    extend: (matchers: any) => void;
  };
  export const vi: {
    fn: () => any;
    mock: () => any;
    resetAllMocks: () => void;
    clearAllMocks: () => void;
  };
}