/**
 * Global type declarations and augmentations
 */

import { Model, FindOptions, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';

// Global augmentation for all model constructor types
declare global {
  interface ModelConstructor {
    findByPk(identifier: any, options?: FindOptions): Promise<any>;
    findOne(options?: FindOptions): Promise<any>;
    findAll(options?: FindOptions): Promise<any[]>;
    findAndCountAll(options?: FindOptions): Promise<{ rows: any[]; count: number }>;
    create(values?: any, options?: CreateOptions): Promise<any>;
    bulkCreate(records: any[], options?: any): Promise<any[]>;
    update(values: any, options: UpdateOptions): Promise<[number]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: any): Promise<number>;
    max(field: string, options?: any): Promise<any>;
    min(field: string, options?: any): Promise<any>;
    sum(field: string, options?: any): Promise<number>;
    scope(scopes?: string | string[] | any): any;
    findOrCreate(options: any): Promise<[any, boolean]>;
    init(attributes: any, options: any): typeof Model;
    sequelize: any;
    belongsTo(target: any, options?: any): any;
    hasMany(target: any, options?: any): any;
    hasOne(target: any, options?: any): any;
    belongsToMany(target: any, options?: any): any;
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
      mockRejectedValue(value: any): MockInstance<T, Y>;
      mockRejectedValueOnce(value: any): MockInstance<T, Y>;
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
    spyOn: (object: any, method: any) => jest.MockInstance;
  };

  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const test: (name: string, fn: () => void | Promise<void>) => void;
  const expect: any;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
}

// Declare optional modules that might not be installed
declare module 'puppeteer' {
  const puppeteer: any;
  export = puppeteer;
}

declare module '@simplewebauthn/server' {
  export const generateRegistrationOptions: any;
  export const verifyRegistrationResponse: any;
  export const generateAuthenticationOptions: any;
  export const verifyAuthenticationResponse: any;
}

export {};