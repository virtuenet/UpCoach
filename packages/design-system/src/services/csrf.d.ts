/**
 * CSRF Protection Service
 * Centralized CSRF token management for UpCoach dashboard applications
 */
declare class CSRFService {
    private token;
    private tokenExpiry;
    constructor();
    /**
     * Initialize CSRF token from storage or generate new one
     */
    private initializeToken;
    /**
     * Get current CSRF token, refresh if expired
     */
    getToken(): string;
    /**
     * Generate a new CSRF token
     */
    refreshToken(): void;
    /**
     * Validate a CSRF token
     */
    validateToken(token: string): boolean;
    /**
     * Get CSRF headers for API requests
     */
    getHeaders(): Record<string, string>;
    /**
     * Clear CSRF token (e.g., on logout)
     */
    clearToken(): void;
    /**
     * Add CSRF token to FormData
     */
    addToFormData(formData: FormData): void;
    /**
     * Add CSRF token to URLSearchParams
     */
    addToParams(params: URLSearchParams): void;
    /**
     * Create a hidden input element for forms
     */
    createHiddenInput(): HTMLInputElement;
    /**
     * Add CSRF token as hidden input to form
     */
    addToForm(form: HTMLFormElement): void;
    /**
     * Interceptor for fetch requests
     */
    fetchInterceptor: (originalFetch: typeof fetch) => (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    /**
     * Axios interceptor configuration
     */
    getAxiosInterceptor(): {
        request: (config: any) => any;
        error: (error: any) => Promise<never>;
    };
}
export declare const csrfService: CSRFService;
export { generateCSRFToken, validateCSRFToken, csrfConfig, } from '../config/security';
export declare const useCSRFToken: () => {
    token: string;
    getToken: () => string;
    refreshToken: () => void;
    getHeaders: () => Record<string, string>;
};
export default csrfService;
//# sourceMappingURL=csrf.d.ts.map