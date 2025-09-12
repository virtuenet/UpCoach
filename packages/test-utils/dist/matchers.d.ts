/**
 * Custom test matchers
 */
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
export {};
//# sourceMappingURL=matchers.d.ts.map