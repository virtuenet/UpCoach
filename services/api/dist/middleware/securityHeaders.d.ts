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
export declare function generateCSPNonce(): string;
export declare function securityHeaders(customConfig?: Partial<SecurityHeadersConfig>): (req: Request, _res: Response, next: NextFunction) => void;
export declare class CertificateTransparencyMonitor {
    private static instance;
    private reportEndpoint?;
    private constructor();
    static getInstance(): CertificateTransparencyMonitor;
    configure(reportEndpoint: string): void;
    processReport(report: any): Promise<void>;
    private storeViolation;
    middleware(): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
}
export declare function securityReportHandler(): (req: Request, _res: Response) => Promise<void>;
export declare const ctMonitor: CertificateTransparencyMonitor;
//# sourceMappingURL=securityHeaders.d.ts.map