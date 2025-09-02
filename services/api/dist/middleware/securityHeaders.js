"use strict";
/**
 * Enhanced Security Headers Middleware
 * Implements comprehensive security headers including HSTS, CSP, and more
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ctMonitor = exports.CertificateTransparencyMonitor = void 0;
exports.generateCSPNonce = generateCSPNonce;
exports.securityHeaders = securityHeaders;
exports.securityReportHandler = securityReportHandler;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const defaultConfig = {
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
        accelerometer: ["'none'"],
        camera: ["'none'"],
        geolocation: ["'none'"],
        gyroscope: ["'none'"],
        magnetometer: ["'none'"],
        microphone: ["'none'"],
        payment: ["'self'"],
        usb: ["'none'"],
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
function generateCSPNonce() {
    return crypto_1.default.randomBytes(16).toString('base64');
}
/**
 * Build CSP header string from directives
 */
function buildCSPHeader(directives, nonce) {
    const cspParts = [];
    for (const [directive, values] of Object.entries(directives)) {
        if (values.length === 0) {
            cspParts.push(directive);
        }
        else {
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
function buildPermissionsPolicy(policies) {
    const policyParts = [];
    for (const [feature, allowlist] of Object.entries(policies)) {
        if (allowlist.length === 0) {
            policyParts.push(`${feature}=()`);
        }
        else {
            policyParts.push(`${feature}=(${allowlist.join(' ')})`);
        }
    }
    return policyParts.join(', ');
}
/**
 * Security Headers Middleware
 */
function securityHeaders(customConfig) {
    const config = { ...defaultConfig, ...customConfig };
    return (req, _res, next) => {
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
        }
        catch (error) {
            logger_1.logger.error('Error setting security headers:', error);
            next(); // Continue even if security headers fail
        }
    };
}
/**
 * Certificate Transparency Monitoring
 */
class CertificateTransparencyMonitor {
    static instance;
    reportEndpoint;
    constructor() { }
    static getInstance() {
        if (!CertificateTransparencyMonitor.instance) {
            CertificateTransparencyMonitor.instance = new CertificateTransparencyMonitor();
        }
        return CertificateTransparencyMonitor.instance;
    }
    /**
     * Configure CT monitoring
     */
    configure(reportEndpoint) {
        this.reportEndpoint = reportEndpoint;
        logger_1.logger.info('Certificate Transparency monitoring configured', { reportEndpoint });
    }
    /**
     * Process CT violation report
     */
    async processReport(report) {
        try {
            logger_1.logger.warn('Certificate Transparency violation detected', report);
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
                    logger_1.logger.error('Failed to send CT violation report', { status: response.status });
                }
            }
            // Store violation for audit
            await this.storeViolation(report);
        }
        catch (error) {
            logger_1.logger.error('Error processing CT violation report', error);
        }
    }
    /**
     * Store CT violation for audit trail
     */
    async storeViolation(report) {
        // Store in database or file system
        // This would integrate with your audit logging system
        logger_1.logger.info('CT violation stored for audit', { reportId: report.id });
    }
    /**
     * Middleware to handle CT violation reports
     */
    middleware() {
        return async (req, _res, next) => {
            if (req.path === '/api/security/ct-report' && req.method === 'POST') {
                await this.processReport(req.body);
                _res.status(204).send();
                return;
            }
            next();
        };
    }
}
exports.CertificateTransparencyMonitor = CertificateTransparencyMonitor;
/**
 * Security Report URI Handler
 */
function securityReportHandler() {
    return async (req, _res) => {
        try {
            const reportType = req.path.split('/').pop();
            const report = req.body;
            logger_1.logger.warn(`Security violation report received: ${reportType}`, report);
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
                    logger_1.logger.warn('Unknown security report type', { reportType });
            }
            _res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Error processing security report', error);
            _res.status(500).json({ error: 'Failed to process report' });
        }
    };
}
/**
 * Process CSP violation report
 */
async function processCSPReport(report) {
    logger_1.logger.warn('CSP violation detected', {
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
async function processExpectCTReport(report) {
    logger_1.logger.warn('Expect-CT violation detected', {
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
exports.ctMonitor = CertificateTransparencyMonitor.getInstance();
//# sourceMappingURL=securityHeaders.js.map