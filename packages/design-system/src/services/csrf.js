/**
 * CSRF Protection Service
 * Centralized CSRF token management for UpCoach dashboard applications
 */
import { generateCSRFToken, validateCSRFToken, csrfConfig } from '../config/security';
class CSRFService {
    constructor() {
        this.token = null;
        this.tokenExpiry = 0;
        /**
         * Interceptor for fetch requests
         */
        this.fetchInterceptor = (originalFetch) => {
            return (input, init) => {
                // Only add CSRF token to same-origin requests
                const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
                const isSameOrigin = url.startsWith('/') || url.startsWith(window.location.origin);
                if (isSameOrigin && init?.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init.method.toUpperCase())) {
                    const headers = new Headers(init.headers);
                    headers.set(csrfConfig.headerName, this.getToken());
                    init = {
                        ...init,
                        headers,
                    };
                }
                return originalFetch(input, init);
            };
        };
        this.initializeToken();
    }
    /**
     * Initialize CSRF token from storage or generate new one
     */
    initializeToken() {
        try {
            const stored = localStorage.getItem(csrfConfig.tokenName);
            const expiry = localStorage.getItem(`${csrfConfig.tokenName}_expiry`);
            if (stored && expiry && Date.now() < parseInt(expiry)) {
                this.token = stored;
                this.tokenExpiry = parseInt(expiry);
            }
            else {
                this.refreshToken();
            }
        }
        catch (error) {
            console.warn('Failed to initialize CSRF token from storage:', error);
            this.refreshToken();
        }
    }
    /**
     * Get current CSRF token, refresh if expired
     */
    getToken() {
        if (!this.token || Date.now() >= this.tokenExpiry) {
            this.refreshToken();
        }
        return this.token;
    }
    /**
     * Generate a new CSRF token
     */
    refreshToken() {
        this.token = generateCSRFToken();
        this.tokenExpiry = Date.now() + (csrfConfig.cookieOptions.maxAge * 1000);
        try {
            localStorage.setItem(csrfConfig.tokenName, this.token);
            localStorage.setItem(`${csrfConfig.tokenName}_expiry`, this.tokenExpiry.toString());
        }
        catch (error) {
            console.warn('Failed to store CSRF token:', error);
        }
    }
    /**
     * Validate a CSRF token
     */
    validateToken(token) {
        if (!this.token) {
            return false;
        }
        return validateCSRFToken(token, this.token);
    }
    /**
     * Get CSRF headers for API requests
     */
    getHeaders() {
        return {
            [csrfConfig.headerName]: this.getToken(),
        };
    }
    /**
     * Clear CSRF token (e.g., on logout)
     */
    clearToken() {
        this.token = null;
        this.tokenExpiry = 0;
        try {
            localStorage.removeItem(csrfConfig.tokenName);
            localStorage.removeItem(`${csrfConfig.tokenName}_expiry`);
        }
        catch (error) {
            console.warn('Failed to clear CSRF token from storage:', error);
        }
    }
    /**
     * Add CSRF token to FormData
     */
    addToFormData(formData) {
        formData.append(csrfConfig.tokenName, this.getToken());
    }
    /**
     * Add CSRF token to URLSearchParams
     */
    addToParams(params) {
        params.append(csrfConfig.tokenName, this.getToken());
    }
    /**
     * Create a hidden input element for forms
     */
    createHiddenInput() {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = csrfConfig.tokenName;
        input.value = this.getToken();
        return input;
    }
    /**
     * Add CSRF token as hidden input to form
     */
    addToForm(form) {
        // Remove existing CSRF input if present
        const existingInput = form.querySelector(`input[name="${csrfConfig.tokenName}"]`);
        if (existingInput) {
            existingInput.remove();
        }
        // Add new CSRF input
        const input = this.createHiddenInput();
        form.appendChild(input);
    }
    /**
     * Axios interceptor configuration
     */
    getAxiosInterceptor() {
        return {
            request: (config) => {
                // Only add CSRF token to same-origin requests
                const isSameOrigin = !config.url?.includes('://') || config.url?.startsWith(window.location.origin);
                if (isSameOrigin && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
                    config.headers = config.headers || {};
                    config.headers[csrfConfig.headerName] = this.getToken();
                }
                return config;
            },
            error: (error) => {
                return Promise.reject(error);
            },
        };
    }
}
// Export singleton instance
export const csrfService = new CSRFService();
// Export utility functions
export { generateCSRFToken, validateCSRFToken, csrfConfig, } from '../config/security';
// React hook for CSRF token
export const useCSRFToken = () => {
    const getToken = () => csrfService.getToken();
    const refreshToken = () => csrfService.refreshToken();
    const getHeaders = () => csrfService.getHeaders();
    return {
        token: getToken(),
        getToken,
        refreshToken,
        getHeaders,
    };
};
export default csrfService;
//# sourceMappingURL=csrf.js.map