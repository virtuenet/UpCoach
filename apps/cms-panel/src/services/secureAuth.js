/**
 * Secure Authentication Service
 * Handles token management using httpOnly cookies instead of localStorage
 */
import { apiClient } from '../api/client';
import { logger } from '../utils/logger';
class SecureAuthService {
    constructor(config = {}) {
        this.csrfToken = null;
        this.sessionInfo = null;
        this.sessionCheckTimer = null;
        this.activityListeners = new Set();
        this.sessionExpiryWarningShown = false;
        this.config = {
            tokenCookieName: config.tokenCookieName || 'cms-auth-token',
            refreshCookieName: config.refreshCookieName || 'cms-refresh-token',
            csrfHeaderName: config.csrfHeaderName || 'X-CSRF-Token',
            sessionCheckInterval: config.sessionCheckInterval || 60000, // 1 minute
            sessionWarningThreshold: config.sessionWarningThreshold || 300000, // 5 minutes
        };
        // Configure axios to send cookies
        apiClient.defaults.withCredentials = true;
    }
    /**
     * Initialize secure auth - fetch CSRF token
     */
    async initialize() {
        try {
            const response = await apiClient.get('/auth/csrf');
            this.csrfToken = response.data.csrfToken;
            // Add CSRF token to all requests
            apiClient.defaults.headers.common[this.config.csrfHeaderName] = this.csrfToken;
            // Start session monitoring
            this.startSessionMonitoring();
            // Setup activity tracking
            this.setupActivityTracking();
            // Setup cross-tab synchronization
            this.setupCrossTabSync();
            logger.info('Secure auth service initialized');
        }
        catch (error) {
            logger.error('Failed to initialize secure auth', error);
        }
    }
    /**
     * Check if user has valid session
     */
    async checkSession() {
        try {
            const response = await apiClient.get('/auth/session');
            if (response.data.valid) {
                this.sessionInfo = {
                    isValid: true,
                    expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined,
                    userId: response.data.userId,
                    role: response.data.role,
                    lastActivity: new Date(),
                };
                // Reset expiry warning flag if session is refreshed
                if (this.sessionInfo.expiresAt) {
                    const timeUntilExpiry = this.sessionInfo.expiresAt.getTime() - Date.now();
                    if (timeUntilExpiry > this.config.sessionWarningThreshold) {
                        this.sessionExpiryWarningShown = false;
                    }
                }
                return true;
            }
            this.sessionInfo = null;
            return false;
        }
        catch {
            this.sessionInfo = null;
            return false;
        }
    }
    /**
     * Refresh authentication token
     */
    async refreshToken() {
        try {
            const response = await apiClient.post('/auth/refresh');
            if (response.data.csrfToken) {
                this.csrfToken = response.data.csrfToken;
                apiClient.defaults.headers.common[this.config.csrfHeaderName] = this.csrfToken;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Clear authentication session
     */
    async clearSession() {
        try {
            await apiClient.post('/auth/logout');
        }
        catch (error) {
            logger.error('Failed to clear session', error);
        }
        finally {
            // Clear local state
            this.csrfToken = null;
            this.sessionInfo = null;
            delete apiClient.defaults.headers.common[this.config.csrfHeaderName];
            // Stop session monitoring
            this.stopSessionMonitoring();
            // Signal other tabs
            this.broadcastLogout();
        }
    }
    /**
     * Get current CSRF token
     */
    getCSRFToken() {
        return this.csrfToken;
    }
    /**
     * Setup axios interceptor for token refresh
     */
    setupInterceptor() {
        let isRefreshing = false;
        let failedQueue = [];
        const processQueue = (error, token = null) => {
            failedQueue.forEach(prom => {
                if (error) {
                    prom.reject(error);
                }
                else {
                    prom.resolve(token);
                }
            });
            failedQueue = [];
        };
        apiClient.interceptors.response.use(response => response, async (error) => {
            const originalRequest = error.config;
            // If 401 and not already retrying
            if (error.response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    // Queue the request
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then(() => {
                        return apiClient(originalRequest);
                    })
                        .catch(err => Promise.reject(err));
                }
                originalRequest._retry = true;
                isRefreshing = true;
                try {
                    const success = await this.refreshToken();
                    if (success) {
                        processQueue(null);
                        return apiClient(originalRequest);
                    }
                    else {
                        processQueue(new Error('Token refresh failed'));
                        window.location.href = '/login';
                        return Promise.reject(error);
                    }
                }
                catch (refreshError) {
                    processQueue(refreshError);
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
                finally {
                    isRefreshing = false;
                }
            }
            return Promise.reject(error);
        });
    }
    /**
     * Start session monitoring
     */
    startSessionMonitoring() {
        this.stopSessionMonitoring();
        this.sessionCheckTimer = setInterval(async () => {
            if (!this.sessionInfo?.expiresAt)
                return;
            const now = Date.now();
            const expiresAt = this.sessionInfo.expiresAt.getTime();
            const timeUntilExpiry = expiresAt - now;
            // Show warning if session is about to expire
            if (timeUntilExpiry < this.config.sessionWarningThreshold &&
                timeUntilExpiry > 0 &&
                !this.sessionExpiryWarningShown) {
                this.showSessionExpiryWarning(Math.floor(timeUntilExpiry / 60000));
                this.sessionExpiryWarningShown = true;
            }
            // Attempt to refresh if less than warning threshold
            if (timeUntilExpiry < this.config.sessionWarningThreshold && timeUntilExpiry > 0) {
                await this.refreshToken();
            }
            // Session expired
            if (timeUntilExpiry <= 0) {
                this.handleSessionExpired();
            }
        }, this.config.sessionCheckInterval);
    }
    /**
     * Stop session monitoring
     */
    stopSessionMonitoring() {
        if (this.sessionCheckTimer) {
            clearInterval(this.sessionCheckTimer);
            this.sessionCheckTimer = null;
        }
    }
    /**
     * Setup user activity tracking
     */
    setupActivityTracking() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        let lastActivity = Date.now();
        const ACTIVITY_THRESHOLD = 300000; // 5 minutes
        const handleActivity = () => {
            const now = Date.now();
            if (now - lastActivity > ACTIVITY_THRESHOLD) {
                lastActivity = now;
                this.checkSession();
                // Notify activity listeners
                this.activityListeners.forEach(listener => listener());
            }
        };
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });
    }
    /**
     * Setup cross-tab synchronization
     */
    setupCrossTabSync() {
        window.addEventListener('storage', event => {
            if (event.key === 'auth_logout' && event.newValue === 'true') {
                // Another tab logged out
                this.handleSessionExpired();
            }
            if (event.key === 'auth_refresh' && event.newValue) {
                // Another tab refreshed the session
                this.checkSession();
            }
        });
    }
    /**
     * Show session expiry warning
     */
    showSessionExpiryWarning(minutes) {
        logger.warn(`Session expiring in ${minutes} minutes`);
        // Create warning notification (can be replaced with toast notification)
        const event = new CustomEvent('sessionExpiryWarning', {
            detail: { minutesRemaining: minutes },
        });
        window.dispatchEvent(event);
    }
    /**
     * Handle session expired
     */
    handleSessionExpired() {
        logger.info('Session expired');
        // Clear local state
        this.sessionInfo = null;
        this.stopSessionMonitoring();
        // Dispatch event for app to handle
        const event = new CustomEvent('sessionExpired');
        window.dispatchEvent(event);
        // Redirect to login
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }
    /**
     * Broadcast logout to other tabs
     */
    broadcastLogout() {
        try {
            localStorage.setItem('auth_logout', 'true');
            setTimeout(() => localStorage.removeItem('auth_logout'), 100);
        }
        catch (e) {
            // Ignore storage errors
        }
    }
    /**
     * Broadcast session refresh to other tabs
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _broadcastRefresh() {
        try {
            localStorage.setItem('auth_refresh', Date.now().toString());
            setTimeout(() => localStorage.removeItem('auth_refresh'), 100);
        }
        catch (e) {
            // Ignore storage errors
        }
    }
    /**
     * Get session info
     */
    getSessionInfo() {
        return this.sessionInfo;
    }
    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        if (!this.sessionInfo?.role)
            return false;
        const rolePermissions = {
            admin: ['*'],
            coach: ['content.*', 'media.*', 'analytics.view'],
            content_creator: ['content.read', 'content.write', 'media.upload'],
        };
        const permissions = rolePermissions[this.sessionInfo.role] || [];
        return permissions.some(p => {
            if (p === '*')
                return true;
            if (p === permission)
                return true;
            if (p.endsWith('.*') && permission.startsWith(p.slice(0, -2)))
                return true;
            return false;
        });
    }
    /**
     * Add activity listener
     */
    onActivity(listener) {
        this.activityListeners.add(listener);
        return () => this.activityListeners.delete(listener);
    }
}
// Export singleton instance
export const secureAuth = new SecureAuthService();
// Export for testing
export { SecureAuthService };
//# sourceMappingURL=secureAuth.js.map