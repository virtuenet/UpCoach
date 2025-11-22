/**
 * @upcoach/utils
 * Shared utility functions
 */

// Additional utility functions

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(...objects: Partial<T>[]): T {
  const result = {} as T;

  for (const obj of objects) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key];
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          result[key] = deepMerge(result[key] || {}, val);
        } else {
          result[key] = val as any;
        }
      }
    }
  }

  return result;
}

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, maxDelay = 10000, factor = 2, onRetry } = options;

  let lastError: Error;
  let currentDelay = delay;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < retries) {
        if (onRetry) {
          onRetry(lastError, i + 1);
        }

        await sleep(currentDelay);
        currentDelay = Math.min(currentDelay * factor, maxDelay);
      }
    }
  }

  throw lastError!;
}

/**
 * Memoize function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Rate limiter
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(
    private maxConcurrent: number,
    private interval: number
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();

    try {
      this.running++;
      return await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  private waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      if (this.running < this.maxConcurrent) {
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  private processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const resolve = this.queue.shift();
      if (resolve) {
        setTimeout(resolve, this.interval);
      }
    }
  }
}

/**
 * Create a singleton instance
 */
export function singleton<T>(factory: () => T): () => T {
  let instance: T | undefined;

  return () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T = any>(json: string, fallback?: T): T | undefined {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Environment variable getter with type safety
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];

  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }

  return value ?? defaultValue!;
}

/**
 * Check if running in browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Check if running in production
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = process.env.NODE_ENV === 'test';
