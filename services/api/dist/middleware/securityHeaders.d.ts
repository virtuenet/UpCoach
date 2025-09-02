/**
 * Enhanced Security Headers Middleware
 * Implements comprehensive security headers including HSTS, CSP, and more
 */
import { Request, Response, NextFunction } from 'express';
export interface SecurityHeadersConfig {
    enableHSTS?: boolean;
    hstsMaxAge?: number;
    hstsIncludeSubDomains?: boolean;
    hstsPreload?: boolean;
    enableCSP?: boolean;
    cspDirectives?: Record<string, string[]>;
    enableXFrameOptions?: boolean;
    xFrameOptions?: 'DENY' | 'SAMEORIGIN';
    enableXContentTypeOptions?: boolean;
    enableReferrerPolicy?: boolean;
    referrerPolicy?: string;
    enablePermissionsPolicy?: boolean;
    permissionsPolicy?: Record<string, string[]>;
    enableExpectCT?: boolean;
    expectCTMaxAge?: number;
    expectCTEnforce?: boolean;
    expectCTReportUri?: string;
    enableCertificateTransparency?: boolean;
    certificateTransparencyMaxAge?: number;
}
/**
 * Generate CSP nonce for inline scripts
 */
export declare function generateCSPNonce(): string;
/**
 * Security Headers Middleware
 */
export declare function securityHeaders(customConfig?: Partial<SecurityHeadersConfig>): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Certificate Transparency Monitoring
 */
export declare class CertificateTransparencyMonitor {
    private static instance;
    private reportEndpoint?;
    private constructor();
    static getInstance(): CertificateTransparencyMonitor;
    /**
     * Configure CT monitoring
     */
    configure(reportEndpoint: string): void;
    /**
     * Process CT violation report
     */
    processReport(report: any): Promise<void>;
    /**
     * Store CT violation for audit trail
     */
    private storeViolation;
    /**
     * Middleware to handle CT violation reports
     */
    middleware(): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
}
/**
 * Security Report URI Handler
 */
export declare function securityReportHandler(): (req: Request, _res: Response) => Promise<void>;
export declare const ctMonitor: CertificateTransparencyMonitor;
//# sourceMappingURL=securityHeaders.d.ts.map