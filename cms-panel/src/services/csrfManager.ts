/**
 * CSRF Token Manager
 * Handles CSRF token fetching, caching, and automatic refresh
 */

import { apiClient } from '../api/client';

class CSRFTokenManager {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private refreshTimer: NodeJS.Timeout | null = null;
  private fetchPromise: Promise<string> | null = null;

  /**
   * Get CSRF token (from cache or fetch new)
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

    // Fetch new token
    this.fetchPromise = this.fetchNewToken();
    
    try {
      const token = await this.fetchPromise;
      return token;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Fetch new CSRF token from server
   */
  private async fetchNewToken(): Promise<string> {
    try {
      const response = await apiClient.get('/csrf-token', {
        // Skip CSRF check for this request
        headers: {
          'X-Skip-CSRF': 'true'
        }
      });

      const { token, expiresIn = 3600 } = response.data;
      
      if (!token) {
        throw new Error('No CSRF token received from server');
      }

      // Store token and expiry
      this.token = token;
      // Set expiry 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + ((expiresIn - 300) * 1000);

      // Schedule automatic refresh
      this.scheduleRefresh(expiresIn);

      return token;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      // Return empty string to prevent request blocking
      // The server should handle missing CSRF gracefully
      return '';
    }
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
  };
}