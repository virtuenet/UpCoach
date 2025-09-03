/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * Input Validation Service
 * Comprehensive validation for all API inputs with sanitization
 */

import { z, ZodError, ZodSchema } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../../utils/logger';

// Common validation schemas
export const commonSchemas = {
  // IDs
  uuid: z.string().uuid('Invalid UUID format'),
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  numericId: z.number().int().positive('ID must be a positive integer'),

  // Email
  email: z.string().email('Invalid email format').toLowerCase(),

  // Password
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  // Username
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, hyphens, and underscores'
    ),

  // Phone
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),

  // URL
  url: z.string().url('Invalid URL format'),

  // Date
  date: z.string().datetime('Invalid date format'),
  dateOnly: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),

  // Pagination
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),

  // Sort
  sortBy: z.string().regex(/^[a-zA-Z_]+$/, 'Invalid sort field'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),

  // Search
  searchQuery: z
    .string()
    .max(100)
    .transform(val => val.trim()),
};

// Content validation schemas
export const contentSchemas = {
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),

  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),

  content: z.string().transform(val =>
    DOMPurify.sanitize(val, {
      ALLOWED_TAGS: [
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
        'a',
        'img',
        'blockquote',
        'code',
        'pre',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    })
  ),

  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .min(1)
    .max(100),

  tags: z.array(z.string().max(30)).max(10).default([]),

  metadata: z.record(z.string(), z.any()).default({}),
};

// File upload schemas
export const fileSchemas = {
  fileName: z
    .string()
    .regex(/^[a-zA-Z0-9-_. ]+$/, 'Invalid file name')
    .max(255),

  fileType: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
  ]),

  fileSize: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
};

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
}

class InputValidationService {
  private static instance: InputValidationService;
  private customSchemas: Map<string, ZodSchema> = new Map();

  private constructor() {}

  static getInstance(): InputValidationService {
    if (!InputValidationService.instance) {
      InputValidationService.instance = new InputValidationService();
    }
    return InputValidationService.instance;
  }

  /**
   * Register custom validation schema
   */
  registerSchema(name: string, schema: ZodSchema): void {
    this.customSchemas.set(name, schema);
    logger.debug(`Validation schema '${name}' registered`);
  }

  /**
   * Validate input against schema
   */
  validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        logger.debug('Validation failed', { errors });

