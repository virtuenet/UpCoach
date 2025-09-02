"use strict";
/**
 * Sentry Monitoring Service
 * Provides error tracking, performance monitoring, and release tracking
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentryService = exports.SentryService = void 0;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const logger_1 = require("../../utils/logger");
class SentryService {
    static instance;
    initialized = false;
    constructor() { }
    static getInstance() {
        if (!SentryService.instance) {
            SentryService.instance = new SentryService();
        }
        return SentryService.instance;
    }
    /**
     * Initialize Sentry with configuration
     */
    initialize(config) {
        if (this.initialized) {
            logger_1.logger.warn('Sentry already initialized');
            return;
        }
        try {
            Sentry.init({
                dsn: config.dsn,
                environment: config.environment,
                release: config.release || process.env.npm_package_version,
                // Performance Monitoring
                tracesSampleRate: config.tracesSampleRate || 0.1,
                profilesSampleRate: config.profilesSampleRate || 0.1,
                // Enhanced error tracking
                debug: config.debug || process.env.NODE_ENV === 'development',
                integrations: [
                    // HTTP integration
                    Sentry.httpIntegration(),
                    // Express integration
                    Sentry.expressIntegration(),
                    // Profiling
                    (0, profiling_node_1.nodeProfilingIntegration)(),
                    // Custom integrations
                    ...(config.integrations || []),
                ],
                // Data scrubbing - removed due to type compatibility issues
                // Breadcrumb configuration
                beforeBreadcrumb: this.beforeBreadcrumb,
                // Additional options
                attachStacktrace: true,
                // Transport options
                transportOptions: {
                    keepAlive: true,
                },
            });
            this.initialized = true;
            logger_1.logger.info('Sentry initialized successfully', {
                environment: config.environment,
                release: config.release,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Sentry', error);
        }
    }
    /**
     * Set up Express middleware
     */
    setupExpressMiddleware(app) {
        if (!this.initialized) {
            logger_1.logger.warn('Sentry not initialized, skipping middleware setup');
            return;
        }
        // Request handler creates a separate execution context
        // app.use(Sentry.Handlers.requestHandler()); // Replaced by expressIntegration in v8
        // TracingHandler creates a trace for every incoming request - handled by integration now
        // app.use(Sentry.Handlers.tracingHandler()); // Removed in v8
    }
    /**
     * Set up error handler (should be after all other middleware)
     */
    setupErrorHandler(app) {
        if (!this.initialized) {
            logger_1.logger.warn('Sentry not initialized, skipping error handler setup');
            return;
        }
        app.use(Sentry.expressErrorHandler({
            shouldHandleError: error => {
                // Capture 4xx and 5xx errors
                if (error.status && error.status >= 400) {
                    return true;
                }
                return true;
            },
        }));
    }
    /**
     * Capture exception manually
     */
    captureException(error, context) {
        if (!this.initialized) {
            logger_1.logger.error('Sentry not initialized, cannot capture exception', error);
            return '';
        }
        const eventId = Sentry.captureException(error, {
            extra: context,
            tags: this.getDefaultTags(),
        });
        logger_1.logger.error('Exception captured in Sentry', { eventId, error });
        return eventId;
    }
    /**
     * Capture message
     */
    captureMessage(message, level = 'info', context) {
        if (!this.initialized) {
            logger_1.logger.warn('Sentry not initialized, cannot capture message');
            return '';
        }
        const eventId = Sentry.captureMessage(message, level);
        return eventId;
    }
    /**
     * Add breadcrumb for debugging
     */
    addBreadcrumb(breadcrumb) {
        if (!this.initialized)
            return;
        Sentry.addBreadcrumb(breadcrumb);
    }
    /**
     * Set user context
     */
    setUser(user) {
        if (!this.initialized)
            return;
        Sentry.setUser(user);
    }
    /**
     * Set additional context
     */
    setContext(key, context) {
        if (!this.initialized)
            return;
        Sentry.setContext(key, context);
    }
    /**
     * Set tags for categorization
     */
    setTags(tags) {
        if (!this.initialized)
            return;
        Sentry.setTags(tags);
    }
    /**
     * Start a transaction for performance monitoring
     */
    startTransaction(name, op) {
        if (!this.initialized)
            return null;
        return Sentry.startSpan({ name, op }, (span) => span);
    }
    /**
     * Create a custom middleware for route transactions
     */
    routeTransaction() {
        return (req, _res, next) => {
            if (!this.initialized) {
                return next();
            }
            const span = Sentry.getActiveSpan();
            if (span) {
                // Set span attributes
                span.setAttributes({
                    'http.method': req.method,
                    'http.route': req.path,
                });
                _res.on('finish', () => {
                    span.setStatus({ code: _res.statusCode >= 400 ? 2 : 1 }); // SpanStatusCode.ERROR : OK
                    // span.end(); // Handled automatically in v8
                });
            }
            next();
        };
    }
    /**
     * Flush events before shutdown
     */
    async flush(timeout = 2000) {
        if (!this.initialized)
            return true;
        try {
            const result = await Sentry.flush(timeout);
            logger_1.logger.info('Sentry events flushed successfully');
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to flush Sentry events', error);
            return false;
        }
    }
    /**
     * Close Sentry client
     */
    async close(timeout = 2000) {
        if (!this.initialized)
            return true;
        try {
            const result = await Sentry.close(timeout);
            this.initialized = false;
            logger_1.logger.info('Sentry closed successfully');
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to close Sentry', error);
            return false;
        }
    }
    /**
     * Data scrubbing before sending to Sentry
     */
    beforeSend(event) {
        // Remove sensitive data
        if (event.request) {
            // Remove authorization headers
            if (event.request.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
                delete event.request.headers['x-api-key'];
            }
            // Remove sensitive body data
            if (event.request.data) {
                const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
                sensitiveFields.forEach(field => {
                    if (event.request.data[field]) {
                        event.request.data[field] = '[REDACTED]';
                    }
                });
            }
        }
        // Remove sensitive user data
        if (event.user) {
            if (event.user.email) {
                // Partially mask email
                const [username, domain] = event.user.email.split('@');
                if (username && domain) {
                    const maskedUsername = username.substring(0, 2) + '***';
                    event.user.email = `${maskedUsername}@${domain}`;
                }
            }
        }
        // Don't send events in test environment
        if (process.env.NODE_ENV === 'test') {
            return null;
        }
        return event;
    }
    /**
     * Filter breadcrumbs
     */
    beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
        }
        // Remove sensitive data from breadcrumbs
        if (breadcrumb.data) {
            const sensitiveKeys = ['password', 'token', 'apiKey', 'secret'];
            sensitiveKeys.forEach(key => {
                if (breadcrumb.data && breadcrumb.data[key]) {
                    breadcrumb.data[key] = '[REDACTED]';
                }
            });
        }
        return breadcrumb;
    }
    /**
     * Get default tags for all events
     */
    getDefaultTags() {
        return {
            service: 'backend',
            hostname: process.env.HOSTNAME || 'unknown',
            nodeVersion: process.version,
        };
    }
    /**
     * Performance monitoring helper
     */
    measurePerformance(operation, fn) {
        if (!this.initialized) {
            return fn();
        }
        const transaction = this.startTransaction(operation, 'function');
        return fn()
            .then(result => {
            transaction?.setStatus({ code: 1 }); // SpanStatusCode.OK
            return result;
        })
            .catch(error => {
            transaction?.setStatus({ code: 2 }); // SpanStatusCode.ERROR
            throw error;
        })
            .finally(() => {
            // transaction?.finish(); // Handled automatically in v8
        });
    }
    /**
     * Wrap async functions with error tracking
     */
    wrapAsync(fn, context) {
        return (async (...args) => {
            try {
                return await fn(...args);
            }
            catch (error) {
                this.captureException(error, {
                    context,
                    args: args.map((arg, index) => {
                        // Don't log sensitive data
                        if (typeof arg === 'object' && arg !== null) {
                            const cleaned = { ...arg };
                            delete cleaned.password;
                            delete cleaned.token;
                            return cleaned;
                        }
                        return arg;
                    }),
                });
                throw error;
            }
        });
    }
}
exports.SentryService = SentryService;
// Export singleton instance
exports.sentryService = SentryService.getInstance();
//# sourceMappingURL=SentryService.js.map