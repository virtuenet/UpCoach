/**
 * Validated API Client
 * Wraps API client with automatic input validation and sanitization
 */

import { ZodSchema } from 'zod';
import { apiClient } from '../../api/client';
import { inputValidator } from '../validation/inputValidator';
import { logger } from '../../utils/logger';

export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: any;
  headers?: Record<string, string>;
  validation?: {
    data?: ZodSchema;
    params?: ZodSchema;
    response?: ZodSchema;
  };
}

class ValidatedApiClient {
  private static instance: ValidatedApiClient;

  private constructor() {}

  static getInstance(): ValidatedApiClient {
    if (!ValidatedApiClient.instance) {
      ValidatedApiClient.instance = new ValidatedApiClient();
    }
    return ValidatedApiClient.instance;
  }

  /**
   * Make validated API request
   */
  async request<T = any>(config: RequestConfig): Promise<T> {
    try {
      // Validate request data
      if (config.validation?.data && config.data) {
        const validation = inputValidator.validate(config.validation.data, config.data);

        if (!validation.success) {
          const error = new Error('Request data validation failed');
          (error as any).validationErrors = validation.errors;
          throw error;
        }

        config.data = validation.data;
      }

      // Validate request params
      if (config.validation?.params && config.params) {
        const validation = inputValidator.validate(config.validation.params, config.params);

        if (!validation.success) {
          const error = new Error('Request params validation failed');
          (error as any).validationErrors = validation.errors;
          throw error;
        }

        config.params = validation.data;
      }

      // Check for injection attempts in URL
      const injectionCheck = inputValidator.detectInjection(config.url);
      if (!injectionCheck.safe) {
        logger.error('Potential injection detected in URL', {
          url: config.url,
          type: injectionCheck.type,
        });
        throw new Error('Invalid request URL');
      }

      // Make API request
      const response = await apiClient.request({
        url: config.url,
        method: config.method || 'GET',
        data: config.data,
        params: config.params,
        headers: config.headers,
      });

      // Validate response if schema provided
      if (config.validation?.response) {
        const validation = inputValidator.validate(config.validation.response, response.data);

        if (!validation.success) {
          logger.error('Response validation failed', {
            url: config.url,
            errors: validation.errors,
          });
          throw new Error('Invalid response from server');
        }

        return validation.data as T;
      }

      return response.data;
    } catch (error) {
      logger.error('Validated API request failed', {
        url: config.url,
        error,
      });
      throw error;
    }
  }

  /**
   * GET request with validation
   */
  async get<T = any>(
    url: string,
    params?: any,
    validation?: {
      params?: ZodSchema;
      response?: ZodSchema;
    }
  ): Promise<T> {
    return this.request<T>({
      url,
      method: 'GET',
      params,
      validation,
    });
  }

