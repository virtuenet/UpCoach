/**
 * CSRF Token Manager
 * Handles CSRF token fetching, caching, and automatic refresh
 */
declare class CSRFTokenManager {
    private token;
    private tokenExpiry;
    private refreshTimer;
    private fetchPromise;
    /**
     * Get CSRF token (from cache or fetch new)
     */
    getToken(): Promise<string>;
    /**
     * Fetch new CSRF token from server
     */
    private fetchNewToken;
    /**
     * Schedule automatic token refresh before expiry
     */
    private scheduleRefresh;
    /**
     * Proactively refresh token
     */
    private refreshToken;
    /**
     * Clear cached token (e.g., on logout)
     */
    clearToken(): void;
    /**
     * Check if we have a valid token
     */
    hasValidToken(): boolean;
}
export declare const csrfManager: CSRFTokenManager;
/**
 * React hook for CSRF token management
 */
export declare function useCSRFToken(): {
    getToken: () => Promise<string>;
    clearToken: () => void;
    hasValidToken: () => boolean;
};
export {};
//# sourceMappingURL=csrfManager.d.ts.map