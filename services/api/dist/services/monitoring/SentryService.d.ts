/**
 * Sentry Monitoring Service
 * Provides error tracking, performance monitoring, and release tracking
 */
import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';
export interface SentryConfig {
    dsn: string;
    environment: string;
    release?: string;
    tracesSampleRate?: number;
    profilesSampleRate?: number;
    debug?: boolean;
    integrations?: any[];
    beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}
export declare class SentryService {
    private static instance;
    private initialized;
    private constructor();
    static getInstance(): SentryService;
    /**
     * Initialize Sentry with configuration
     */
    initialize(config: SentryConfig): void;
    /**
     * Set up Express middleware
     */
    setupExpressMiddleware(app: Express): void;
    /**
     * Set up error handler (should be after all other middleware)
     */
    setupErrorHandler(app: Express): void;
    /**
     * Capture exception manually
     */
    captureException(error: Error, context?: any): string;
    /**
     * Capture message
     */
    captureMessage(message: string, level?: Sentry.SeverityLevel, context?: any): string;
    /**
     * Add breadcrumb for debugging
     */
    addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void;
    /**
     * Set user context
     */
    setUser(user: Sentry.User | null): void;
    /**
     * Set additional context
     */
    setContext(key: string, context: any): void;
    /**
     * Set tags for categorization
     */
    setTags(tags: {
        [key: string]: string;
    }): void;
    /**
     * Start a transaction for performance monitoring
     */
    startTransaction(name: string, op: string): Sentry.Span | null;
    /**
     * Create a custom middleware for route transactions
     */
    routeTransaction(): (req: Request, _res: Response, next: NextFunction) => void;
    /**
     * Flush events before shutdown
     */
    flush(timeout?: number): Promise<boolean>;
    /**
     * Close Sentry client
     */
    close(timeout?: number): Promise<boolean>;
    /**
     * Data scrubbing before sending to Sentry
     */
    private beforeSend;
    /**
     * Filter breadcrumbs
     */
    private beforeBreadcrumb;
    /**
     * Get default tags for all events
     */
    private getDefaultTags;
    /**
     * Performance monitoring helper
     */
    measurePerformance<T>(operation: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Wrap async functions with error tracking
     */
    wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context?: string): T;
}
export declare const sentryService: SentryService;
//# sourceMappingURL=SentryService.d.ts.map