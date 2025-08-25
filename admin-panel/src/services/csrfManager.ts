/**
 * Enhanced CSRF Token Manager with retry logic and security improvements
 * Handles CSRF token fetching, caching, automatic refresh, and validation
 */

import { apiClient } from '../api/client';

interface CSRFTokenResponse {
  token: string;
  expiresIn?: number;
  signature?: string;
}

class CSRFTokenManager {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private fetchPromise: Promise<string> | null = null;
  private retryCount: number = 0;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // Start with 1 second
  
  /**
   * Regenerate CSRF token
   */
  async regenerateToken(): Promise<string> {
    this.token = null;
    this.tokenExpiry = null;
    return this.getToken();
  }

  /**
   * Get CSRF token (from cache or fetch new)
   * Implements retry logic with exponential backoff
   */
  async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // If already fetching, wait for that request
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Fetch new token with retry logic
    this.fetchPromise = this.fetchNewTokenWithRetry();
    
    try {
      const token = await this.fetchPromise;
      return token;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Fetch new token with retry logic
   */
  private async fetchNewTokenWithRetry(): Promise<string> {
    this.retryCount = 0;
    
    while (this.retryCount < this.maxRetries) {
      try {
        return await this.fetchNewToken();
      } catch (error) {
        this.retryCount++;
        
        if (this.retryCount >= this.maxRetries) {
          console.error('Failed to fetch CSRF token after max retries:', error);
          // Throw error for critical operations
          throw new Error('CSRF token unavailable - security check failed');
        }
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
        console.warn(`CSRF token fetch failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Failed to obtain CSRF token');
  }

  /**
   * Fetch new CSRF token from server
   */
  private async fetchNewToken(): Promise<string> {
    const response = await apiClient.get<CSRFTokenResponse>('/api/csrf-token', {
      withCredentials: true,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Request': 'true'
      }
    });

    const { token, expiresIn = 3600, signature } = response.data;
    
    if (!token) {
      throw new Error('No CSRF token received from server');
    }

    // Validate token format (basic check)
    if (!/^[a-zA-Z0-9\-_]+$/.test(token)) {
      throw new Error('Invalid CSRF token format');
    }

    // Verify signature if provided (additional security)
    if (signature && !this.verifyTokenSignature(token, signature)) {
      throw new Error('CSRF token signature verification failed');
    }

    // Store token and expiry
    this.token = token;
    // Set expiry 5 minutes before actual expiry for safety
    this.tokenExpiry = Date.now() + ((expiresIn - 300) * 1000);

    // Schedule automatic refresh
    this.scheduleRefresh(expiresIn);

    // Reset retry count on success
    this.retryCount = 0;

    return token;
  }

  /**
   * Verify token signature (if server provides one)
   */
  private verifyTokenSignature(_token: string, signature: string): boolean {
    // This would typically verify a server-provided signature
    // For now, just check that signature exists
    return signature.length > 0;
  }

  /**
   * Schedule automatic token refresh before expiry
   */
  private scheduleRefresh(expiresIn: number): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh 10 minutes before expiry (or at 80% of lifetime for shorter tokens)
    const refreshTime = Math.min(
      (expiresIn - 600) * 1000,
      expiresIn * 0.8 * 1000
    );

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  /**
   * Proactively refresh token
   */
  private async refreshToken(): Promise<void> {
    try {
      // Clear current token to force refresh
      this.token = null;
      await this.getToken();
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
      // Will retry on next request
    }
  }

  /**
   * Clear cached token (e.g., on logout)
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiry = 0;
    this.retryCount = 0;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Check if we have a valid token
   */
  hasValidToken(): boolean {
    return !!(this.token && Date.now() < this.tokenExpiry);
  }

  /**
   * Force token refresh (e.g., after 403 response)
   */
  async forceRefresh(): Promise<string> {
    this.clearToken();
    return this.getToken();
  }
}

// Export singleton instance
export const csrfManager = new CSRFTokenManager();

/**
 * React hook for CSRF token management
 */
export function useCSRFToken() {
  return {
    getToken: () => csrfManager.getToken(),
    clearToken: () => csrfManager.clearToken(),
    hasValidToken: () => csrfManager.hasValidToken(),
    forceRefresh: () => csrfManager.forceRefresh(),
  };
}