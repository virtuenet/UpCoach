/**
 * SQL Injection Protection Middleware
 * Validates and sanitizes inputs to prevent SQL injection attacks
 * Created: 2025-10-28
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Patterns that indicate potential SQL injection attempts
 * Based on OWASP guidelines
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT|IF)\b)/i,
  /(;|\-\-|\/\*|\*\/|xp_|sp_)/i,
  /(0x[0-9a-f]{6,})/i, // Hex-encoded strings (at least 3 bytes)
  /((\%27)|('))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // ' or (URL encoded)
  /(''|'\)|'\()\s*(OR|AND)\s+/i, // '', '), '( followed by OR/AND
  /('\s*(OR|AND)\s+('|.*='|.*=\s*'))/i, // ' OR, ' AND with suspicious context (0 or more spaces)
  /('\s*--)/i, // ' followed by SQL comment --
  /('\s*#)/i, // ' followed by SQL comment #
  /('\s*\/\*)/i, // ' followed by SQL comment /*
  /(1\s*=\s*1|'1'='1'|"1"="1")/i,
  /(\bUNION\b.*\bSELECT\b)/i,
  /(;?\s*DROP\s+TABLE)/i,
  /(EXECUTE|EXEC)\s+/i,
  /(\bORDER\s+BY\s+\d+)/i, // ORDER BY column number (common in UNION attacks)
  /(\bSLEEP\s*\()/i, // Time-based blind injection
  /(\bWAITFOR\s+DELAY)/i, // SQL Server time-based injection
];

/**
 * Fields that should never contain SQL patterns (even if escaped)
 * These are typically used in WHERE clauses
 */
const STRICT_VALIDATION_FIELDS = [
  'id', 'user_id', 'userId', 'email', 'username',
  'product_id', 'entitlement_id', 'transaction_id'
];

/**
 * Check if a value contains potential SQL injection patterns
 */
export function containsSQLInjection(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Sanitize a string to remove potential SQL injection patterns
 * Note: This is a fallback. Always use parameterized queries!
 */
export function sanitizeSQLInput(value: string): string {
  // Remove null bytes
  let sanitized = value.replace(/\0/g, '');

  // Escape single quotes (double them)
  sanitized = sanitized.replace(/'/g, "''");

  // Remove SQL comments
  sanitized = sanitized.replace(/--.*$/gm, '');
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove common SQL keywords in suspicious contexts
  sanitized = sanitized.replace(/;\s*(DROP|DELETE|UPDATE|INSERT|EXEC)/gi, '');

  return sanitized;
}

/**
 * Validate request parameters for SQL injection attempts
 * This is a defense-in-depth measure. Always use parameterized queries as primary defense!
 */
export function validateSQLInjection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Check URL parameters
    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        if (containsSQLInjection(value)) {
          logger.warn('SQL injection attempt detected in URL params', {
            param: key,
            value,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path
          });

          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Invalid input detected',
              field: key
            }
          });
        }
      }
    }

    // Check query string parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string' && containsSQLInjection(value)) {
          logger.warn('SQL injection attempt detected in query string', {
            param: key,
            value,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path
          });

          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Invalid query parameter',
              field: key
            }
          });
        }
      }
    }

    // Check request body
    if (req.body && typeof req.body === 'object') {
      const suspiciousFields = checkObjectForSQLInjection(req.body);

      if (suspiciousFields.length > 0) {
        logger.warn('SQL injection attempt detected in request body', {
          fields: suspiciousFields,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid input detected in request body',
            fields: suspiciousFields.map(f => f.field)
          }
        });
      }
    }

    // All checks passed
    next();
  } catch (error) {
    logger.error('Error in SQL injection validation middleware', { error });
    // Fail safely - allow request but log the error
    next();
  }
}

/**
 * Recursively check an object for SQL injection attempts
 */
