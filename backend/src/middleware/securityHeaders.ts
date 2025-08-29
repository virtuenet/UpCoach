/**
 * Enhanced Security Headers Middleware
 * Implements comprehensive security headers including HSTS, CSP, and more
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

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

const defaultConfig: SecurityHeadersConfig = {
  enableHSTS: true,
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubDomains: true,
  hstsPreload: true,
  enableCSP: true,
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://api.stripe.com', 'wss:'],
    'frame-src': ["'self'", 'https://js.stripe.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'block-all-mixed-content': [],
    'upgrade-insecure-requests': [],
  },
  enableXFrameOptions: true,
  xFrameOptions: 'DENY',
  enableXContentTypeOptions: true,
  enableReferrerPolicy: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  enablePermissionsPolicy: true,
  permissionsPolicy: {
    'accelerometer': ["'none'"],
    'camera': ["'none'"],
    'geolocation': ["'none'"],
    'gyroscope': ["'none'"],
    'magnetometer': ["'none'"],
    'microphone': ["'none'"],
    'payment': ["'self'"],
    'usb': ["'none'"],
  },
  enableExpectCT: true,
  expectCTMaxAge: 86400, // 24 hours
  expectCTEnforce: false,
  expectCTReportUri: undefined,
  enableCertificateTransparency: true,
  certificateTransparencyMaxAge: 86400,
};

/**
 * Generate CSP nonce for inline scripts
 */
export function generateCSPNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Build CSP header string from directives
 */
function buildCSPHeader(directives: Record<string, string[]>, nonce?: string): string {
  const cspParts: string[] = [];
  
  for (const [directive, values] of Object.entries(directives)) {
    if (values.length === 0) {
      cspParts.push(directive);
    } else {
      let directiveValues = [...values];
      
      // Add nonce to script-src and style-src if provided
      if (nonce && (directive === 'script-src' || directive === 'style-src')) {
        directiveValues.push(`'nonce-${nonce}'`);
      }
      
      cspParts.push(`${directive} ${directiveValues.join(' ')}`);
    }
  }
  
  return cspParts.join('; ');
}

/**
 * Build Permissions-Policy header
 */
function buildPermissionsPolicy(policies: Record<string, string[]>): string {
  const policyParts: string[] = [];
  
  for (const [feature, allowlist] of Object.entries(policies)) {
    if (allowlist.length === 0) {
      policyParts.push(`${feature}=()`);
    } else {
      policyParts.push(`${feature}=(${allowlist.join(' ')})`);
    }
  }
  
  return policyParts.join(', ');
}

/**
 * Security Headers Middleware
 */
export function securityHeaders(customConfig?: Partial<SecurityHeadersConfig>) {
  const config = { ...defaultConfig, ...customConfig };
  
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Generate nonce for this request
      const nonce = config.enableCSP ? generateCSPNonce() : undefined;
      if (nonce) {
        _res.locals.cspNonce = nonce;
      }
      
      // HSTS - HTTP Strict Transport Security
      if (config.enableHSTS) {
        let hstsValue = `max-age=${config.hstsMaxAge}`;
        if (config.hstsIncludeSubDomains) {
          hstsValue += '; includeSubDomains';
        }
        if (config.hstsPreload) {
          hstsValue += '; preload';
        }
        _res.setHeader('Strict-Transport-Security', hstsValue);
      }
      
      // CSP - Content Security Policy
      if (config.enableCSP && config.cspDirectives) {
        const cspHeader = buildCSPHeader(config.cspDirectives, nonce);
        _res.setHeader('Content-Security-Policy', cspHeader);
        
        // Report-only mode for monitoring
        if (process.env.CSP_REPORT_ONLY === 'true') {
          _res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
        }
      }
      
      // X-Frame-Options
      if (config.enableXFrameOptions) {
        _res.setHeader('X-Frame-Options', config.xFrameOptions || 'DENY');
      }
      
      // X-Content-Type-Options
      if (config.enableXContentTypeOptions) {
        _res.setHeader('X-Content-Type-Options', 'nosniff');
      }
      
      // Referrer-Policy
      if (config.enableReferrerPolicy) {
        _res.setHeader('Referrer-Policy', config.referrerPolicy || 'strict-origin-when-cross-origin');
      }
      
      // Permissions-Policy (formerly Feature-Policy)
      if (config.enablePermissionsPolicy && config.permissionsPolicy) {
        const permissionsHeader = buildPermissionsPolicy(config.permissionsPolicy);
        _res.setHeader('Permissions-Policy', permissionsHeader);
      }
      
      // Expect-CT - Certificate Transparency
      if (config.enableExpectCT) {
        let expectCTValue = `max-age=${config.expectCTMaxAge}`;
        if (config.expectCTEnforce) {
          expectCTValue += ', enforce';
        }
        if (config.expectCTReportUri) {
          expectCTValue += `, report-uri="${config.expectCTReportUri}"`;
        }
        _res.setHeader('Expect-CT', expectCTValue);
      }
      
      // X-DNS-Prefetch-Control
      _res.setHeader('X-DNS-Prefetch-Control', 'off');
      
      // X-Download-Options (IE specific)
      _res.setHeader('X-Download-Options', 'noopen');
      
      // X-Permitted-Cross-Domain-Policies
      _res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
      
      // Remove potentially dangerous headers
      _res.removeHeader('X-Powered-By');
      _res.removeHeader('Server');
      
      next();
    } catch (error) {
      logger.error('Error setting security headers:', error);
      next(); // Continue even if security headers fail
    }
  };
}

