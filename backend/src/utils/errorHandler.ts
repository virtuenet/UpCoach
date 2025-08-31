import { Response } from 'express';
import { logger } from './logger';

/**
 * User-friendly error class with actionable information
 */
export class UserFriendlyError extends Error {
  constructor(
    public userMessage: string,
    public technicalMessage: string,
    public statusCode: number = 500,
    public actionRequired?: string,
    public retryable: boolean = false,
    public helpUrl?: string
  ) {
    super(technicalMessage);
    this.name = 'UserFriendlyError';
  }
}

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

/**
 * Type guard to check if error has a statusCode property
 */
export function hasStatusCode(error: unknown): error is { statusCode: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as any).statusCode === 'number'
  );
}

/**
 * Convert unknown error to UserFriendlyError
 */
export function handleError(error: unknown): UserFriendlyError {
  // If it's already a UserFriendlyError, return it
  if (error instanceof UserFriendlyError) {
    return error;
  }

  // If it's a standard Error
  if (isError(error)) {
    return new UserFriendlyError(
      'Something went wrong. Please try again.',
      error.message,
      500,
      'Refresh the page or contact support if the problem persists',
      true
    );
  }

  // If it has a message property
  if (hasMessage(error)) {
    return new UserFriendlyError(
      'An error occurred while processing your request.',
      error.message,
      500,
      'Please try again',
      true
    );
  }

  // For unknown errors
  return new UserFriendlyError(
    'An unexpected error occurred',
    String(error),
    500,
    'Please refresh the page and try again',
    false
  );
}

/**
 * Handle controller errors consistently
 */
export function handleControllerError(error: unknown, res: Response, context: string): void {
  const userFriendlyError = handleError(error);

  // Log the technical details
  logger.error(`${context}: ${userFriendlyError.technicalMessage}`, {
    context,
    statusCode: userFriendlyError.statusCode,
    error: error instanceof Error ? error.stack : error,
  });

  // Prepare response
  const response: any = {
    success: false,
    error: {
      message: userFriendlyError.userMessage,
      statusCode: userFriendlyError.statusCode,
      timestamp: new Date().toISOString(),
      retryable: userFriendlyError.retryable,
    },
  };

  // Add action and help URL if available
  if (userFriendlyError.actionRequired) {
    response.error.action = userFriendlyError.actionRequired;
  }
  if (userFriendlyError.helpUrl) {
    response.error.helpUrl = userFriendlyError.helpUrl;
  }

  // In development, include technical details
  if (process.env.NODE_ENV === 'development') {
    response.error.technical = {
      message: userFriendlyError.technicalMessage,
      context,
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  res.status(userFriendlyError.statusCode).json(response);
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (hasMessage(error)) {
    return error.message;
  }
  return String(error);
}

/**
 * Extract status code safely
 */
export function getErrorStatusCode(error: unknown): number {
  if (hasStatusCode(error)) {
    return error.statusCode;
  }
  if (error instanceof UserFriendlyError) {
    return error.statusCode;
  }
  return 500;
}
