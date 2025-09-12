"use strict";
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
    hstsMaxAge: 31536000,
    hstsIncludeSubDomains: true,
    hstsPreload: true,
    enableCSP: true,
    cspDirectives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'strict-dynamic'", 'https://cdn.jsdelivr.net', 'https://js.stripe.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'https://api.stripe.com', 'wss:'],
        'frame-src': ["'self'", 'https://js.stripe.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'", 'https://upcoach.ai'],
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
    expectCTMaxAge: 86400,
    expectCTEnforce: false,
    expectCTReportUri: undefined,
    enableCertificateTransparency: true,
    certificateTransparencyMaxAge: 86400,
};
function generateCSPNonce() {
    return crypto_1.default.randomBytes(16).toString('base64');
}
function buildCSPHeader(directives, nonce) {
    const cspParts = [];
    for (const [directive, values] of Object.entries(directives)) {
        if (values.length === 0) {
            cspParts.push(directive);
        }
        else {
            const directiveValues = [...values];
            if (nonce && (directive === 'script-src' || directive === 'style-src')) {
                directiveValues.push(`'nonce-${nonce}'`);
            }
            cspParts.push(`${directive} ${directiveValues.join(' ')}`);
        }
    }
    return cspParts.join('; ');
}
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
function securityHeaders(customConfig) {
    const config = { ...defaultConfig, ...customConfig };
    return (req, _res, next) => {
        try {
            const nonce = config.enableCSP ? generateCSPNonce() : undefined;
            if (nonce) {
                _res.locals.cspNonce = nonce;
            }
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
            if (config.enableCSP && config.cspDirectives) {
                const cspHeader = buildCSPHeader(config.cspDirectives, nonce);
                _res.setHeader('Content-Security-Policy', cspHeader);
                if (process.env.CSP_REPORT_ONLY === 'true') {
                    _res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
                }
            }
            if (config.enableXFrameOptions) {
                _res.setHeader('X-Frame-Options', config.xFrameOptions || 'DENY');
            }
            if (config.enableXContentTypeOptions) {
                _res.setHeader('X-Content-Type-Options', 'nosniff');
            }
            if (config.enableReferrerPolicy) {
                _res.setHeader('Referrer-Policy', config.referrerPolicy || 'strict-origin-when-cross-origin');
            }
            if (config.enablePermissionsPolicy && config.permissionsPolicy) {
                const permissionsHeader = buildPermissionsPolicy(config.permissionsPolicy);
                _res.setHeader('Permissions-Policy', permissionsHeader);
            }
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
            _res.setHeader('X-DNS-Prefetch-Control', 'off');
            _res.setHeader('X-Download-Options', 'noopen');
            _res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
            _res.removeHeader('X-Powered-By');
            _res.removeHeader('Server');
            next();
        }
        catch (error) {
            logger_1.logger.error('Error setting security headers:', error);
            next();
        }
    };
}
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
    configure(reportEndpoint) {
        this.reportEndpoint = reportEndpoint;
        logger_1.logger.info('Certificate Transparency monitoring configured', { reportEndpoint });
    }
    async processReport(report) {
        try {
            logger_1.logger.warn('Certificate Transparency violation detected', report);
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
            await this.storeViolation(report);
        }
        catch (error) {
            logger_1.logger.error('Error processing CT violation report', error);
        }
    }
    async storeViolation(report) {
        logger_1.logger.info('CT violation stored for audit', { reportId: report.id });
    }
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
function securityReportHandler() {
    return async (req, _res) => {
        try {
            const reportType = req.path.split('/').pop();
            const report = req.body;
            logger_1.logger.warn(`Security violation report received: ${reportType}`, report);
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
async function processCSPReport(report) {
    logger_1.logger.warn('CSP violation detected', {
        documentUri: report['document-uri'],
        violatedDirective: report['violated-directive'],
        blockedUri: report['blocked-uri'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
    });
}
async function processExpectCTReport(report) {
    logger_1.logger.warn('Expect-CT violation detected', {
        hostname: report.hostname,
        port: report.port,
        effectiveExpirationDate: report['effective-expiration-date'],
        failureMode: report['failure-mode'],
        servedCertificateChain: report['served-certificate-chain'],
    });
}
exports.ctMonitor = CertificateTransparencyMonitor.getInstance();
//# sourceMappingURL=securityHeaders.js.map