/**
 * DataDog APM and Metrics Service
 * Application Performance Monitoring and custom metrics collection
 */
import { Request, Response, NextFunction } from 'express';
export interface DataDogConfig {
    enabled: boolean;
    agentHost?: string;
    agentPort?: number;
    env?: string;
    service?: string;
    version?: string;
    analyticsEnabled?: boolean;
    logInjection?: boolean;
    profiling?: boolean;
    runtimeMetrics?: boolean;
    statsdHost?: string;
    statsdPort?: number;
}
export declare class DataDogService {
    private static instance;
    private statsD;
    private initialized;
    private config;
    private constructor();
    static getInstance(): DataDogService;
    /**
     * Initialize DataDog APM and StatsD client
     */
    initialize(config: DataDogConfig): void;
    /**
     * Express middleware for request tracing
     */
    requestTracing(): (req: Request, _res: Response, next: NextFunction) => void;
    /**
     * Create a custom span
     */
    createSpan(name: string, options?: any): any;
    /**
     * Wrap function with tracing
     */
    trace<T>(name: string, fn: () => T): T;
    /**
     * Wrap async function with tracing
     */
    traceAsync<T>(name: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Increment a counter metric
     */
    incrementMetric(metric: string, tags?: {
        [key: string]: string;
    }, value?: number): void;
    /**
     * Decrement a counter metric
     */
    decrementMetric(metric: string, tags?: {
        [key: string]: string;
    }, value?: number): void;
    /**
     * Record a gauge metric
     */
    gauge(metric: string, value: number, tags?: {
        [key: string]: string;
    }): void;
    /**
     * Record a histogram metric
     */
    histogram(metric: string, value: number, tags?: {
        [key: string]: string;
    }): void;
    /**
     * Record a timing metric
     */
    timing(metric: string, duration: number, tags?: {
        [key: string]: string;
    }): void;
    /**
     * Measure execution time of a function
     */
    measureTiming<T>(metric: string, fn: () => Promise<T>, tags?: {
        [key: string]: string;
    }): Promise<T>;
    /**
     * Track custom business metrics
     */
    trackBusinessMetric(category: string, metric: string, value: number, metadata?: any): void;
    /**
     * Track user activity metrics
     */
    trackUserActivity(userId: string, action: string, metadata?: any): void;
    /**
     * Track API performance metrics
     */
    trackAPIPerformance(endpoint: string, method: string, responseTime: number, statusCode: number): void;
    /**
     * Track database performance
     */
    trackDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void;
    /**
     * Track cache performance
     */
    trackCacheOperation(operation: 'get' | 'set' | 'delete', hit: boolean, duration: number): void;
    /**
     * Collect process-level metrics
     */
    private collectProcessMetrics;
    /**
     * Format tags for StatsD
     */
    private formatTags;
    /**
     * Flush pending metrics
     */
    flush(): void;
    /**
     * Shutdown DataDog monitoring
     */
    shutdown(): Promise<void>;
}
export declare const dataDogService: DataDogService;
export declare const metrics: {
    increment: (metric: string, tags?: any) => void;
    decrement: (metric: string, tags?: any) => void;
    gauge: (metric: string, value: number, tags?: any) => void;
    histogram: (metric: string, value: number, tags?: any) => void;
    timing: (metric: string, duration: number, tags?: any) => void;
};
export declare function TraceMethod(name?: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=DataDogService.d.ts.map