        return {
          success: false,
          errors,
        };
      }

      logger.error('Unexpected validation error', error);
      return {
        success: false,
        errors: [{ path: '', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate using registered schema
   */
  validateWithSchema<T>(schemaName: string, data: unknown): ValidationResult<T> {
    const schema = this.customSchemas.get(schemaName);

    if (!schema) {
      logger.error(`Validation schema '${schemaName}' not found`);
      return {
        success: false,
        errors: [{ path: '', message: 'Validation schema not found' }],
      };
    }

    return this.validate(schema, data);
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(
    html: string,
    options?: {
      allowedTags?: string[];
      allowedAttributes?: string[];
      allowedSchemes?: string[];
    }
  ): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: options?.allowedTags || ['p', 'br', 'strong', 'em', 'u', 'a'],
      ALLOWED_ATTR: options?.allowedAttributes || ['href', 'title'],
      ALLOWED_URI_REGEXP: new RegExp(
        `^(?:(?:${(options?.allowedSchemes || ['https']).join('|')}):)`,
        'i'
      ),
    });
  }

  /**
   * Sanitize plain text (remove all HTML)
   */
  sanitizeText(text: string): string {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  }

  /**
   * Sanitize JSON
   */
  sanitizeJSON<T>(json: any, maxDepth: number = 10): T | null {
    try {
      // Convert to string and back to remove functions, undefined, etc.
      const sanitized = JSON.parse(JSON.stringify(json));

      // Check depth
      if (this.getJSONDepth(sanitized) > maxDepth) {
        logger.warn('JSON exceeds maximum depth');
        return null;
      }

      return sanitized;
    } catch (error) {
      logger.error('Failed to sanitize JSON', error);
      return null;
    }
  }

  /**
   * Calculate JSON depth
   */
  private getJSONDepth(obj: any): number {
    if (obj === null || typeof obj !== 'object') {
      return 0;
    }

    const values = Object.values(obj);
    if (values.length === 0) {
      return 1;
    }

    return 1 + Math.max(...values.map(v => this.getJSONDepth(v)));
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: { name: string; type: string; size: number }): ValidationResult<any> {
    const schema = z.object({
      name: fileSchemas.fileName,
      type: fileSchemas.fileType,
      size: fileSchemas.fileSize,
    });

    return this.validate(schema, file);
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(params: any): ValidationResult<{
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }> {
    const schema = z.object({
      page: commonSchemas.page,
      limit: commonSchemas.limit,
      sortBy: commonSchemas.sortBy.optional(),
      sortOrder: commonSchemas.sortOrder.optional(),
    });

    const result = this.validate(schema, params);

    // Ensure page and limit have defaults
    if (result.success && result.data) {
      return {
        ...result,
        data: {
          page: result.data.page || 1,
          limit: result.data.limit || 20,
          sortBy: result.data.sortBy,
          sortOrder: result.data.sortOrder,
        },
      };
    }

    return result as any;
  }

  /**
   * Escape SQL identifiers
   */
  escapeSQL(value: string): string {
    // Remove or escape potentially dangerous characters
    return value.replace(/[^a-zA-Z0-9_]/g, '');
  }

  /**
   * Validate and sanitize SQL ORDER BY clause
   */
  validateOrderBy(field: string, allowedFields: string[]): string | null {
    const escaped = this.escapeSQL(field);

    if (!allowedFields.includes(escaped)) {
      logger.warn(`Invalid sort field: ${field}`);
      return null;
    }

    return escaped;
  }

  /**
   * Check for common injection patterns
   */
  detectInjection(input: string): {
    safe: boolean;
    type?: string;
    reason?: string;
  } {
    const patterns = [
      {
        name: 'SQL Injection',
        regex:
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)|(--)|(;)|(\|\|)|(\/\*)|(\*\/)/i,
      },
      {
        name: 'NoSQL Injection',
        regex:
          /(\$where)|(\$ne)|(\$gt)|(\$lt)|(\$regex)|(\$exists)|(\$type)|(\$mod)|(\$text)|(\$where)/i,
      },
      {
        name: 'Command Injection',
        regex: /(;|\||&|`|\$\(|<|>|\\n|\\r)/,
      },
      {
        name: 'Path Traversal',
        regex: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f|%2e%2e%5c)/i,
      },
      {
        name: 'XXE Injection',
        regex: /(<!DOCTYPE|<!ENTITY|SYSTEM|PUBLIC)/i,
      },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(input)) {
        logger.warn(`Potential ${pattern.name} detected`, { input });
        return {
          safe: false,
          type: pattern.name,
          reason: 'Suspicious pattern detected',
        };
      }
    }

    return { safe: true };
  }

  /**
   * Create validation middleware for Express
   */
  middleware(schema: ZodSchema) {
    return async (req: any, res: any, next: any) => {
      // Combine body, query, and params for validation
      const data = {
        ...req.body,
        ...req.query,
        ...req.params,
      };

      const result = this.validate(schema, data);

      if (!result.success) {
        logger.warn('Request validation failed', {
          path: req.path,
          errors: result.errors,
        });

        return res.status(400).json({
          error: 'Validation failed',
          errors: result.errors,
        });
      }

      // Replace request data with sanitized data
      req.validatedData = result.data;
      next();
    };
  }
}

// Export singleton instance
export const inputValidator = InputValidationService.getInstance();

// Export common validation middleware factories
export const validationMiddleware = {
  pagination: inputValidator.middleware(
    z.object({
      page: commonSchemas.page,
      limit: commonSchemas.limit,
      sortBy: commonSchemas.sortBy.optional(),
      sortOrder: commonSchemas.sortOrder.optional(),
    })
  ),

  id: inputValidator.middleware(
    z.object({
      id: commonSchemas.uuid,
    })
  ),

  search: inputValidator.middleware(
    z.object({
      q: commonSchemas.searchQuery,
    })
  ),
};

// Export Zod for custom schema creation
export { z } from 'zod';
