/**
 * Sanitization utilities using DOMPurify for XSS prevention
 * Provides secure HTML sanitization for user inputs
 */
/**
 * Sanitize a string input - removes all HTML
 */
export declare function sanitizeString(input: string, logSuspicious?: boolean): string;
/**
 * Sanitize string with moderate settings (allows some formatting)
 */
export declare function sanitizeRichText(input: string): string;
/**
 * Recursively sanitize an object's string values
 */
export declare function sanitizeObject<T>(obj: T, strict?: boolean): T;
/**
 * Sanitize SQL-like patterns in strings
 * Note: Parameterized queries should be used instead when possible
 */
export declare function sanitizeSqlPattern(input: string): string;
/**
 * Sanitize filename to prevent path traversal attacks
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Validate and sanitize URL
 */
export declare function sanitizeUrl(url: string): string | null;
/**
 * Check if input contains potentially malicious patterns
 */
export declare function detectMaliciousPatterns(input: string): {
    isSuspicious: boolean;
    patterns: string[];
};
/**
 * Create a sanitization report for logging
 */
export declare function createSanitizationReport(original: any, sanitized: any): {
    modified: boolean;
    fieldsModified: string[];
    suspiciousPatterns: string[];
    processingTime: number;
    originalSize: number;
    sanitizedSize: number;
};
declare const _default: {
    sanitizeString: typeof sanitizeString;
    sanitizeRichText: typeof sanitizeRichText;
    sanitizeObject: typeof sanitizeObject;
    sanitizeSqlPattern: typeof sanitizeSqlPattern;
    sanitizeFilename: typeof sanitizeFilename;
    sanitizeUrl: typeof sanitizeUrl;
    detectMaliciousPatterns: typeof detectMaliciousPatterns;
    createSanitizationReport: typeof createSanitizationReport;
};
export default _default;
//# sourceMappingURL=sanitization.d.ts.map