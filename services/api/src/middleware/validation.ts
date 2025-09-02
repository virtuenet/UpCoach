import { Request, Response, NextFunction } from 'express';
import {
  body,
  param,
  query,
  validationResult,
  ValidationChain,
  FieldValidationError,
} from 'express-validator';
import { logger } from '../utils/logger';

/**
 * Validation middleware to check express-validator results
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Validation errors', {
      path: req.path,
      errors: errors.array(),
      ip: req.ip,
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(err => ({
        field: (err as any).path || (err as any).param || 'unknown',
        message: (err as any).msg || 'Validation error',
      })),
    });
    return;
  }

  next();
};

// Alias for backward compatibility
export const handleValidationErrors = validateRequest;

/**
 * Common validation chains for reuse across the application
 */
export const validators = {
  // ID validations
  id: param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer').toInt(),

  uuid: param('id').isUUID().withMessage('Invalid UUID format'),

  // Pagination validators
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative').toInt(),
  ],

  // Search validator
  search: query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .escape(), // Escape HTML entities for XSS prevention

  // Date range validators
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO 8601 format')
      .toDate(),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO 8601 format')
      .toDate()
      .custom((endDate, { req }) => {
        const request = req as Request;
        if (request.query?.startDate && endDate < new Date(request.query.startDate as string)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
  ],

  // Email validator
  email: body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email address')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),

  // Password validator with enhanced security requirements
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('Password must contain at least one special character')
    .custom(value => {
      // Check for repeated characters (3+ in a row)
      if (/(.)\1{2,}/.test(value)) {
        throw new Error('Password should not contain 3 or more repeated characters');
      }
      // Check for common passwords
      const commonPasswords = [
        'password',
        '12345678',
        'qwerty',
        'abc123',
        'password123',
        'admin',
        'letmein',
      ];
      if (commonPasswords.some(common => value.toLowerCase().includes(common))) {
        throw new Error('Password is too common. Please choose a more unique password');
      }
      // Check for sequential characters
      if (
        /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
          value
        )
      ) {
        throw new Error('Password should not contain sequential characters');
      }
      return true;
    }),

  // New password strength validator (optional, stricter version)
  strongPassword: body('password')
    .isLength({ min: 12, max: 128 })
    .withMessage('Strong passwords must be between 12 and 128 characters')
    .matches(/[A-Z].*[A-Z]/)
    .withMessage('Strong passwords must contain at least two uppercase letters')
    .matches(/[a-z].*[a-z]/)
    .withMessage('Strong passwords must contain at least two lowercase letters')
    .matches(/\d.*\d/)
    .withMessage('Strong passwords must contain at least two numbers')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('Strong passwords must contain at least two special characters')
    .custom(value => {
      // All checks from regular password validator
      if (/(.)\1{2,}/.test(value)) {
        throw new Error('Password should not contain 3 or more repeated characters');
      }
      const commonPasswords = [
        'password',
        '12345678',
        'qwerty',
        'abc123',
        'password123',
        'admin',
        'letmein',
      ];
      if (commonPasswords.some(common => value.toLowerCase().includes(common))) {
        throw new Error('Password is too common. Please choose a more unique password');
      }
      if (
        /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
          value
        )
      ) {
        throw new Error('Password should not contain sequential characters');
      }
      return true;
    }),

  // Username validator
  username: body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  // Phone validator
  phone: body('phone').optional().trim().isMobilePhone('any').withMessage('Invalid phone number'),

  // URL validator
  url: body('url')
    .optional()
    .trim()
    .isURL({
      protocols: ['http', 'https'],
      require_protocol: true,
    })
    .withMessage('Invalid URL format'),

  // Amount validator (for financial transactions)
  amount: body('amount')
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Amount must be between 0 and 999999.99')
    .toFloat(),

  // Percentage validator
  percentage: body('percentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100')
    .toFloat(),
};

/**
 * Sanitize input fields to prevent XSS attacks
 */
export const sanitizeInput = (fields: string[]): ValidationChain[] => {
  return fields.map(field =>
    body(field)
      .trim()
      .escape()
      .customSanitizer(value => {
        // Remove any script tags or event handlers
        if (typeof value === 'string') {
          return value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
            .replace(/on\w+\s*=\s*'[^']*'/gi, '')
            .replace(/javascript:/gi, '');
        }
        return value;
      })
  );
};

/**
 * Validate request against SQL injection patterns
 */
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/gi,
    /(--|\/\*|\*\/|xp_|sp_|0x)/gi,
    /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
  ];

  const checkValue = (value: unknown): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    logger.error('Potential SQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(400).json({
      success: false,
      error: 'Invalid input detected',
    });
    return;
  }

  next();
};

/**
 * Validate file upload
 */
export const validateFileUpload = (
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: number = 5 * 1024 * 1024 // 5MB default
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file) {
      next();
      return;
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        error: 'Invalid file type',
        allowedTypes,
      });
      return;
    }

    // Check file size
    if (req.file.size > maxSize) {
      res.status(400).json({
        success: false,
        error: 'File too large',
        maxSize: `${maxSize / 1024 / 1024}MB`,
      });
      return;
    }

    // Sanitize file name
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 255);

    req.file.originalname = sanitizedName;

    next();
  };
};

/**
 * Combine multiple validation chains with error handling
 */
export const validate = (...validations: ValidationChain[]) => {
  return [...validations, validateRequest];
};
