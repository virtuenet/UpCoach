/**
 * API Response type definitions
 */

import { BaseUser, TimestampedModel, IdentifiableModel } from './common';

// Success response types
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  accessibleError?: string; // Screen reader friendly error message
  message?: string;
  code?: string;
  details?: unknown;
  timestamp?: string;
  semanticType?: 'server-error' | 'client-error' | 'information';
  severity?: 'low' | 'medium' | 'high';
  userAction?: string | null; // Suggested action for users
  path?: string;
  requestId?: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Pagination response
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

// Auth responses
export interface LoginResponse {
  user: BaseUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  user: BaseUser;
  message: string;
  requiresVerification?: boolean;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// CRUD responses
export interface CreateResponse<T = any> extends TimestampedModel, IdentifiableModel {
  data: T;
  message: string;
}

export interface UpdateResponse<T = any> {
  data: T;
  message: string;
  updatedFields?: string[];
}

export interface DeleteResponse {
  success: true;
  message: string;
  id: string | number;
}

export interface BulkOperationResponse {
  success: true;
  processed: number;
  failed: number;
  errors?: Array<{
    id: string | number;
    error: string;
  }>;
}

// File upload responses
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  id?: string;
}

export interface MultiUploadResponse {
  files: UploadResponse[];
  totalSize: number;
  message: string;
}

// Analytics responses
export interface AnalyticsResponse {
  metrics: Record<string, number>;
  trends: Array<{
    date: string;
    value: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: Record<
    string,
    {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    }
  >;
}

// Validation error response with accessibility support
export interface ValidationErrorResponse {
  success: false;
  error: 'VALIDATION_ERROR';
  accessibleError?: string;
  errors: Array<{
    field: string;
    message: string;
    accessibleMessage?: string; // Screen reader friendly field error
    value?: unknown;
    severity?: 'error' | 'warning';
    inputType?: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox';
  }>;
  semanticType: 'client-error';
  userAction: string;
}

// WebSocket responses
export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  id?: string;
}

export interface WebSocketError {
  type: 'error';
  error: string;
  code?: string;
  timestamp: string;
}

// Response builder utilities
export class ResponseBuilder {
  static success<T>(data: T, message?: string): SuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    error: string | Error, 
    code?: string, 
    accessibleMessage?: string,
    userAction?: string
  ): ErrorResponse {
    const errorMessage = (error as Error)?.message || error.toString();
    return {
      success: false,
      error: errorMessage,
      accessibleError: accessibleMessage || `Error: ${errorMessage}. ${userAction || 'Please try again.'}`,
      code,
      timestamp: new Date().toISOString(),
      semanticType: 'server-error',
      severity: 'medium',
      userAction: userAction || 'Please try again or contact support if the issue persists',
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    pageSize: number,
    total: number
  ): PaginatedApiResponse<T> {
    const totalPages = Math.ceil(total / pageSize);
    return {
      success: true,
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  static validation(
    errors: ValidationErrorResponse['errors'], 
    accessibleSummary?: string
  ): ValidationErrorResponse {
    const enhancedErrors = errors.map(err => ({
      ...err,
      accessibleMessage: err.accessibleMessage || 
        `${err.field} field has an error: ${err.message}`,
      severity: err.severity || 'error' as const,
    }));
    
    const defaultSummary = `Form validation failed with ${errors.length} error${errors.length > 1 ? 's' : ''}. Please correct the highlighted fields.`;
    
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      accessibleError: accessibleSummary || defaultSummary,
      errors: enhancedErrors,
      semanticType: 'client-error',
      userAction: 'Please correct the errors shown and submit again',
    };
  }
}

// Type guards
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return response.success === false;
}

export function isPaginatedResponse<T>(response: unknown): response is PaginatedApiResponse<T> {
  return (
    response.success === true &&
    'meta' in response &&
    'data' in response &&
    Array.isArray(response.data)
  );
}
