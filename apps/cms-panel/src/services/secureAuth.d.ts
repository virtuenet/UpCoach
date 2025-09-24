/**
 * Secure Authentication Service
 * Handles token management using httpOnly cookies instead of localStorage
 */
export interface SecureAuthConfig {
    tokenCookieName?: string;
    refreshCookieName?: string;
    csrfHeaderName?: string;
    sessionCheckInterval?: number;
    sessionWarningThreshold?: number;
}
export interface SessionInfo {
    isValid: boolean;
    expiresAt?: Date;
    userId?: string;
    role?: string;
    lastActivity?: Date;
}
declare class SecureAuthService {
    private config;
    private csrfToken;
    private sessionInfo;
    private sessionCheckTimer;
    private activityListeners;
    private sessionExpiryWarningShown;
    constructor(config?: SecureAuthConfig);
    /**
     * Initialize secure auth - fetch CSRF token
     */
    initialize(): Promise<void>;
    /**
     * Check if user has valid session
     */
    checkSession(): Promise<boolean>;
    /**
     * Refresh authentication token
     */
    refreshToken(): Promise<boolean>;
    /**
     * Clear authentication session
     */
    clearSession(): Promise<void>;
    /**
     * Get current CSRF token
     */
    getCSRFToken(): string | null;
    /**
     * Setup axios interceptor for token refresh
     */
    setupInterceptor(): void;
    /**
     * Start session monitoring
     */
    private startSessionMonitoring;
    /**
     * Stop session monitoring
     */
    private stopSessionMonitoring;
    /**
     * Setup user activity tracking
     */
    private setupActivityTracking;
    /**
     * Setup cross-tab synchronization
     */
    private setupCrossTabSync;
    /**
     * Show session expiry warning
     */
    private showSessionExpiryWarning;
    /**
     * Handle session expired
     */
    private handleSessionExpired;
    /**
     * Broadcast logout to other tabs
     */
    private broadcastLogout;
    /**
     * Broadcast session refresh to other tabs
     */
    private _broadcastRefresh;
    /**
     * Get session info
     */
    getSessionInfo(): SessionInfo | null;
    /**
     * Check if user has permission
     */
    hasPermission(permission: string): boolean;
    /**
     * Add activity listener
     */
    onActivity(listener: () => void): () => void;
}
export declare const secureAuth: SecureAuthService;
export { SecureAuthService };
//# sourceMappingURL=secureAuth.d.ts.map