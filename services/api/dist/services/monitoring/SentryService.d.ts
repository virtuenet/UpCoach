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
    initialize(config: SentryConfig): void;
    setupExpressMiddleware(app: Express): void;
    setupErrorHandler(app: Express): void;
    captureException(error: Error, context?: any): string;
    captureMessage(message: string, level?: Sentry.SeverityLevel, context?: any): string;
    addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void;
    setUser(user: Sentry.User | null): void;
    setContext(key: string, context: any): void;
    setTags(tags: {
        [key: string]: string;
    }): void;
    startTransaction(name: string, op: string): Sentry.Span | null;
    routeTransaction(): (req: Request, _res: Response, next: NextFunction) => void;
    flush(timeout?: number): Promise<boolean>;
    close(timeout?: number): Promise<boolean>;
    private beforeSend;
    private beforeBreadcrumb;
    private getDefaultTags;
    measurePerformance<T>(operation: string, fn: () => Promise<T>): Promise<T>;
    wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context?: string): T;
}
export declare const sentryService: SentryService;
//# sourceMappingURL=SentryService.d.ts.map