function checkObjectForSQLInjection(
  obj: Record<string, unknown>,
  path: string = ''
): Array<{ field: string; value: unknown }> {
  const suspiciousFields: Array<{ field: string; value: unknown }> = [];

  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = path ? `${path}.${key}` : key;

    if (typeof value === 'string') {
      // Apply strict validation for sensitive fields
      if (STRICT_VALIDATION_FIELDS.includes(key)) {
        if (containsSQLInjection(value) || /[^a-zA-Z0-9@._-]/.test(value)) {
          suspiciousFields.push({ field: fieldPath, value });
        }
      } else if (containsSQLInjection(value)) {
        suspiciousFields.push({ field: fieldPath, value });
      }
    } else if (Array.isArray(value)) {
      // Check each array element
      value.forEach((item, index) => {
        if (typeof item === 'string' && containsSQLInjection(item)) {
          suspiciousFields.push({
            field: `${fieldPath}[${index}]`,
            value: item
          });
        } else if (typeof item === 'object' && item !== null) {
          const nested = checkObjectForSQLInjection(
            item as Record<string, unknown>,
            `${fieldPath}[${index}]`
          );
          suspiciousFields.push(...nested);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recursively check nested objects
      const nested = checkObjectForSQLInjection(
        value as Record<string, unknown>,
        fieldPath
      );
      suspiciousFields.push(...nested);
    }
  }

  return suspiciousFields;
}

/**
 * Middleware to ensure database queries use parameterized statements
 * This wraps the database connection to log warnings for unsafe queries
 */
export function enforceParameterizedQueries(db: Record<string, unknown>) {
  const originalQuery = db.query.bind(db);

  db.query = function (sql: string, ...args: Record<string, unknown>[]) {
    // Check if query appears to use string concatenation
    if (typeof sql === 'string') {
      // Look for + or template literals in the query string
      if (sql.includes("' + ") || sql.includes('` + ') || sql.includes("+ '")) {
        logger.error('SECURITY: Potential SQL injection - non-parameterized query detected', {
          query: sql.substring(0, 100), // Log first 100 chars
          stackTrace: new Error().stack
        });

        throw new Error(
          'SQL query appears to use string concatenation. Use parameterized queries only!'
        );
      }

      // Check for suspicious patterns that might indicate dynamic SQL
      if (/\${.*}/.test(sql) && args.length === 0) {
        logger.warn('SECURITY: Query uses template literals without parameters', {
          query: sql.substring(0, 100)
        });
      }
    }

    return originalQuery(sql, ...args);
  };

  return db;
}

/**
 * Utility to create safe LIKE patterns
 * Escapes special characters in user input for LIKE queries
 */
export function createSafeLikePattern(userInput: string, position: 'start' | 'end' | 'contains' = 'contains'): string {
  // Escape special LIKE characters
  let escaped = userInput
    .replace(/\\/g, '\\\\')  // Backslash
    .replace(/%/g, '\\%')     // Percent
    .replace(/_/g, '\\_');     // Underscore

  // Add wildcards based on position
  switch (position) {
    case 'start':
      return `${escaped}%`;
    case 'end':
      return `%${escaped}`;
    case 'contains':
      return `%${escaped}%`;
    default:
      return escaped;
  }
}

/**
 * Validate that a string is a valid UUID
 * Useful for ID parameters
 */
export function isValidUUID(value: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}

/**
 * Validate that a string is a safe integer
 * Useful for numeric ID parameters
 */
export function isSafeInteger(value: string): boolean {
  const num = Number(value);
  return Number.isSafeInteger(num) && num >= 0;
}

/**
 * Express middleware factory for parameter validation
 */
export function validateParam(
  paramName: string,
  validator: (value: string) => boolean,
  errorMessage?: string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];

    if (!value || !validator(value)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: errorMessage || `Invalid parameter: ${paramName}`,
          field: paramName
        }
      });
    }

    next();
  };
}

/**
 * Pre-configured middleware for common validations
 */
export const validateUUIDParam = (paramName: string) =>
  validateParam(paramName, isValidUUID, `Invalid UUID format for ${paramName}`);

export const validateIntegerParam = (paramName: string) =>
  validateParam(paramName, isSafeInteger, `Invalid integer format for ${paramName}`);

/**
 * Middleware to add security headers that help prevent SQL injection via XSS
 */
export function addSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  next();
}

export default {
  validateSQLInjection,
  enforceParameterizedQueries,
  containsSQLInjection,
  sanitizeSQLInput,
  createSafeLikePattern,
  isValidUUID,
  isSafeInteger,
  validateUUIDParam,
  validateIntegerParam,
  addSecurityHeaders
};
