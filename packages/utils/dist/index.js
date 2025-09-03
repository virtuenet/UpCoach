'use strict';

// ../../shared/utils/index.ts
var dateUtils = {
  /**
   * Format date to readable string
   */
  formatDate(date, format = "short") {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return "Invalid Date";
    }
    switch (format) {
      case "long":
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      case "iso":
        return d.toISOString();
      case "short":
      default:
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
    }
  },
  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  getRelativeTime(date) {
    const d = new Date(date);
    const now = /* @__PURE__ */ new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1e3);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
    if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  },
  /**
   * Check if date is today
   */
  isToday(date) {
    const d = new Date(date);
    const today = /* @__PURE__ */ new Date();
    return d.toDateString() === today.toDateString();
  },
  /**
   * Add days to date
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  /**
   * Get date range
   */
  getDateRange(start, end) {
    const dates = [];
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
};
var stringUtils = {
  /**
   * Truncate string with ellipsis
   */
  truncate(str, maxLength, suffix = "...") {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  },
  /**
   * Convert to slug
   */
  slugify(str) {
    return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  },
  /**
   * Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  /**
   * Convert camelCase to Title Case
   */
  camelToTitle(str) {
    return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
  },
  /**
   * Convert snake_case to camelCase
   */
  snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  },
  /**
   * Convert camelCase to snake_case
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  },
  /**
   * Generate random string
   */
  generateId(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};
var numberUtils = {
  /**
   * Format number with commas
   */
  formatNumber(num) {
    return num.toLocaleString("en-US");
  },
  /**
   * Format as currency
   */
  formatCurrency(amount, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(amount);
  },
  /**
   * Format as percentage
   */
  formatPercent(value, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`;
  },
  /**
   * Format bytes to human readable
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  },
  /**
   * Clamp number between min and max
   */
  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },
  /**
   * Round to decimal places
   */
  round(num, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }
};
var arrayUtils = {
  /**
   * Chunk array into smaller arrays
   */
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  /**
   * Remove duplicates from array
   */
  unique(array) {
    return [...new Set(array)];
  },
  /**
   * Group array by key
   */
  groupBy(array, key) {
    return array.reduce(
      (groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
      },
      {}
    );
  },
  /**
   * Sort array by key
   */
  sortBy(array, key, order = "asc") {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return order === "asc" ? -1 : 1;
      if (aVal > bVal) return order === "asc" ? 1 : -1;
      return 0;
    });
  },
  /**
   * Shuffle array
   */
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
  /**
   * Get random item from array
   */
  random(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
};
var objectUtils = {
  /**
   * Deep clone object
   */
  deepClone(obj) {
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
  },
  /**
   * Deep merge objects
   */
  deepMerge(...objects) {
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
  },
  /**
   * Pick properties from object
   */
  pick(obj, keys) {
    const picked = {};
    for (const key of keys) {
      if (key in obj) {
        picked[key] = obj[key];
      }
    }
    return picked;
  },
  /**
   * Omit properties from object
   */
  omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  },
  /**
   * Check if object is empty
   */
  isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }
};
var validationUtils = {
  /**
   * Validate email
   */
  isEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  /**
   * Validate URL
   */
  isURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  /**
   * Validate phone number
   */
  isPhone(phone) {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
  },
  /**
   * Validate strong password
   */
  isStrongPassword(password) {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain lowercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain number");
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push("Password must contain special character");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
var browserUtils = {
  /**
   * Copy to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    }
  },
  /**
   * Download file
   */
  downloadFile(data, filename, type) {
    const blob = typeof data === "string" ? new Blob([data], { type: type || "text/plain" }) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  /**
   * Get query params
   */
  getQueryParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  },
  /**
   * Set query params
   */
  setQueryParams(params) {
    const searchParams = new URLSearchParams(params);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);
  },
  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  /**
   * Throttle function
   */
  throttle(func, wait) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        func(...args);
      }
    };
  }
};

// src/index.ts
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
function memoize(fn, getKey) {
  const cache = /* @__PURE__ */ new Map();
  return ((...args) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  });
}
var RateLimiter = class {
  constructor(maxConcurrent, interval) {
    this.maxConcurrent = maxConcurrent;
    this.interval = interval;
    this.queue = [];
    this.running = 0;
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
function singleton(factory) {
  let instance;
  return () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };
}
function safeJsonParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
function getEnv(key, defaultValue) {
  const value = process.env[key];
  if (value === void 0 && defaultValue === void 0) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value ?? defaultValue;
}
var isBrowser = typeof window !== "undefined";
var isProduction = process.env.NODE_ENV === "production";
var isDevelopment = process.env.NODE_ENV === "development";
var isTest = process.env.NODE_ENV === "test";

exports.RateLimiter = RateLimiter;
exports.arrayUtils = arrayUtils;
exports.browserUtils = browserUtils;
exports.dateUtils = dateUtils;
exports.getEnv = getEnv;
exports.isBrowser = isBrowser;
exports.isDevelopment = isDevelopment;
exports.isProduction = isProduction;
exports.isTest = isTest;
exports.memoize = memoize;
exports.numberUtils = numberUtils;
exports.objectUtils = objectUtils;
exports.retry = retry;
exports.safeJsonParse = safeJsonParse;
exports.singleton = singleton;
exports.sleep = sleep;
exports.stringUtils = stringUtils;
exports.validationUtils = validationUtils;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map