/**
 * Certificate Transparency Monitoring
 */
export class CertificateTransparencyMonitor {
  private static instance: CertificateTransparencyMonitor;
  private reportEndpoint?: string;
  
  private constructor() {}
  
  static getInstance(): CertificateTransparencyMonitor {
    if (!CertificateTransparencyMonitor.instance) {
      CertificateTransparencyMonitor.instance = new CertificateTransparencyMonitor();
    }
    return CertificateTransparencyMonitor.instance;
  }
  
  /**
   * Configure CT monitoring
   */
  configure(reportEndpoint: string) {
    this.reportEndpoint = reportEndpoint;
    logger.info('Certificate Transparency monitoring configured', { reportEndpoint });
  }
  
  /**
   * Process CT violation report
   */
  async processReport(report: any): Promise<void> {
    try {
      logger.warn('Certificate Transparency violation detected', report);
      
      // Send alert to monitoring service
      if (this.reportEndpoint) {
        const response = await fetch(this.reportEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'ct-violation',
            timestamp: new Date().toISOString(),
            report,
          }),
        });
        
        if (!response.ok) {
          logger.error('Failed to send CT violation report', { status: response.status });
        }
      }
      
      // Store violation for audit
      await this.storeViolation(report);
    } catch (error) {
      logger.error('Error processing CT violation report', error);
    }
  }
  
  /**
   * Store CT violation for audit trail
   */
  private async storeViolation(report: any): Promise<void> {
    // Store in database or file system
    // This would integrate with your audit logging system
    logger.info('CT violation stored for audit', { reportId: report.id });
  }
  
  /**
   * Middleware to handle CT violation reports
   */
  middleware() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      if (req.path === '/api/security/ct-report' && req.method === 'POST') {
        await this.processReport(req.body);
        _res.status(204).send();
        return;
      }
      next();
    };
  }
}

/**
 * Security Report URI Handler
 */
export function securityReportHandler() {
  return async (req: Request, _res: Response) => {
    try {
      const reportType = req.path.split('/').pop();
      const report = req.body;
      
      logger.warn(`Security violation report received: ${reportType}`, report);
      
      // Process different report types
      switch (reportType) {
        case 'csp':
          await processCSPReport(report);
          break;
        case 'ct':
          await CertificateTransparencyMonitor.getInstance().processReport(report);
          break;
        case 'expect-ct':
          await processExpectCTReport(report);
          break;
        default:
          logger.warn('Unknown security report type', { reportType });
      }
      
      _res.status(204).send();
    } catch (error) {
      logger.error('Error processing security report', error);
      _res.status(500).json({ error: 'Failed to process report' });
    }
  };
}

/**
 * Process CSP violation report
 */
async function processCSPReport(report: any): Promise<void> {
  logger.warn('CSP violation detected', {
    documentUri: report['document-uri'],
    violatedDirective: report['violated-directive'],
    blockedUri: report['blocked-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
  });
  
  // TODO: Send to monitoring service
  // TODO: Store for analysis
}

/**
 * Process Expect-CT report
 */
async function processExpectCTReport(report: any): Promise<void> {
  logger.warn('Expect-CT violation detected', {
    hostname: report.hostname,
    port: report.port,
    effectiveExpirationDate: report['effective-expiration-date'],
    failureMode: report['failure-mode'],
    servedCertificateChain: report['served-certificate-chain'],
  });
  
  // TODO: Alert security team
  // TODO: Store for compliance
}

// Export singleton instance
export const ctMonitor = CertificateTransparencyMonitor.getInstance();