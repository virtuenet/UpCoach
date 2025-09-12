/**
 * Content Security Policy Service
 * Implements nonce-based CSP to eliminate unsafe-inline and unsafe-eval
 */

import * as crypto from 'crypto';
import { logger } from '../../utils/logger';

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

class ContentSecurityPolicyService {
  private static instance: ContentSecurityPolicyService;
  private nonces: Set<string> = new Set();
  private readonly NONCE_LENGTH = 16;
  private readonly MAX_NONCES = 1000;

  // Production-ready CSP directives (no unsafe-inline or unsafe-eval)
  private readonly defaultDirectives: CSPDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'strict-dynamic'", // Allow scripts loaded by trusted scripts
      'https://cdn.jsdelivr.net', // For libraries
      'https://*.sentry.io', // For Sentry
      'https://*.datadog.com', // For DataDog
    ],
    'style-src': ["'self'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'connect-src': [
      "'self'",
      'http://localhost:7000', // Backend API (dev)
      'http://localhost:1080', // Backend API (dev)
      'https://api.upcoach.ai', // Production API
      'https://*.sentry.io', // Sentry
      'https://*.datadog.com', // DataDog
      'wss:', // WebSocket connections
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'self'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
  };

  private constructor() {
    // Clean up old nonces periodically
    setInterval(() => this.cleanupNonces(), 60000); // Every minute
  }

  static getInstance(): ContentSecurityPolicyService {
    if (!ContentSecurityPolicyService.instance) {
      ContentSecurityPolicyService.instance = new ContentSecurityPolicyService();
    }
    return ContentSecurityPolicyService.instance;
  }

  /**
   * Generate a new nonce for inline scripts/styles
   */
  generateNonce(): string {
    const nonce = crypto.randomBytes(this.NONCE_LENGTH).toString('base64');

    // Store nonce for validation
    this.nonces.add(nonce);

    // Prevent memory leak
    if (this.nonces.size > this.MAX_NONCES) {
      const firstNonce = this.nonces.values().next().value;
      if (firstNonce) {
        this.nonces.delete(firstNonce);
      }
    }

    return nonce;
  }

  /**
   * Validate a nonce
   */
  validateNonce(nonce: string): boolean {
    return this.nonces.has(nonce);
  }

  /**
   * Generate CSP header value
   */
  generateCSPHeader(
    nonce?: string,
    customDirectives?: Partial<CSPDirectives>,
    config?: CSPConfig
  ): string {
    const directives = { ...this.defaultDirectives, ...customDirectives };

    // Add nonce to script-src and style-src if provided
    if (nonce) {
      if (directives['script-src']) {
        directives['script-src'] = [...directives['script-src'], `'nonce-${nonce}'`];
      }
      if (directives['style-src']) {
        directives['style-src'] = [...directives['style-src'], `'nonce-${nonce}'`];
      }
    }

    // Add report-uri if configured
    if (config?.reportUri) {
      directives['report-uri'] = [config.reportUri];
    }

    // Add upgrade-insecure-requests if configured
    if (config?.upgradeInsecureRequests && import.meta.env.PROD) {
      directives['upgrade-insecure-requests'] = [];
    }

    // Add block-all-mixed-content if configured
    if (config?.blockAllMixedContent) {
      directives['block-all-mixed-content'] = [];
    }

    // Build CSP string
    const cspString = Object.entries(directives)
      .filter(([_, values]) => values && values.length >= 0)
      .map(([directive, values]) => {
        if (values.length === 0) {
          return directive;
        }
        return `${directive} ${values.join(' ')}`;
      })
      .join('; ');

    return cspString;
  }

  /**
   * Generate CSP meta tag for HTML
   */
  generateCSPMetaTag(
    nonce?: string,
    customDirectives?: Partial<CSPDirectives>,
    config?: CSPConfig
  ): string {
    const cspContent = this.generateCSPHeader(nonce, customDirectives, config);
    return `<meta http-equiv="Content-Security-Policy" content="${this.escapeHTMLAttribute(cspContent)}">`;
  }

  /**
   * Generate Report-To header value for CSP reporting
   */
  generateReportToHeader(endpoint: string): string {
    const reportTo = {
      group: 'csp-endpoint',
      max_age: 86400, // 24 hours
      endpoints: [{ url: endpoint }],
      include_subdomains: true,
    };

    return JSON.stringify(reportTo);
  }

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
  } {
    const cspReport = report['csp-report'] || report;

    return {
      documentUri: cspReport['document-uri'] || cspReport.documentURI,
      violatedDirective: cspReport['violated-directive'] || cspReport.violatedDirective,
      blockedUri: cspReport['blocked-uri'] || cspReport.blockedURI,
      sourceFile: cspReport['source-file'] || cspReport.sourceFile,
      lineNumber: cspReport['line-number'] || cspReport.lineNumber,
      columnNumber: cspReport['column-number'] || cspReport.columnNumber,
      sample: cspReport['script-sample'] || cspReport.sample,
    };
  }

  /**
   * Handle CSP violation report
   */
  handleViolationReport(report: any): void {
    const violation = this.parseViolationReport(report);

    // Log violation for monitoring
    logger.warn('CSP violation detected', violation);

    // Track violations for analysis
    this.trackViolation(violation);
  }

  /**
   * Track CSP violations for analysis
   */
  private trackViolation(violation: any): void {
    // This could be sent to monitoring service
    // For now, just log it
    const violationKey = `${violation.violatedDirective}:${violation.blockedUri}`;

    // You could implement rate limiting here to prevent spam
    logger.info('CSP violation tracked', {
      key: violationKey,
      violation,
    });
  }

  /**
   * Clean up old nonces
   */
  private cleanupNonces(): void {
    // Clear nonces older than 5 minutes
    // In production, you'd track creation time
    if (this.nonces.size > this.MAX_NONCES / 2) {
      const toDelete = this.nonces.size - this.MAX_NONCES / 2;
      const iterator = this.nonces.values();

      for (let i = 0; i < toDelete; i++) {
        const nonce = iterator.next().value;
        if (nonce) {
          this.nonces.delete(nonce);
        }
      }
    }
  }

  /**
   * Escape HTML attribute value
   */
  private escapeHTMLAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Generate inline script with nonce
   */
  generateInlineScript(script: string, nonce: string): string {
    return `<script nonce="${this.escapeHTMLAttribute(nonce)}">${script}</script>`;
  }

  /**
   * Generate inline style with nonce
   */
  generateInlineStyle(style: string, nonce: string): string {
    return `<style nonce="${this.escapeHTMLAttribute(nonce)}">${style}</style>`;
  }

  /**
   * Middleware for Express to add CSP headers
   */
  middleware(config?: CSPConfig) {
    return (req: any, res: any, next: any) => {
      // Generate nonce for this request
      const nonce = this.generateNonce();

      // Store nonce in response locals for use in templates
      res.locals.cspNonce = nonce;

      // Generate CSP header
      const cspHeader = this.generateCSPHeader(nonce, {}, config);

      // Set appropriate header based on config
      const headerName = config?.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';

      res.setHeader(headerName, cspHeader);

      // Add Report-To header if configured
      if (config?.reportUri) {
        res.setHeader('Report-To', this.generateReportToHeader(config.reportUri));
      }

      next();
    };
  }

  /**
   * Get CSP directives for specific environment
   */
  getEnvironmentDirectives(): CSPDirectives {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      // More permissive in development
      return {
        ...this.defaultDirectives,
        'script-src': [
          ...(this.defaultDirectives['script-src'] || []),
          "'unsafe-eval'", // Required for HMR in development
          'http://localhost:*', // Allow local development servers
        ],
        'connect-src': [
          ...(this.defaultDirectives['connect-src'] || []),
          'ws://localhost:*', // WebSocket for HMR
        ],
      };
    }

    return this.defaultDirectives;
  }

  /**
   * Validate CSP configuration
   */
  validateConfiguration(directives: CSPDirectives): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for unsafe directives in production
    if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
      const unsafePatterns = ["'unsafe-inline'", "'unsafe-eval'"];

      for (const [directive, values] of Object.entries(directives)) {
        if (values && Array.isArray(values)) {
          for (const pattern of unsafePatterns) {
            if (values.includes(pattern)) {
              errors.push(`${directive} contains ${pattern} which is not allowed in production`);
            }
          }
        }
      }
    }

    // Check for overly permissive directives
    if (directives['default-src']?.includes('*')) {
      warnings.push("default-src contains '*' which is overly permissive");
    }

    // Ensure critical directives are set
    if (!directives['default-src']) {
      warnings.push('default-src is not set, consider adding it for defense in depth');
    }

    if (!directives['frame-ancestors']) {
      warnings.push('frame-ancestors is not set, consider adding it to prevent clickjacking');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }
}

// Export singleton instance
export const cspService = ContentSecurityPolicyService.getInstance();

// Export React hook for using CSP nonce
export function useCSPNonce(): string {
  // Get nonce from window object (set by server)
  if (typeof window !== 'undefined' && (window as any).__CSP_NONCE__) {
    return (window as any).__CSP_NONCE__;
  }

  // Generate new nonce if not available (client-side only)
  return cspService.generateNonce();
}

// Helper to inject nonce into React app
export function injectCSPNonce(nonce: string): void {
  if (typeof window !== 'undefined') {
    (window as any).__CSP_NONCE__ = nonce;
  }
}
