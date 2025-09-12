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
    initialize(config: DataDogConfig): void;
    requestTracing(): (req: Request, _res: Response, next: NextFunction) => void;
    createSpan(name: string, options?: any): any;
    trace<T>(name: string, fn: () => T): T;
    traceAsync<T>(name: string, fn: () => Promise<T>): Promise<T>;
    incrementMetric(metric: string, tags?: {
        [key: string]: string;
    }, value?: number): void;
    decrementMetric(metric: string, tags?: {
        [key: string]: string;
    }, value?: number): void;
    gauge(metric: string, value: number, tags?: {
        [key: string]: string;
    }): void;
    histogram(metric: string, value: number, tags?: {
        [key: string]: string;
    }): void;
    timing(metric: string, duration: number, tags?: {
        [key: string]: string;
    }): void;
    measureTiming<T>(metric: string, fn: () => Promise<T>, tags?: {
        [key: string]: string;
    }): Promise<T>;
    trackBusinessMetric(category: string, metric: string, value: number, metadata?: any): void;
    trackUserActivity(userId: string, action: string, metadata?: any): void;
    trackAPIPerformance(endpoint: string, method: string, responseTime: number, statusCode: number): void;
    trackDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void;
    trackCacheOperation(operation: 'get' | 'set' | 'delete', hit: boolean, duration: number): void;
    private collectProcessMetrics;
    private formatTags;
    flush(): void;
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