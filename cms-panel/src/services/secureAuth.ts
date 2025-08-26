/**
 * Secure Authentication Service
 * Handles token management using httpOnly cookies instead of localStorage
 */

import { apiClient } from '../api/client';
import { logger } from '../utils/logger';

export interface SecureAuthConfig {
  tokenCookieName?: string;
  refreshCookieName?: string;
  csrfHeaderName?: string;
}

class SecureAuthService {
  private config: Required<SecureAuthConfig>;
  private csrfToken: string | null = null;
  
  constructor(config: SecureAuthConfig = {}) {
    this.config = {
      tokenCookieName: config.tokenCookieName || 'cms-auth-token',
      refreshCookieName: config.refreshCookieName || 'cms-refresh-token',
      csrfHeaderName: config.csrfHeaderName || 'X-CSRF-Token'
    };
    
    // Configure axios to send cookies
    apiClient.defaults.withCredentials = true;
  }

  /**
   * Initialize secure auth - fetch CSRF token
   */
  async initialize(): Promise<void> {
    try {
      const response = await apiClient.get('/auth/csrf');
      this.csrfToken = response.data.csrfToken;
      
      // Add CSRF token to all requests
      apiClient.defaults.headers.common[this.config.csrfHeaderName] = this.csrfToken;
    } catch (error) {
      logger.error('Failed to initialize secure auth', error as Error);
    }
  }

  /**
   * Check if user has valid session
   */
  async checkSession(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/session');
      return response.data.valid === true;
    } catch {
      return false;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiClient.post('/auth/refresh');
      if (response.data.csrfToken) {
        this.csrfToken = response.data.csrfToken;
        apiClient.defaults.headers.common[this.config.csrfHeaderName] = this.csrfToken;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear authentication session
   */
  async clearSession(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      logger.error('Failed to clear session', error as Error);
    } finally {
      // Clear CSRF token
      this.csrfToken = null;
      delete apiClient.defaults.headers.common[this.config.csrfHeaderName];
    }
  }

  /**
   * Get current CSRF token
   */
  getCSRFToken(): string | null {
    return this.csrfToken;
  }

  /**
   * Setup axios interceptor for token refresh
   */
  setupInterceptor(): void {
    let isRefreshing = false;
    let failedQueue: Array<{
      resolve: (token: string | null) => void;
      reject: (error: any) => void;
    }> = [];

    const processQueue = (error: any, token: string | null = null) => {
      failedQueue.forEach(prom => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueue = [];
    };

    apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            // Queue the request
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => {
              return apiClient(originalRequest);
            }).catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const success = await this.refreshToken();
            if (success) {
              processQueue(null);
              return apiClient(originalRequest);
            } else {
              processQueue(new Error('Token refresh failed'));
              window.location.href = '/login';
              return Promise.reject(error);
            }
          } catch (refreshError) {
            processQueue(refreshError);
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

// Export singleton instance
export const secureAuth = new SecureAuthService();

// Export for testing
export { SecureAuthService };