import * as Sentry from '@sentry/node';
import { Express } from 'express';
export declare class SentryService {
    private static instance;
    private config;
    private constructor();
    static getInstance(): SentryService;
    initialize(app?: Express): void;
    requestHandler(): any;
    tracingHandler(): any;
    errorHandler(): any;
    captureException(error: Error, context?: any): void;
    captureMessage(message: string, level?: Sentry.SeverityLevel): void;
    addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void;
    setUser(user: Sentry.User | null): void;
    setTag(key: string, value: string): void;
    setContext(name: string, context: any): void;
    startTransaction(name: string, op: string): any;
    measureDatabaseQuery(queryName: string, callback: () => Promise<any>): Promise<any>;
    measureApiCall(endpoint: string, callback: () => Promise<any>): Promise<any>;
    close(timeout?: number): Promise<boolean>;
}
export declare const sentryService: SentryService;
//# sourceMappingURL=sentry.d.ts.map