/**
 * Sentry Frontend Monitoring Initialization
 * Error tracking and performance monitoring for CMS Panel
 */
import * as React from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// React Router integration handled by Sentry browserTracingIntegration
import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration, captureConsoleIntegration } from '@sentry/react';
import { logger } from '../../utils/logger';
class SentryFrontendService {
    constructor() {
        this.initialized = false;
    }
    static getInstance() {
        if (!SentryFrontendService.instance) {
            SentryFrontendService.instance = new SentryFrontendService();
        }
        return SentryFrontendService.instance;
    }
    /**
     * Initialize Sentry for React application
     */
    initialize(config) {
        if (this.initialized) {
            logger.warn('Sentry already initialized');
            return;
        }
        // Don't initialize in development unless explicitly enabled
        if (import.meta.env.DEV && !config.debug) {
            logger.info('Sentry disabled in development');
            return;
        }
        try {
            Sentry.init({
                dsn: config.dsn,
                environment: config.environment,
                release: config.release || import.meta.env.VITE_APP_VERSION,
                // Performance Monitoring
                integrations: [
                    browserTracingIntegration(),
                    captureConsoleIntegration({
                        levels: ['error', 'warn'],
                    }),
                    // Session Replay
                    replayIntegration({
                        // Mask all text and inputs by default for privacy
                        maskAllText: true,
                        maskAllInputs: true,
                        // Capture canvas
                        blockAllMedia: false,
                    }),
                ],
                // Replay sampling
                replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1,
                replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0,
                // Performance sampling
                tracesSampleRate: config.tracesSampleRate || 0.1,
                // Release Health - handled by default in v10
                // Debug mode
                debug: config.debug || false,
                // Breadcrumb configuration
                beforeBreadcrumb: this.beforeBreadcrumb,
                // Data scrubbing
                beforeSend: this.beforeSend,
                // Ignore certain errors
                ignoreErrors: [
                    // Browser extensions
                    'top.GLOBALS',
                    'ResizeObserver loop limit exceeded',
                    'Non-Error promise rejection captured',
                    // Network errors
                    'Network request failed',
                    'NetworkError',
                    'Failed to fetch',
                    // User actions
                    'User cancelled',
                    'User denied',
                ],
                // Denied URLs
                denyUrls: [
                    // Chrome extensions
                    /extensions\//i,
                    /^chrome:\/\//i,
                    /^chrome-extension:\/\//i,
                    // Firefox extensions
                    /^moz-extension:\/\//i,
                    // Safari extensions
                    /^safari-extension:\/\//i,
                ],
            });
            this.initialized = true;
            logger.info('Sentry initialized successfully', {
                environment: config.environment,
                release: config.release,
            });
            // Set initial user context if available
            this.setUserContext();
        }
        catch (error) {
            logger.error('Failed to initialize Sentry', error);
        }
    }
    /**
     * Set user context from auth store
     */
    setUserContext() {
        if (!this.initialized)
            return;
        // Get user from auth store
        const authStore = window.__authStore;
        if (authStore?.user) {
            Sentry.setUser({
                id: authStore.user.id,
                username: authStore.user.name,
                email: authStore.user.email,
                role: authStore.user.role,
            });
        }
    }
    /**
     * Clear user context on logout
     */
    clearUserContext() {
        if (!this.initialized)
            return;
        Sentry.setUser(null);
    }
    /**
     * Capture exception with context
     */
    captureException(error, context) {
        if (!this.initialized) {
            logger.error('Sentry not initialized', error);
            return '';
        }
        return Sentry.captureException(error, {
            contexts: {
                app: {
                    component: context?.component,
                    action: context?.action,
                },
            },
            extra: context,
            tags: {
                source: 'cms-panel',
            },
        });
    }
    /**
     * Capture message
     */
    captureMessage(message, level = 'info') {
        if (!this.initialized)
            return '';
        return Sentry.captureMessage(message, level);
    }
    /**
     * Add breadcrumb
     */
    addBreadcrumb(breadcrumb) {
        if (!this.initialized)
            return;
        Sentry.addBreadcrumb(breadcrumb);
    }
    /**
     * Profile a React component
     */
    profileComponent(Component, name) {
        if (!this.initialized)
            return Component;
        return Sentry.withProfiler(Component, { name });
    }
    /**
     * Create error boundary component
     */
    createErrorBoundary(_fallback, _options) {
        if (!this.initialized) {
            // Return a simple fallback if Sentry is not initialized
            return ({ children }) => React.createElement(React.Fragment, null, children);
        }
        return Sentry.ErrorBoundary;
    }
    /**
     * Start a transaction
     */
    startTransaction(name, op) {
        if (!this.initialized)
            return null;
        return Sentry.startSpan({
            name,
            op,
        }, () => { });
    }
    /**
     * Measure async operation
     */
    async measureAsync(name, operation) {
        if (!this.initialized) {
            return operation();
        }
        const transaction = this.startTransaction(name, 'async');
        try {
            const result = await operation();
            transaction?.setStatus('ok');
            return result;
        }
        catch (error) {
            transaction?.setStatus('internal_error');
            this.captureException(error, { operation: name });
            throw error;
        }
        finally {
            transaction?.finish();
        }
    }
    /**
     * Filter breadcrumbs
     */
    beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
        }
        // Filter out navigation to login (might contain tokens in URL)
        if (breadcrumb.category === 'navigation' && breadcrumb.data?.to?.includes('/login')) {
            breadcrumb.data.to = '/login';
        }
        // Remove sensitive data
        if (breadcrumb.data) {
            const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
            sensitiveKeys.forEach(key => {
                if (breadcrumb.data && breadcrumb.data[key]) {
                    breadcrumb.data[key] = '[REDACTED]';
                }
            });
        }
        return breadcrumb;
    }
    /**
     * Scrub sensitive data before sending
     */
    beforeSend(event, _hint) {
        // Remove sensitive request data
        if (event.request) {
            if (event.request.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
                delete event.request.headers['x-api-key'];
                delete event.request.headers['x-csrf-token'];
            }
            if (event.request.data && typeof event.request.data === 'object') {
                const data = event.request.data;
                const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];
                sensitiveFields.forEach(field => {
                    if (data[field]) {
                        data[field] = '[REDACTED]';
                    }
                });
            }
        }
        // Remove sensitive URLs
        if (event.request?.url && typeof event.request.url === 'string') {
            event.request.url = event.request.url.replace(/token=[^&]+/, 'token=[REDACTED]');
        }
        // Don't send events in test environment
        if (import.meta.env.MODE === 'test') {
            return null;
        }
        return event;
    }
    /**
     * React Router instrumentation helper
     */
    getRouterInstrumentation() {
        if (!this.initialized)
            return undefined;
        // Router instrumentation is handled by browserTracingIntegration
        return undefined;
    }
    /**
     * Wrap components with error boundary
     */
    withErrorBoundary(Component, errorBoundaryOptions) {
        if (!this.initialized)
            return Component;
        return Sentry.withErrorBoundary(Component, errorBoundaryOptions || {});
    }
    /**
     * Wrap components with profiler
     */
    withProfiler(Component, name) {
        if (!this.initialized)
            return Component;
        return Sentry.withProfiler(Component, { name });
    }
}
// Export singleton instance
export const sentryFrontend = SentryFrontendService.getInstance();
// Export initialization function for use in main.tsx
export function initializeSentry(config) {
    const defaultConfig = {
        dsn: import.meta.env.VITE_SENTRY_DSN || '',
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION,
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
        replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,
        debug: import.meta.env.DEV,
    };
    const finalConfig = { ...defaultConfig, ...config };
    if (finalConfig.dsn) {
        sentryFrontend.initialize(finalConfig);
    }
    else {
        logger.warn('Sentry DSN not configured, skipping initialization');
    }
}
// React hooks for Sentry
/**
 * Hook to track page views
 */
export function useSentryPageTracking() {
    const location = useLocation();
    useEffect(() => {
        if (!sentryFrontend)
            return;
        sentryFrontend.addBreadcrumb({
            category: 'navigation',
            message: `Navigated to ${location.pathname}`,
            level: 'info',
            data: {
                from: location.state?.from,
                to: location.pathname,
            },
        });
    }, [location]);
}
/**
 * Hook to set user context
 */
export function useSentryUser(user) {
    useEffect(() => {
        if (!user) {
            sentryFrontend.clearUserContext();
        }
        else {
            Sentry.setUser({
                id: user.id,
                username: user.name || user.username,
                email: user.email,
                role: user.role,
            });
        }
    }, [user]);
}
//# sourceMappingURL=sentryInit.js.map