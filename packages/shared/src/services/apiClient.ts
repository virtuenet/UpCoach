/**
 * Unified API Client Factory
 * Creates configured axios instances for admin and CMS panels
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  withCredentials?: boolean;
  getAuthToken?: () => string | null;
  getCSRFToken?: () => Promise<string | null>;
  skipCSRF?: boolean;
  onUnauthorized?: () => void;
  onError?: (error: AxiosError) => void;
}

export interface ApiClient extends AxiosInstance {
  setAuthToken: (token: string | null) => void;
  get<T = any>(url: string, config?: any): Promise<import('axios').AxiosResponse<T>>;
  delete<T = any>(url: string, config?: any): Promise<import('axios').AxiosResponse<T>>;
  head<T = any>(url: string, config?: any): Promise<import('axios').AxiosResponse<T>>;
  options<T = any>(url: string, config?: any): Promise<import('axios').AxiosResponse<T>>;
  post<T = any>(url: string, data?: any, config?: any): Promise<import('axios').AxiosResponse<T>>;
  put<T = any>(url: string, data?: any, config?: any): Promise<import('axios').AxiosResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<import('axios').AxiosResponse<T>>;
}

/**
 * Create a configured API client instance
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 30000,
    withCredentials: config.withCredentials || false,
    headers: {
      'Content-Type': 'application/json',
    },
  }) as ApiClient;

  // Auth token management
  let authToken: string | null = null;

  client.setAuthToken = (token: string | null) => {
    authToken = token;
  };

  // Request interceptor for auth and CSRF tokens
  client.interceptors.request.use(
    async requestConfig => {
      // Add auth token
      const token = authToken || (config.getAuthToken ? config.getAuthToken() : null);
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      // Add CSRF token for state-changing requests
      const method = requestConfig.method?.toUpperCase();
      if (
        !config.skipCSRF &&
        method &&
        ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) &&
        !requestConfig.headers['X-Skip-CSRF']
      ) {
        try {
          const csrfToken = config.getCSRFToken ? await config.getCSRFToken() : null;
          if (csrfToken) {
            requestConfig.headers['X-CSRF-Token'] = csrfToken;
          }
        } catch (error) {
          console.warn('Failed to get CSRF token:', error);
          // Continue without CSRF token - let server handle it
        }
      }

      return requestConfig;
    },
    error => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      // Handle 401 Unauthorized
      if (error.response?.status === 401 && config.onUnauthorized) {
        config.onUnauthorized();
      }

      // Handle CSRF token expiry (403 with specific error)
      if (
        error.response?.status === 403 &&
        (error.response.data as any)?.code === 'CSRF_TOKEN_INVALID'
      ) {
        // Retry once with new CSRF token
        if (!(error.config as any)?._retried && config.getCSRFToken) {
          (error.config as any)._retried = true;

          try {
            // Force refresh CSRF token
            const newToken = await config.getCSRFToken();
            if (newToken && error.config) {
              error.config.headers['X-CSRF-Token'] = newToken;
              return client(error.config);
            }
          } catch (csrfError) {
            console.error('Failed to refresh CSRF token:', csrfError);
          }
        }
      }

      // Call custom error handler
      if (config.onError) {
        config.onError(error);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Helper function to handle API errors consistently
 */
export function handleApiError(error: any): {
  message: string;
  code?: string;
  details?: any;
} {
  if (axios.isAxiosError(error)) {
    const response = error.response;

    if (response) {
      // Server responded with error
      return {
        message: response.data?.message || response.data?.error || `Error: ${response.status}`,
        code: response.data?.code || String(response.status),
        details: response.data,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'No response from server. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  // Something else happened
  return {
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Create a retry wrapper for API calls
 */
export function withRetry<T>(
  apiCall: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    shouldRetry = error => {
      // Retry on network errors and 5xx server errors
      if (axios.isAxiosError(error)) {
        return !error.response || error.response.status >= 500;
      }
      return false;
    },
  } = options;

  return new Promise(async (resolve, reject) => {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await apiCall();
        return resolve(result);
      } catch (error) {
        lastError = error;

        if (!shouldRetry(error) || i === maxRetries - 1) {
          return reject(error);
        }

        // Exponential backoff
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
      }
    }

    reject(lastError);
  });
}

/**
 * Create request/response transformers
 */
export const transformers = {
  // Convert snake_case to camelCase
  snakeToCamel: (data: any): any => {
    if (Array.isArray(data)) {
      return data.map(transformers.snakeToCamel);
    }

    if (data !== null && typeof data === 'object') {
      return Object.keys(data).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = transformers.snakeToCamel(data[key]);
        return acc;
      }, {} as any);
    }

    return data;
  },

  // Convert camelCase to snake_case
  camelToSnake: (data: any): any => {
    if (Array.isArray(data)) {
      return data.map(transformers.camelToSnake);
    }

    if (data !== null && typeof data === 'object') {
      return Object.keys(data).reduce((acc, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        acc[snakeKey] = transformers.camelToSnake(data[key]);
        return acc;
      }, {} as any);
    }

    return data;
  },
};

export default createApiClient;