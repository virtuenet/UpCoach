/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * URL Validation and Sanitization Utilities
 * Prevents XSS attacks through malicious URLs
 */
// List of allowed protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];
// List of dangerous protocols that should be blocked
const BLOCKED_PROTOCOLS = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
    'chrome:',
    'chrome-extension:',
];
// Regex patterns for validation
const _URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)$/;
const IMAGE_URL_PATTERN = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;
const MALICIOUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // onclick=, onerror=, etc.
    /&#/, // HTML entity encoding
    /%3C/i, // URL encoded <
    /%3E/i, // URL encoded >
];
/**
 * Validates if a URL is safe to use
 */
export function isValidUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    const trimmedUrl = url.trim();
    // Check for empty or whitespace-only strings
    if (trimmedUrl.length === 0) {
        return false;
    }
    // Check for dangerous protocols
    const lowerUrl = trimmedUrl.toLowerCase();
    for (const protocol of BLOCKED_PROTOCOLS) {
        if (lowerUrl.startsWith(protocol)) {
            return false;
        }
    }
    // Check for malicious patterns
    for (const pattern of MALICIOUS_PATTERNS) {
        if (pattern.test(trimmedUrl)) {
            return false;
        }
    }
    // Validate URL format
    try {
        const urlObj = new URL(trimmedUrl);
        // Check if protocol is allowed
        if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
            return false;
        }
        // Additional checks for suspicious URLs
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
            // You might want to allow localhost in development
            return process.env.NODE_ENV === 'development';
        }
        return true;
    }
    catch {
        // If it's not a valid URL, check if it's a relative path
        // Relative paths should start with / and not contain ..
        if (trimmedUrl.startsWith('/') && !trimmedUrl.includes('..')) {
            return true;
        }
        return false;
    }
}
/**
 * Validates if a URL points to a valid image
 */
export function isValidImageUrl(url) {
    if (!isValidUrl(url)) {
        return false;
    }
    // Check if URL ends with common image extensions
    if (!IMAGE_URL_PATTERN.test(url)) {
        // Could be an image API endpoint without extension
        // Additional validation could be done here
        return true; // Be permissive for image APIs
    }
    return true;
}
/**
 * Sanitizes a URL to make it safe for use
 */
export function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
        return '';
    }
    const trimmedUrl = url.trim();
    // If the URL is invalid, return empty string
    if (!isValidUrl(trimmedUrl)) {
        console.warn('Invalid URL blocked:', trimmedUrl);
        return '';
    }
    try {
        const urlObj = new URL(trimmedUrl);
        // Remove any dangerous parameters
        const paramsToRemove = ['javascript', 'vbscript', 'data'];
        paramsToRemove.forEach(param => {
            urlObj.searchParams.delete(param);
        });
        // Encode special characters in pathname
        urlObj.pathname = encodeURI(decodeURI(urlObj.pathname));
        return urlObj.toString();
    }
    catch {
        // For relative URLs, ensure they're properly encoded
        if (trimmedUrl.startsWith('/')) {
            return encodeURI(trimmedUrl);
        }
        return '';
    }
}
/**
 * Creates a safe link with proper attributes
 */
export function createSafeLink(url, text) {
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) {
        return {
            href: '#',
            text: text || 'Invalid URL',
            attributes: {
                'aria-disabled': 'true',
                'data-invalid': 'true',
            },
        };
    }
    // Determine if external link
    const isExternal = !safeUrl.startsWith('/') && !safeUrl.startsWith(window.location.origin);
    return {
        href: safeUrl,
        text: text || safeUrl,
        attributes: {
            ...(isExternal && {
                target: '_blank',
                rel: 'noopener noreferrer nofollow',
            }),
            'data-safe-link': 'true',
        },
    };
}
/**
 * Validate URL input from user with detailed error messages
 */
export function validateUserUrl(url) {
    if (!url || url.trim().length === 0) {
        return {
            valid: false,
            error: 'Please enter a URL',
        };
    }
    const trimmedUrl = url.trim();
    // Check for dangerous protocols
    const lowerUrl = trimmedUrl.toLowerCase();
    if (BLOCKED_PROTOCOLS.some(protocol => lowerUrl.startsWith(protocol))) {
        return {
            valid: false,
            error: 'This type of URL is not allowed for security reasons',
        };
    }
    // Check for malicious patterns
    if (MALICIOUS_PATTERNS.some(pattern => pattern.test(trimmedUrl))) {
        return {
            valid: false,
            error: 'The URL contains potentially dangerous content',
        };
    }
    // Validate URL format
    if (!trimmedUrl.startsWith('http://') &&
        !trimmedUrl.startsWith('https://') &&
        !trimmedUrl.startsWith('/')) {
        // Try adding https:// prefix
        const withProtocol = `https://${trimmedUrl}`;
        if (isValidUrl(withProtocol)) {
            return {
                valid: true,
                sanitized: sanitizeUrl(withProtocol),
            };
        }
        return {
            valid: false,
            error: 'Please enter a valid URL (e.g., https://example.com)',
        };
    }
    if (!isValidUrl(trimmedUrl)) {
        return {
            valid: false,
            error: 'Please enter a valid URL',
        };
    }
    return {
        valid: true,
        sanitized: sanitizeUrl(trimmedUrl),
    };
}
//# sourceMappingURL=urlValidator.js.map