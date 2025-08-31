/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * Comprehensive Input Validation and Sanitization
 * Prevents XSS, SQL injection, and other input-based attacks
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Common malicious patterns to detect
 */
const MALICIOUS_PATTERNS = {
  SQL_INJECTION: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
    /(-{2}|\/\*|\*\/|;|'|")/g, // SQL comment markers and quotes
    /(\bOR\b\s*\d*\s*=\s*\d*)/gi, // OR 1=1 patterns
    /(\bAND\b\s*\d*\s*=\s*\d*)/gi, // AND 1=1 patterns
  ],
  XSS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
    /&#/g, // HTML entity encoding
    /%3C/gi, // URL encoded <
    /%3E/gi, // URL encoded >
  ],
  PATH_TRAVERSAL: [
    /\.\.[\/\\]/g, // ../ or ..\
    /\.\.%2[fF]/g, // URL encoded ../
    /\.\.%5[cC]/g, // URL encoded ..\
  ],
  COMMAND_INJECTION: [
    /[;&|`$()]/g, // Shell metacharacters
    /\$\{.*\}/g, // Template literals
  ],
};

/**
 * Email validation regex (RFC 5322 compliant)
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Strong password regex
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Phone number regex (international format)
 */
const PHONE_REGEX =
  /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;

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
export function validateText(value: string, rules: ValidationRule = {}): ValidationResult {
  const errors: string[] = [];
  let sanitized = value;

  // Trim whitespace
  sanitized = sanitized.trim();

  // Required check
  if (rules.required && !sanitized) {
    errors.push('This field is required');
    return { valid: false, errors };
  }

  // Length checks
  if (rules.minLength && sanitized.length < rules.minLength) {
    errors.push(`Must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && sanitized.length > rules.maxLength) {
    errors.push(`Must be no more than ${rules.maxLength} characters`);
    sanitized = sanitized.substring(0, rules.maxLength);
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(sanitized)) {
    errors.push('Invalid format');
  }

  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS.XSS) {
    if (pattern.test(sanitized)) {
      errors.push('Input contains potentially dangerous content');
      sanitized = sanitized.replace(pattern, '');
    }
  }

  // Custom validation
  if (rules.custom) {
    const customResult = rules.custom(sanitized);
    if (typeof customResult === 'string') {
      errors.push(customResult);
    } else if (!customResult) {
      errors.push('Validation failed');
    }
  }

  // Apply custom sanitization
  if (rules.sanitize) {
    sanitized = rules.sanitize(sanitized);
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  let sanitized = email.trim().toLowerCase();

  if (!sanitized) {
    errors.push('Email is required');
    return { valid: false, errors };
  }

  if (!EMAIL_REGEX.test(sanitized)) {
    errors.push('Invalid email format');
  }

  // Check for suspicious patterns
  if (sanitized.includes('..') || sanitized.includes('--')) {
    errors.push('Email contains invalid characters');
  }

  // Length check
  if (sanitized.length > 254) {
    errors.push('Email is too long');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    checkStrength?: boolean;
  } = {}
): ValidationResult {
  const {
    minLength = 12,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    checkStrength = true,
  } = options;

  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecialChars && !/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password',
    'Password1!',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
  ];

  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common or weak');
  }

  // Calculate password strength score
  if (checkStrength) {
    let strength = 0;
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    if (!/(.)\1{2,}/.test(password)) strength++; // No repeated characters

    if (strength < 5) {
      errors.push('Password strength is insufficient');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  let sanitized = phone.replace(/\s/g, '').replace(/-/g, '');

  if (!sanitized) {
    errors.push('Phone number is required');
    return { valid: false, errors };
  }

  if (!PHONE_REGEX.test(sanitized)) {
    errors.push('Invalid phone number format');
  }

  if (sanitized.length < 7 || sanitized.length > 15) {
    errors.push('Phone number length is invalid');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(
  html: string,
  options: {
    allowedTags?: string[];
    allowedAttributes?: string[];
    allowImages?: boolean;
    allowLinks?: boolean;
  } = {}
): string {
  const {
    allowedTags = [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
    ],
    allowedAttributes = ['class', 'id'],
    allowImages = false,
    allowLinks = false,
  } = options;

  const tags = [...allowedTags];
  const attrs = [...allowedAttributes];

  if (allowImages) {
    tags.push('img');
    attrs.push('src', 'alt', 'width', 'height');
  }

  if (allowLinks) {
    tags.push('a');
    attrs.push('href', 'target', 'rel');
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: tags,
    ALLOWED_ATTR: attrs,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'textarea'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    KEEP_CONTENT: false,
    SAFE_FOR_TEMPLATES: true,
  });
}

/**
 * Validate file upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): ValidationResult {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  const errors: string[] = [];

  // Check file size
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`File size must be less than ${sizeMB}MB`);
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (allowedExtensions.length > 0 && extension && !allowedExtensions.includes(extension)) {
    errors.push(`File extension .${extension} is not allowed`);
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.\./g, // Path traversal
    /[<>:"\/\\|?*]/g, // Invalid characters
    /\.(exe|bat|cmd|sh|ps1|vbs|js)$/i, // Executable extensions
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      errors.push('File name contains invalid or dangerous characters');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate and sanitize JSON
 */
export function validateJSON(json: string): ValidationResult {
  const errors: string[] = [];
  let parsed: any;

  try {
    parsed = JSON.parse(json);
  } catch (e) {
    errors.push('Invalid JSON format');
    return { valid: false, errors };
  }

  // Check for dangerous keys or values
  const dangerous = ['__proto__', 'constructor', 'prototype'];

  function checkObject(obj: any, path: string = ''): void {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key in obj) {
      if (dangerous.includes(key)) {
        errors.push(`Dangerous key "${key}" found at ${path}`);
      }

      if (typeof obj[key] === 'object') {
        checkObject(obj[key], path ? `${path}.${key}` : key);
      }
    }
  }

  checkObject(parsed);

  return {
    valid: errors.length === 0,
    errors,
    sanitized: parsed,
  };
}

/**
 * Escape HTML entities
 */
export function escapeHTML(str: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'\/]/g, s => map[s]);
}

/**
 * Validate form data
 */
export function validateForm(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { valid: boolean; errors: Record<string, string[]>; sanitized: Record<string, any> } {
  const errors: Record<string, string[]> = {};
  const sanitized: Record<string, any> = {};
  let valid = true;

  for (const field in rules) {
    const value = data[field];
    const rule = rules[field];

    const result = validateText(String(value || ''), rule);

    if (!result.valid) {
      errors[field] = result.errors;
      valid = false;
    }

    sanitized[field] = result.sanitized;
  }

  return { valid, errors, sanitized };
}
