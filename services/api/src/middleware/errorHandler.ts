import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import * as crypto from 'crypto';

import { ApiErrorResponse, ErrorDetails, SequelizeError } from '../types';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

// Environment check
const isProduction = process.env.NODE_ENV === 'production';

// Extend ErrorResponse type for enhanced error information
interface EnhancedApiErrorResponse extends ApiErrorResponse {
  stack?: string;
  originalError?: {
    name: string;
    message: string;
  };
  correlationId?: string;
  supportMessage?: string;
}

// Express types are extended in ../types/express.d.ts

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorMiddleware = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: ErrorDetails | undefined = undefined;

  // Handle different error types
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = {
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    };
  } else if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Database validation error';
    details = {
      errors: (error as SequelizeError).errors?.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value,
      })),
    };
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists';
    const sequelizeError = error as SequelizeError;
    details = {
      fields: Object.keys(sequelizeError.fields || {}),
    };
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    if ((error as MulterError).code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
    } else if ((error as MulterError).code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    } else {
      message = 'File upload error';
    }
  }

  // Log error details
  const errorLog = {
    requestId: req.id,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (statusCode >= 500) {
    logger.error('Server error:', errorLog);
    // In test mode, also console.log for immediate visibility
    if (process.env.NODE_ENV === 'test') {
      console.error('=== TEST ERROR ===');
      console.error('Status:', statusCode);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Request:', req.method, req.originalUrl);
      console.error('Body:', JSON.stringify(req.body, null, 2));
    }
  } else if (statusCode >= 400) {
    logger.warn('Client error:', errorLog);
  }

  // Create accessible error response for screen readers
  const getAccessibleErrorMessage = (statusCode: number, message: string, details?: ErrorDetails): string => {
    let accessibleMessage = `Error ${statusCode}: ${message}.`;
    
    if (details?.errors && Array.isArray(details.errors)) {
      const fieldErrors = details.errors.map((err: unknown) => {
        if (err.field && err.message) {
          return `${err.field}: ${err.message}`;
        }
        return err.message || 'Unknown error';
      }).join(', ');
      accessibleMessage += ` Validation errors: ${fieldErrors}.`;
    }
    
    return accessibleMessage;
  };

  // Send error response with accessibility support
  const response: ApiErrorResponse = {
    success: false,
    error: message,
    accessibleError: getAccessibleErrorMessage(statusCode, message, details),
    ...(details && { details }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    // Add semantic error categorization for assistive technologies
    semanticType: statusCode >= 500 ? 'server-error' : 
                 (statusCode >= 400 ? 'client-error' : 'information'),
    severity: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low',
    userAction: statusCode === 401 ? 'Please sign in again' : 
               statusCode === 403 ? 'You do not have permission for this action' :
               statusCode === 404 ? 'The requested resource was not found' :
               statusCode >= 500 ? 'Please try again later' : 
               statusCode >= 400 ? 'Please check your input and try again' : null,
  };

  // Include request ID for debugging
  if (req.id) {
    response.requestId = req.id;
  }

  // SECURITY: Only include detailed debugging info in development
  if (!isProduction) {
    response.stack = error.stack;
    response.originalError = {
      name: error.name,
      message: error.message,
    };
  } else {
    // In production, provide a correlation ID for support purposes
    response.correlationId = crypto.randomBytes(8).toString('hex');
    response.supportMessage = 'If this error persists, please contact support with the correlation ID.';
  }

  // SECURITY: Add security headers to error responses
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  
  res.status(statusCode).json(response);
};

// SECURITY: Helper functions for error classification and threat detection

/**
 * Classifies errors for better monitoring and alerting
 */
function classifyError(error: Error): string {
  if (error.name.includes('Sequelize')) return 'database';
  if (error.name.includes('JWT') || error.name.includes('Token')) return 'authentication';
  if (error.name.includes('Validation')) return 'validation';
  if (error.name.includes('Multer')) return 'file_upload';
  if (error.message.includes('prompt injection')) return 'security_prompt_injection';
  if (error.message.includes('rate limit')) return 'rate_limiting';
  if (error.message.includes('timeout')) return 'timeout';
  return 'unknown';
}

/**
 * Determines error severity for monitoring systems
 */
function determineSeverity(statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
  if (statusCode >= 500) return 'critical';
  if (statusCode === 429 || statusCode === 403) return 'high';
  if (statusCode === 401 || statusCode === 404) return 'medium';
  return 'low';
}

/**
 * Detects potential security threats based on error patterns and request characteristics
 */
function isPotentialSecurityThreat(error: Error, req: Request): boolean {
  const threatIndicators = [
    // Prompt injection attempts
    error.message.includes('prompt injection'),
    error.message.includes('cannot be processed'),
    // SQL injection attempts (in database errors)
    error.message.includes('SQL') && error.message.includes('syntax'),
    // Path traversal attempts
    req.originalUrl.includes('..'),
    req.originalUrl.includes('%2e%2e'),
    // Script injection in URLs
    req.originalUrl.includes('<script>'),
    req.originalUrl.includes('javascript:'),
    // Unusual user agents that might indicate automated attacks
    !req.get('User-Agent') || req.get('User-Agent')?.includes('bot'),
    // Excessive request size
    JSON.stringify(req.body || {}).length > 100000,
  ];
  
  return threatIndicators.some(indicator => indicator);
}
