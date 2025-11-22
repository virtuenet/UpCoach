/**
 * Global type declarations and augmentations
 */

import { Model, FindOptions, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';

// Global augmentation for all model constructor types
declare global {
  interface ModelConstructor {
    findByPk(identifier: unknown, options?: FindOptions): Promise<unknown>;
    findOne(options?: FindOptions): Promise<unknown>;
    findAll(options?: FindOptions): Promise<any[]>;
    findAndCountAll(options?: FindOptions): Promise<{ rows: unknown[]; count: number }>;
    create(values?: unknown, options?: CreateOptions): Promise<unknown>;
    bulkCreate(records: unknown[], options?: unknown): Promise<any[]>;
    update(values: unknown, options: UpdateOptions): Promise<[number]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: unknown): Promise<number>;
    max(field: string, options?: unknown): Promise<unknown>;
    min(field: string, options?: unknown): Promise<unknown>;
    sum(field: string, options?: unknown): Promise<number>;
    scope(scopes?: string | string[] | any): unknown;
    findOrCreate(options: unknown): Promise<[any, boolean]>;
    init(attributes: unknown, options: unknown): typeof Model;
    sequelize: unknown;
    belongsTo(target: unknown, options?: unknown): unknown;
    hasMany(target: unknown, options?: unknown): unknown;
    hasOne(target: unknown, options?: unknown): unknown;
    belongsToMany(target: unknown, options?: unknown): unknown;
  }
}

// Extend all class constructors to include Sequelize model methods
declare global {
  interface Function extends ModelConstructor {}
}

// Add missing Jest globals for test files
declare global {
  namespace jest {
    interface MockInstance<T = any, Y extends any[] = any> {
      mockReturnValue(value: T): MockInstance<T, Y>;
      mockReturnValueOnce(value: T): MockInstance<T, Y>;
      mockResolvedValue(value: T): MockInstance<T, Y>;
      mockResolvedValueOnce(value: T): MockInstance<T, Y>;
      mockRejectedValue(value: unknown): MockInstance<T, Y>;
      mockRejectedValueOnce(value: unknown): MockInstance<T, Y>;
      mockImplementation(fn?: (...args: Y) => T): MockInstance<T, Y>;
      mockImplementationOnce(fn?: (...args: Y) => T): MockInstance<T, Y>;
      mockReset(): MockInstance<T, Y>;
      mockRestore(): void;
      mockClear(): MockInstance<T, Y>;
    }
  }

  const jest: {
    fn: () => jest.MockInstance;
    mock: (moduleName: string, factory?: () => unknown, options?: { virtual?: boolean }) => void;
    unmock: (moduleName: string) => void;
    doMock: (moduleName: string, factory?: () => unknown, options?: { virtual?: boolean }) => void;
    dontMock: (moduleName: string) => void;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
    clearAllTimers: () => void;
    useFakeTimers: () => void;
    useRealTimers: () => void;
    runAllTimers: () => void;
    runOnlyPendingTimers: () => void;
    advanceTimersByTime: (msToRun: number) => void;
    resetModules: () => void;
    spyOn: (object: unknown, method: unknown) => jest.MockInstance;
  };

  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const test: (name: string, fn: () => void | Promise<void>) => void;
  const expect: unknown;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
}

// Declare optional modules that might not be installed
declare module 'puppeteer' {
  const puppeteer: unknown;
  export = puppeteer;
}

declare module '@simplewebauthn/server' {
  export const generateRegistrationOptions: unknown;
  export const verifyRegistrationResponse: unknown;
  export const generateAuthenticationOptions: unknown;
  export const verifyAuthenticationResponse: unknown;
}

export {};