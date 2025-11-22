/**
 * Security Configuration for UpCoach Dashboard Applications
 * Centralized security headers and CSRF protection settings
 */
export interface SecurityConfig {
    csp: {
        directives: Record<string, string[]>;
    };
    headers: Record<string, string>;
    csrf: {
        enabled: boolean;
        tokenName: string;
        headerName: string;
    };
}
export declare const cspDirectives: {
    'default-src': string[];
    'script-src': string[];
    'style-src': string[];
    'font-src': string[];
    'img-src': string[];
    'connect-src': string[];
    'media-src': string[];
    'worker-src': string[];
    'frame-ancestors': string[];
    'base-uri': string[];
    'form-action': string[];
    'upgrade-insecure-requests': never[];
};
export declare const securityHeaders: {
    'Content-Security-Policy': string;
    'X-Frame-Options': string;
    'X-Content-Type-Options': string;
    'X-XSS-Protection': string;
    'Referrer-Policy': string;
    'Permissions-Policy': string;
    'Strict-Transport-Security': string;
    'Cross-Origin-Embedder-Policy': string;
    'Cross-Origin-Opener-Policy': string;
    'Cross-Origin-Resource-Policy': string;
};
export declare const csrfConfig: {
    enabled: boolean;
    tokenName: string;
    headerName: string;
    cookieName: string;
    cookieOptions: {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "strict";
        maxAge: number;
    };
};
export declare const rateLimitConfig: {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
};
export declare const sessionConfig: {
    name: string;
    secret: string;
    resave: boolean;
    saveUninitialized: boolean;
    cookie: {
        secure: boolean;
        httpOnly: boolean;
        maxAge: number;
        sameSite: "strict";
    };
};
export declare const developmentSecurityConfig: {
    headers: {
        'Content-Security-Policy': string;
        'X-Frame-Options': string;
        'X-Content-Type-Options': string;
        'X-XSS-Protection': string;
        'Referrer-Policy': string;
        'Permissions-Policy': string;
        'Strict-Transport-Security': string;
        'Cross-Origin-Embedder-Policy': string;
        'Cross-Origin-Opener-Policy': string;
        'Cross-Origin-Resource-Policy': string;
    };
};
export declare const securityConfig: SecurityConfig;
export declare const generateCSRFToken: () => string;
export declare const validateCSRFToken: (token: string, storedToken: string) => boolean;
export declare const sanitizeInput: (input: string) => string;
export declare const sanitizeSQL: (input: string) => string;
export default securityConfig;
//# sourceMappingURL=security.d.ts.map