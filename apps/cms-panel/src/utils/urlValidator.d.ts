/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * URL Validation and Sanitization Utilities
 * Prevents XSS attacks through malicious URLs
 */
/**
 * Validates if a URL is safe to use
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Validates if a URL points to a valid image
 */
export declare function isValidImageUrl(url: string): boolean;
/**
 * Sanitizes a URL to make it safe for use
 */
export declare function sanitizeUrl(url: string): string;
/**
 * Creates a safe link with proper attributes
 */
export declare function createSafeLink(url: string, text?: string): {
    href: string;
    text: string;
    attributes: Record<string, string>;
};
/**
 * Validate URL input from user with detailed error messages
 */
export declare function validateUserUrl(url: string): {
    valid: boolean;
    error?: string;
    sanitized?: string;
};
//# sourceMappingURL=urlValidator.d.ts.map