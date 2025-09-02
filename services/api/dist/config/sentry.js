"use strict";
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
const integrations_1 = require("@sentry/integrations");
class SentryService {
    static instance;
    config;
    constructor() {
        this.config = {
            dsn: process.env.SENTRY_DSN || '',
            environment: process.env.NODE_ENV || 'development',
            release: process.env.APP_VERSION || 'unknown',
            sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0'),
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
            profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
            attachStacktrace: true,
            enabled: process.env.SENTRY_ENABLED === 'true',
        };
    }
    static getInstance() {
        if (!SentryService.instance) {
            SentryService.instance = new SentryService();
        }
        return SentryService.instance;
    }
    initialize(app) {
        if (!this.config.enabled || !this.config.dsn) {
            console.log('Sentry is disabled or DSN not provided');
            return;
        }
        Sentry.init({
            dsn: this.config.dsn,
            environment: this.config.environment,
            release: this.config.release,
            sampleRate: this.config.sampleRate,
            tracesSampleRate: this.config.tracesSampleRate,
            profilesSampleRate: this.config.profilesSampleRate,
            attachStacktrace: this.config.attachStacktrace,
            integrations: [
                // HTTP instrumentation
                new Sentry.Integrations.Http({ tracing: true }),
                // Express instrumentation
                ...(app ? [new Sentry.Integrations.Express({ app })] : []),
                // Prisma instrumentation
                new Sentry.Integrations.Prisma({ client: true }),
                // Console capture
                new integrations_1.CaptureConsole({
                    levels: ['error', 'warn'],
                }),
                // Performance profiling
                new profiling_node_1.ProfilingIntegration(),
                // Additional integrations
                new Sentry.Integrations.OnUncaughtException({
                    onFatalError: (err) => {
                        console.error('Fatal error occurred:', err);
                        if (err.message && err.stack) {
                            Sentry.captureException(err);
                        }
                    },
                }),
                new Sentry.Integrations.OnUnhandledRejection({
                    mode: 'strict',
                }),
            ],
            // Performance Monitoring
            tracesSampler: (samplingContext) => {
                // Customize sampling for different operations
                if (samplingContext.parentSampled === false) {
                    return 0;
                }
                // Higher sampling for critical operations
                if (samplingContext.transactionContext.name?.includes('/api/auth')) {
                    return 0.5;
                }
                if (samplingContext.transactionContext.name?.includes('/api/financial')) {
                    return 0.5;
                }
                // Lower sampling for health checks
                if (samplingContext.transactionContext.name?.includes('/health')) {
                    return 0.01;
                }
                return this.config.tracesSampleRate;
            },
            // Before send hook for filtering
            beforeSend: (event, hint) => {
                // Filter out sensitive data
                if (event.request?.cookies) {
                    delete event.request.cookies;
                }
                if (event.request?.data) {
                    const data = event.request.data;
                    // Remove sensitive fields
                    delete data.password;
                    delete data.token;
                    delete data.apiKey;
                    delete data.secret;
                }
                // Filter out specific errors
                if (hint.originalException) {
                    const error = hint.originalException;
                    // Ignore certain errors
                    if (error.message?.includes('ECONNREFUSED')) {
                        return null;
                    }
                    // Add custom context
                    event.contexts = {
                        ...event.contexts,
                        custom: {
                            nodeVersion: process.version,
                            platform: process.platform,
                            memoryUsage: process.memoryUsage(),
                        },
                    };
                }
                return event;
            },
            // Breadcrumb filtering
            beforeBreadcrumb: (breadcrumb) => {
                // Filter out noisy breadcrumbs
                if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
                    return null;
                }
                // Sanitize data in breadcrumbs
                if (breadcrumb.data?.password) {
                    breadcrumb.data.password = '[REDACTED]';
                }
                return breadcrumb;
            },
        });
        console.log('Sentry initialized successfully');
    }
    // Middleware for Express
    requestHandler() {
        return Sentry.Handlers.requestHandler();
    }
    tracingHandler() {
        return Sentry.Handlers.tracingHandler();
    }
    errorHandler() {
        return Sentry.Handlers.errorHandler({
            shouldHandleError: (error) => {
                // Capture all 4xx and 5xx errors
                const statusCode = error.statusCode || error.status;
                if (statusCode && statusCode >= 400) {
                    return true;
                }
                return true;
            },
        });
    }
    // Manual error capture methods
    captureException(error, context) {
        if (!this.config.enabled)
            return;
        Sentry.withScope((scope) => {
            if (context) {
                scope.setContext('additional', context);
            }
            Sentry.captureException(error);
        });
    }
    captureMessage(message, level = 'info') {
        if (!this.config.enabled)
            return;
        Sentry.captureMessage(message, level);
    }
    addBreadcrumb(breadcrumb) {
        if (!this.config.enabled)
            return;
        Sentry.addBreadcrumb(breadcrumb);
    }
    setUser(user) {
        if (!this.config.enabled)
            return;
        Sentry.setUser(user);
    }
    setTag(key, value) {
        if (!this.config.enabled)
            return;
        Sentry.setTag(key, value);
    }
    setContext(name, context) {
        if (!this.config.enabled)
            return;
        Sentry.setContext(name, context);
    }
    // Transaction monitoring
    startTransaction(name, op) {
        if (!this.config.enabled)
            return null;
        return Sentry.startTransaction({ name, op });
    }
    // Performance monitoring helpers
    measureDatabaseQuery(queryName, callback) {
        const transaction = this.startTransaction(queryName, 'db.query');
        return callback()
            .then((result) => {
            transaction?.setStatus('ok');
            return result;
        })
            .catch((error) => {
            transaction?.setStatus('internal_error');
            throw error;
        })
            .finally(() => {
            transaction?.finish();
        });
    }
    measureApiCall(endpoint, callback) {
        const transaction = this.startTransaction(endpoint, 'http.client');
        return callback()
            .then((result) => {
            transaction?.setStatus('ok');
            return result;
        })
            .catch((error) => {
            transaction?.setStatus('internal_error');
            throw error;
        })
            .finally(() => {
            transaction?.finish();
        });
    }
    // Cleanup
    async close(timeout) {
        return Sentry.close(timeout);
    }
}
exports.SentryService = SentryService;
// Export singleton instance
exports.sentryService = SentryService.getInstance();
//# sourceMappingURL=sentry.js.map