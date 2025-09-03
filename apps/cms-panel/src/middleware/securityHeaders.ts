/**
 * Security Headers Middleware
 * Configures all security headers including CSP with nonces
 */

import { cspService } from '../services/security/cspService';
import { logger } from '../utils/logger';

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
export function configureSecurityHeaders(config: SecurityHeadersConfig = {}) {
  return (req: any, res: any, next: any) => {
    try {
      // 1. Content Security Policy with nonce
      if (config.csp?.enabled !== false) {
        const nonce = cspService.generateNonce();

        // Store nonce for use in app
        res.locals = res.locals || {};
        res.locals.cspNonce = nonce;

        // Generate CSP header
        const cspHeader = cspService.generateCSPHeader(
          nonce,
          cspService.getEnvironmentDirectives(),
          {
            reportOnly: config.csp?.reportOnly,
            reportUri: config.csp?.reportUri,
            upgradeInsecureRequests: true,
            blockAllMixedContent: true,
          }
        );

        const headerName = config.csp?.reportOnly
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy';

        res.setHeader(headerName, cspHeader);

        // Add Report-To header if configured
        if (config.csp?.reportUri) {
          res.setHeader('Report-To', cspService.generateReportToHeader(config.csp.reportUri));
        }
      }

      // 2. HTTP Strict Transport Security (HSTS)
      if (config.hsts?.enabled !== false && !isDevelopment()) {
        const maxAge = config.hsts?.maxAge || 31536000; // 1 year default
        let hstsValue = `max-age=${maxAge}`;

        if (config.hsts?.includeSubDomains) {
          hstsValue += '; includeSubDomains';
        }

        if (config.hsts?.preload) {
          hstsValue += '; preload';
        }

        res.setHeader('Strict-Transport-Security', hstsValue);
      }

      // 3. Certificate Transparency
      if (config.certificateTransparency?.enabled && !isDevelopment()) {
        const maxAge = config.certificateTransparency?.maxAge || 86400; // 24 hours default
        let ctValue = `max-age=${maxAge}`;

        if (config.certificateTransparency?.enforce) {
          ctValue += ', enforce';
        }

        res.setHeader('Expect-CT', ctValue);
      }

      // 4. X-Content-Type-Options
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // 5. X-Frame-Options
      res.setHeader('X-Frame-Options', 'DENY');

      // 6. X-XSS-Protection (legacy but still useful)
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // 7. Referrer-Policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // 8. Permissions-Policy
      res.setHeader(
        'Permissions-Policy',
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
      );

      // 9. Cross-Origin-Embedder-Policy
      if (!isDevelopment()) {
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      }

      // 10. Cross-Origin-Opener-Policy
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

      // 11. Cross-Origin-Resource-Policy
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

      // Log security headers applied
      logger.debug('Security headers applied', {
        path: req.path,
        nonce: res.locals.cspNonce,
      });

      next();
    } catch (error) {
      logger.error('Failed to apply security headers', error);
      next(error);
    }
  };
}

/**
 * Vite plugin for security headers
 */
export function viteSecurityHeaders(config: SecurityHeadersConfig = {}) {
  return {
    name: 'security-headers',
    configureServer(server: any) {
      server.middlewares.use(configureSecurityHeaders(config));
    },
    transformIndexHtml(html: string, ctx: any) {
      // Inject CSP nonce into HTML
      const nonce = ctx.server?.locals?.cspNonce || cspService.generateNonce();

      // Add nonce to script tags
      html = html.replace(/<script([^>]*)>/g, `<script nonce="${nonce}"$1>`);

      // Add nonce to style tags
      html = html.replace(/<style([^>]*)>/g, `<style nonce="${nonce}"$1>`);

      // Add CSP meta tag
      const cspMeta = cspService.generateCSPMetaTag(nonce, cspService.getEnvironmentDirectives(), {
        reportOnly: config.csp?.reportOnly,
        reportUri: config.csp?.reportUri,
      });

      // Insert CSP meta tag in head
      html = html.replace('</head>', `  ${cspMeta}\n  </head>`);

      // Inject nonce into window for client-side use
      const nonceScript = `
        <script nonce="${nonce}">
          window.__CSP_NONCE__ = '${nonce}';
        </script>
      `;

      html = html.replace('</head>', `  ${nonceScript}\n  </head>`);

      return html;
    },
  };
}

/**
 * CSP violation report handler
 */
export function handleCSPViolation(req: any, res: any) {
  try {
    const report = req.body;

    // Handle the violation report
    cspService.handleViolationReport(report);

    // Respond with 204 No Content
    res.status(204).end();
  } catch (error) {
    logger.error('Failed to handle CSP violation report', error);
    res.status(500).json({ error: 'Failed to process report' });
  }
}

/**
 * Check if running in development
 */
function isDevelopment(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'dev' ||
    (typeof import.meta !== 'undefined' && import.meta.env?.DEV)
  );
}

/**
 * Production security configuration
 */
export const productionSecurityConfig: SecurityHeadersConfig = {
  csp: {
    enabled: true,
    reportOnly: false,
    reportUri: '/api/security/csp-report',
  },
  hsts: {
    enabled: true,
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
  certificateTransparency: {
    enabled: true,
    enforce: true,
    maxAge: 86400, // 24 hours
  },
};

/**
 * Development security configuration
 */
export const developmentSecurityConfig: SecurityHeadersConfig = {
  csp: {
    enabled: true,
    reportOnly: true, // Report only in development
    reportUri: '/api/security/csp-report',
  },
  hsts: {
    enabled: false, // Disable HSTS in development
  },
  certificateTransparency: {
    enabled: false, // Disable CT in development
  },
};
