/**
 * Type declarations for rate-limit-redis
 * Mock implementation for missing package
 */

declare module 'rate-limit-redis' {
  interface RedisStore {
    incr: (key: string) => Promise<number>;
    decrement: (key: string) => Promise<number>;
    resetKey: (key: string) => Promise<void>;
  }

  interface RateLimitRedisOptions {
    sendCommand: (...args: unknown[]) => Promise<unknown>;
    prefix?: string;
    resetExpiryOnChange?: boolean;
  }

  function RateLimitRedis(options: RateLimitRedisOptions): RedisStore;

  export = RateLimitRedis;
}