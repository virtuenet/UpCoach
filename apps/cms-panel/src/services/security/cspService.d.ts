/**
 * Content Security Policy Service
 * Implements nonce-based CSP to eliminate unsafe-inline and unsafe-eval
 */
export interface CSPConfig {
    reportOnly?: boolean;
    reportUri?: string;
    upgradeInsecureRequests?: boolean;
    blockAllMixedContent?: boolean;
}
export interface CSPDirectives {
    'default-src'?: string[];
    'script-src'?: string[];
    'style-src'?: string[];
    'img-src'?: string[];
    'font-src'?: string[];
    'connect-src'?: string[];
    'media-src'?: string[];
    'object-src'?: string[];
    'child-src'?: string[];
    'frame-src'?: string[];
    'worker-src'?: string[];
    'manifest-src'?: string[];
    'form-action'?: string[];
    'frame-ancestors'?: string[];
    'base-uri'?: string[];
    'report-uri'?: string[];
    'report-to'?: string[];
    'require-trusted-types-for'?: string[];
    'trusted-types'?: string[];
    'upgrade-insecure-requests'?: string[];
    'block-all-mixed-content'?: string[];
}
declare class ContentSecurityPolicyService {
    private static instance;
    private nonces;
    private readonly NONCE_LENGTH;
    private readonly MAX_NONCES;
    private readonly defaultDirectives;
    private constructor();
    static getInstance(): ContentSecurityPolicyService;
    /**
     * Generate a new nonce for inline scripts/styles
     */
    generateNonce(): string;
    /**
     * Validate a nonce
     */
    validateNonce(nonce: string): boolean;
    /**
     * Generate CSP header value
     */
    generateCSPHeader(nonce?: string, customDirectives?: Partial<CSPDirectives>, config?: CSPConfig): string;
    /**
     * Generate CSP meta tag for HTML
     */
    generateCSPMetaTag(nonce?: string, customDirectives?: Partial<CSPDirectives>, config?: CSPConfig): string;
    /**
     * Generate Report-To header value for CSP reporting
     */
    generateReportToHeader(endpoint: string): string;
    /**
     * Parse CSP violation report
     */
    parseViolationReport(report: any): {
        documentUri: string;
        violatedDirective: string;
        blockedUri: string;
        sourceFile?: string;
        lineNumber?: number;
        columnNumber?: number;
        sample?: string;
    };
    /**
     * Handle CSP violation report
     */
    handleViolationReport(report: any): void;
    /**
     * Track CSP violations for analysis
     */
    private trackViolation;
    /**
     * Clean up old nonces
     */
    private cleanupNonces;
    /**
     * Escape HTML attribute value
     */
    private escapeHTMLAttribute;
    /**
     * Generate inline script with nonce
     */
    generateInlineScript(script: string, nonce: string): string;
    /**
     * Generate inline style with nonce
     */
    generateInlineStyle(style: string, nonce: string): string;
    /**
     * Middleware for Express to add CSP headers
     */
    middleware(config?: CSPConfig): (req: any, res: any, next: any) => void;
    /**
     * Get CSP directives for specific environment
     */
    getEnvironmentDirectives(): CSPDirectives;
    /**
     * Validate CSP configuration
     */
    validateConfiguration(directives: CSPDirectives): {
        isValid: boolean;
        warnings: string[];
        errors: string[];
    };
}
export declare const cspService: ContentSecurityPolicyService;
export declare function useCSPNonce(): string;
export declare function injectCSPNonce(nonce: string): void;
export {};
//# sourceMappingURL=cspService.d.ts.map