  /**
   * POST request with validation
   */
  async post<T = any>(
    url: string,
    data?: any,
    validation?: {
      data?: ZodSchema;
      response?: ZodSchema;
    }
  ): Promise<T> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      validation,
    });
  }

  /**
   * PUT request with validation
   */
  async put<T = any>(
    url: string,
    data?: any,
    validation?: {
      data?: ZodSchema;
      response?: ZodSchema;
    }
  ): Promise<T> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      validation,
    });
  }

  /**
   * PATCH request with validation
   */
  async patch<T = any>(
    url: string,
    data?: any,
    validation?: {
      data?: ZodSchema;
      response?: ZodSchema;
    }
  ): Promise<T> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      validation,
    });
  }

  /**
   * DELETE request with validation
   */
  async delete<T = any>(
    url: string,
    params?: any,
    validation?: {
      params?: ZodSchema;
      response?: ZodSchema;
    }
  ): Promise<T> {
    return this.request<T>({
      url,
      method: 'DELETE',
      params,
      validation,
    });
  }

  /**
   * Create paginated request helper
   */
  async paginated<T = any>(
    url: string,
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      [key: string]: any;
    },
    validation?: {
      params?: ZodSchema;
      response?: ZodSchema;
    }
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Validate pagination params
    const paginationValidation = inputValidator.validatePagination(params);

    if (!paginationValidation.success) {
      throw new Error('Invalid pagination parameters');
    }

    const validatedParams = {
      ...params,
      ...paginationValidation.data,
    };

    return this.get(url, validatedParams, validation);
  }

  /**
   * File upload with validation
   */
  async uploadFile(url: string, file: File, additionalData?: any): Promise<any> {
    // Validate file
    const fileValidation = inputValidator.validateFileUpload({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!fileValidation.success) {
      const error = new Error('File validation failed');
      (error as any).validationErrors = fileValidation.errors;
      throw error;
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Add additional data if provided
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });
    }

    return this.request({
      url,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Batch requests with validation
   */
  async batch<T = any>(requests: RequestConfig[]): Promise<T[]> {
    // Validate all requests first
    const validatedRequests = requests.map(req => {
      if (req.validation?.data && req.data) {
        const validation = inputValidator.validate(req.validation.data, req.data);
        if (!validation.success) {
          throw new Error(`Batch request validation failed for ${req.url}`);
        }
        req.data = validation.data;
      }

      if (req.validation?.params && req.params) {
        const validation = inputValidator.validate(req.validation.params, req.params);
        if (!validation.success) {
          throw new Error(`Batch request validation failed for ${req.url}`);
        }
        req.params = validation.data;
      }

      return req;
    });

    // Execute requests in parallel
    const promises = validatedRequests.map(req => this.request(req));
    return Promise.all(promises);
  }

  /**
   * Retry failed requests with exponential backoff
   */
  async withRetry<T = any>(
    config: RequestConfig,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.request<T>(config);
      } catch (error) {
        lastError = error;

        // Don't retry validation errors
        if ((error as any).validationErrors) {
          throw error;
        }

        // Don't retry 4xx errors (except 429)
        if (
          (error as any).response?.status >= 400 &&
          (error as any).response?.status < 500 &&
          (error as any).response?.status !== 429
        ) {
          throw error;
        }

        // Wait before retrying
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }
}

// Export singleton instance
export const validatedApi = ValidatedApiClient.getInstance();

// Export typed API methods for common endpoints
export const api = {
  // User endpoints
  users: {
    list: (params?: any) => validatedApi.paginated('/users', params),
    get: (id: string) => validatedApi.get(`/users/${id}`),
    create: (data: any) => validatedApi.post('/users', data),
    update: (id: string, data: any) => validatedApi.put(`/users/${id}`, data),
    delete: (id: string) => validatedApi.delete(`/users/${id}`),
  },

  // Content endpoints
  content: {
    list: (params?: any) => validatedApi.paginated('/content', params),
    get: (id: string) => validatedApi.get(`/content/${id}`),
    create: (data: any) => validatedApi.post('/content', data),
    update: (id: string, data: any) => validatedApi.put(`/content/${id}`, data),
    delete: (id: string) => validatedApi.delete(`/content/${id}`),
    publish: (id: string) => validatedApi.post(`/content/${id}/publish`),
    unpublish: (id: string) => validatedApi.post(`/content/${id}/unpublish`),
  },

  // Media endpoints
  media: {
    list: (params?: any) => validatedApi.paginated('/media', params),
    upload: (file: File, metadata?: any) =>
      validatedApi.uploadFile('/media/upload', file, metadata),
    delete: (id: string) => validatedApi.delete(`/media/${id}`),
  },

  // Settings endpoints
  settings: {
    get: (key: string) => validatedApi.get(`/settings/${key}`),
    update: (key: string, value: any) => validatedApi.put(`/settings/${key}`, { value }),
  },

  // Analytics endpoints
  analytics: {
    overview: (params?: any) => validatedApi.get('/analytics/overview', params),
    content: (params?: any) => validatedApi.get('/analytics/content', params),
    users: (params?: any) => validatedApi.get('/analytics/users', params),
  },
};
