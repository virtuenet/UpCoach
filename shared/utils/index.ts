/**
 * Shared Utility Functions
 * Common utilities used across the application
 */

// ==================== Date Utilities ====================
export const dateUtils = {
  /**
   * Format date to readable string
   */
  formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    switch (format) {
      case 'long':
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'iso':
        return d.toISOString();
      case 'short':
      default:
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
    }
  },

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  getRelativeTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },

  /**
   * Check if date is today
   */
  isToday(date: Date | string): boolean {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  },

  /**
   * Add days to date
   */
  addDays(date: Date | string, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Get date range
   */
  getDateRange(start: Date | string, end: Date | string): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  },
};

// ==================== String Utilities ====================
export const stringUtils = {
  /**
   * Truncate string with ellipsis
   */
  truncate(str: string, maxLength: number, suffix = '...'): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * Convert to slug
   */
  slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Capitalize first letter
   */
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Convert camelCase to Title Case
   */
  camelToTitle(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  },

  /**
   * Convert snake_case to camelCase
   */
  snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  },

  /**
   * Convert camelCase to snake_case
   */
  camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  },

  /**
   * Generate random string
   */
  generateId(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// ==================== Number Utilities ====================
export const numberUtils = {
  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  },

  /**
   * Format as currency
   */
  formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  /**
   * Format as percentage
   */
  formatPercent(value: number, decimals = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  },

  /**
   * Clamp number between min and max
   */
  clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  },

  /**
   * Round to decimal places
   */
  round(num: number, decimals = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  },
};

// ==================== Array Utilities ====================
export const arrayUtils = {
  /**
   * Chunk array into smaller arrays
   */
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Remove duplicates from array
   */
  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  },

  /**
   * Group array by key
   */
  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  },

  /**
   * Sort array by key
   */
  sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /**
   * Shuffle array
   */
  shuffle<T>(array: T[]): T[] {
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
  random<T>(array: T[]): T | undefined {
    return array[Math.floor(Math.random() * array.length)];
  },
};

// ==================== Object Utilities ====================
export const objectUtils = {
  /**
   * Deep clone object
   */
  deepClone<T>(obj: T): T {
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
  },

  /**
   * Deep merge objects
   */
  deepMerge<T extends Record<string, any>>(...objects: Partial<T>[]): T {
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
  },

  /**
   * Pick properties from object
   */
  pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const picked = {} as Pick<T, K>;
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
  omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  },

  /**
   * Check if object is empty
   */
  isEmpty(obj: Record<string, any>): boolean {
    return Object.keys(obj).length === 0;
  },
};

// ==================== Validation Utilities ====================
export const validationUtils = {
  /**
   * Validate email
   */
  isEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Validate URL
   */
  isURL(url: string): boolean {
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
  isPhone(phone: string): boolean {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
  },

  /**
   * Validate strong password
   */
  isStrongPassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// ==================== Browser Utilities ====================
export const browserUtils = {
  /**
   * Copy to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  },

  /**
   * Download file
   */
  downloadFile(data: Blob | string, filename: string, type?: string): void {
    const blob = typeof data === 'string' ? new Blob([data], { type: type || 'text/plain' }) : data;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
  getQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  },

  /**
   * Set query params
   */
  setQueryParams(params: Record<string, string>): void {
    const searchParams = new URLSearchParams(params);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  },

  /**
   * Debounce function
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        func(...args);
      }
    };
  },
};

// Export all utilities
export default {
  date: dateUtils,
  string: stringUtils,
  number: numberUtils,
  array: arrayUtils,
  object: objectUtils,
  validation: validationUtils,
  browser: browserUtils,
};
