/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * Comprehensive Input Validation and Sanitization
 * Prevents XSS, SQL injection, and other input-based attacks
 */
/**
 * Input validation rules
 */
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
    sanitize?: (value: any) => any;
}
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    sanitized?: any;
}
/**
 * Validate and sanitize text input
 */
export declare function validateText(value: string, rules?: ValidationRule): ValidationResult;
/**
 * Validate email address
 */
export declare function validateEmail(email: string): ValidationResult;
/**
 * Validate password strength
 */
export declare function validatePassword(password: string, options?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    checkStrength?: boolean;
}): ValidationResult;
/**
 * Validate phone number
 */
export declare function validatePhone(phone: string): ValidationResult;
/**
 * Sanitize HTML content
 */
export declare function sanitizeHTML(html: string, options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
    allowImages?: boolean;
    allowLinks?: boolean;
}): string;
/**
 * Validate file upload
 */
export declare function validateFile(file: File, options?: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
}): ValidationResult;
/**
 * Validate and sanitize JSON
 */
export declare function validateJSON(json: string): ValidationResult;
/**
 * Escape HTML entities
 */
export declare function escapeHTML(str: string): string;
/**
 * Validate form data
 */
export declare function validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): {
    valid: boolean;
    errors: Record<string, string[]>;
    sanitized: Record<string, any>;
};
//# sourceMappingURL=inputValidation.d.ts.map