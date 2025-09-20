var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/index.ts
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}
__name(deepClone, "deepClone");
function deepMerge(...objects) {
  const result = {};
  for (const obj of objects) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key];
        if (val !== null && typeof val === "object" && !Array.isArray(val)) {
          result[key] = deepMerge(result[key] || {}, val);
        } else {
          result[key] = val;
        }
      }
    }
  }
  return result;
}
__name(deepMerge, "deepMerge");
var sleep = /* @__PURE__ */ __name((ms) => new Promise((resolve) => setTimeout(resolve, ms)), "sleep");
async function retry(fn, options = {}) {
  const { retries = 3, delay = 1e3, maxDelay = 1e4, factor = 2, onRetry } = options;
  let lastError;
  let currentDelay = delay;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries) {
        if (onRetry) {
          onRetry(lastError, i + 1);
        }
        await sleep(currentDelay);
        currentDelay = Math.min(currentDelay * factor, maxDelay);
      }
    }
  }
  throw lastError;
}
__name(retry, "retry");
function memoize(fn, getKey) {
  const cache = /* @__PURE__ */ new Map();
  return (...args) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
__name(memoize, "memoize");
var _RateLimiter = class _RateLimiter {
  constructor(maxConcurrent, interval) {
    __publicField(this, "maxConcurrent");
    __publicField(this, "interval");
    __publicField(this, "queue", []);
    __publicField(this, "running", 0);
    this.maxConcurrent = maxConcurrent;
    this.interval = interval;
  }
  async execute(fn) {
    await this.waitForSlot();
    try {
      this.running++;
      return await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }
  waitForSlot() {
    return new Promise((resolve) => {
      if (this.running < this.maxConcurrent) {
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const resolve = this.queue.shift();
      if (resolve) {
        setTimeout(resolve, this.interval);
      }
    }
  }
};
__name(_RateLimiter, "RateLimiter");
var RateLimiter = _RateLimiter;
function singleton(factory) {
  let instance;
  return () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };
}
__name(singleton, "singleton");
function safeJsonParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
__name(safeJsonParse, "safeJsonParse");
function getEnv(key, defaultValue) {
  const value = process.env[key];
  if (value === void 0 && defaultValue === void 0) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value ?? defaultValue;
}
__name(getEnv, "getEnv");
var isBrowser = typeof window !== "undefined";
var isProduction = process.env.NODE_ENV === "production";
var isDevelopment = process.env.NODE_ENV === "development";
var isTest = process.env.NODE_ENV === "test";

export { RateLimiter, deepClone, deepMerge, getEnv, isBrowser, isDevelopment, isProduction, isTest, memoize, retry, safeJsonParse, singleton, sleep };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map