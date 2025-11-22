/**
 * Type guards for safe type narrowing
 */

// Validation Error Types
export interface ValidationError extends Error {
  path?: string;
  param?: string;
  msg?: string;
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    error instanceof Error &&
    ('path' in error || 'param' in error || 'msg' in error)
  );
}

// HTTP Error Types
export interface HttpError extends Error {
  statusCode: number;
  status?: number;
}

export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    ('statusCode' in error || 'status' in error) &&
    (typeof (error as HttpError).statusCode === 'number' ||
      typeof (error as HttpError).status === 'number')
  );
}

// Error with message
export function hasErrorMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

// Generic error object check
export function isErrorLike(error: unknown): error is { message: string; statusCode?: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

// Get status code from error safely
export function getErrorStatusCode(error: unknown): number {
  if (isHttpError(error)) {
    return error.statusCode || error.status || 500;
  }
  return 500;
}

// Get error message safely
export function getErrorMessage(error: unknown): string {
  if (hasErrorMessage(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

// Get validation field name safely
export function getValidationField(error: unknown): string {
  if (isValidationError(error)) {
    return error.path || error.param || 'unknown';
  }
  return 'unknown';
}

// Get validation message safely
export function getValidationMessage(error: unknown): string {
  if (isValidationError(error)) {
    return error.msg || error.message || 'Validation error';
  }
  if (hasErrorMessage(error)) {
    return error.message;
  }
  return 'Validation error';
}
