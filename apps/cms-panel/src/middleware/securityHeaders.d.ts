/**
 * Security Headers Middleware
 * Configures all security headers including CSP with nonces
 */
export interface SecurityHeadersConfig {
    csp?: {
        enabled: boolean;
        reportOnly?: boolean;
        reportUri?: string;
    };
    hsts?: {
        enabled: boolean;
        maxAge?: number;
        includeSubDomains?: boolean;
        preload?: boolean;
    };
    certificateTransparency?: {
        enabled: boolean;
        enforce?: boolean;
        maxAge?: number;
    };
}
/**
 * Configure security headers for Vite dev server or production server
 */
export declare function configureSecurityHeaders(config?: SecurityHeadersConfig): (req: any, res: any, next: any) => void;
/**
 * Vite plugin for security headers
 */
export declare function viteSecurityHeaders(config?: SecurityHeadersConfig): {
    name: string;
    configureServer(server: any): void;
    transformIndexHtml(html: string, ctx: any): string;
};
/**
 * CSP violation report handler
 */
export declare function handleCSPViolation(req: any, res: any): void;
/**
 * Production security configuration
 */
export declare const productionSecurityConfig: SecurityHeadersConfig;
/**
 * Development security configuration
 */
export declare const developmentSecurityConfig: SecurityHeadersConfig;
//# sourceMappingURL=securityHeaders.d.ts.map