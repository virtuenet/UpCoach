/**
 * Sentry Frontend Monitoring Initialization
 * Error tracking and performance monitoring for CMS Panel
 */
import * as React from 'react';
import * as Sentry from '@sentry/react';
export interface SentryFrontendConfig {
    dsn: string;
    environment: string;
    release?: string;
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    debug?: boolean;
}
declare class SentryFrontendService {
    private static instance;
    private initialized;
    private constructor();
    static getInstance(): SentryFrontendService;
    /**
     * Initialize Sentry for React application
     */
    initialize(config: SentryFrontendConfig): void;
    /**
     * Set user context from auth store
     */
    setUserContext(): void;
    /**
     * Clear user context on logout
     */
    clearUserContext(): void;
    /**
     * Capture exception with context
     */
    captureException(error: Error, context?: any): string;
    /**
     * Capture message
     */
    captureMessage(message: string, level?: Sentry.SeverityLevel): string;
    /**
     * Add breadcrumb
     */
    addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void;
    /**
     * Profile a React component
     */
    profileComponent<P extends object>(Component: React.ComponentType<P>, name?: string): React.ComponentType<P>;
    /**
     * Create error boundary component
     */
    createErrorBoundary(_fallback?: React.ComponentType<any>, _options?: Sentry.ErrorBoundaryProps): React.ComponentType<any>;
    /**
     * Start a transaction
     */
    startTransaction(name: string, op: string): any;
    /**
     * Measure async operation
     */
    measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T>;
    /**
     * Filter breadcrumbs
     */
    private beforeBreadcrumb;
    /**
     * Scrub sensitive data before sending
     */
    private beforeSend;
    /**
     * React Router instrumentation helper
     */
    getRouterInstrumentation(): undefined;
    /**
     * Wrap components with error boundary
     */
    withErrorBoundary<P extends object>(Component: React.ComponentType<P>, errorBoundaryOptions?: Sentry.ErrorBoundaryProps): React.ComponentType<P>;
    /**
     * Wrap components with profiler
     */
    withProfiler<P extends object>(Component: React.ComponentType<P>, name?: string): React.ComponentType<P>;
}
export declare const sentryFrontend: SentryFrontendService;
export declare function initializeSentry(config?: Partial<SentryFrontendConfig>): void;
/**
 * Hook to track page views
 */
export declare function useSentryPageTracking(): void;
/**
 * Hook to set user context
 */
export declare function useSentryUser(user: any): void;
export {};
//# sourceMappingURL=sentryInit.d.ts.map