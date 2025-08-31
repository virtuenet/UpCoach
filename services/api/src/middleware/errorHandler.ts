import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import { ApiErrorResponse, ErrorDetails, SequelizeError } from '../types';
import multer from 'multer';

type MulterError = multer.MulterError;

// Extend Request interface to include id
declare global {
  namespace Express {
    interface Request {
      id?: string;
      rawBody?: Buffer;
    }
  }
}

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
  } else if (statusCode >= 400) {
    logger.warn('Client error:', errorLog);
  }

  // Send error response
  const response: ApiErrorResponse = {
    success: false,
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  // Include request ID for debugging
  if (req.id) {
    response.requestId = req.id;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};
