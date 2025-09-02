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
  message?: string;
  code?: string;
  details?: any;
  timestamp?: string;
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

// Validation error response
export interface ValidationErrorResponse {
  success: false;
  error: 'VALIDATION_ERROR';
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
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

  static error(error: string | Error, code?: string): ErrorResponse {
    return {
      success: false,
      error: (error as Error)?.message || error.toString(),
      code,
      timestamp: new Date().toISOString(),
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

  static validation(errors: ValidationErrorResponse['errors']): ValidationErrorResponse {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      errors,
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

export function isPaginatedResponse<T>(response: any): response is PaginatedApiResponse<T> {
  return (
    response.success === true &&
    'meta' in response &&
    'data' in response &&
    Array.isArray(response.data)
  );
}
