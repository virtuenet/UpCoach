export declare class DataDogService {
    private static instance;
    private config;
    private statsD;
    private logger;
    private metricsBuffer;
    private flushInterval;
    private constructor();
    static getInstance(): DataDogService;
    initialize(): void;
    increment(metric: string, value?: number, tags?: string[]): void;
    decrement(metric: string, value?: number, tags?: string[]): void;
    gauge(metric: string, value: number, tags?: string[]): void;
    histogram(metric: string, value: number, tags?: string[]): void;
    timing(metric: string, duration: number, tags?: string[]): void;
    distribution(metric: string, value: number, tags?: string[]): void;
    trackTiming<T>(metric: string, operation: () => Promise<T>, tags?: string[]): Promise<T>;
    trackUserAction(action: string, userId: string, metadata?: any): void;
    trackRevenue(amount: number, currency: string, type: string): void;
    trackApiCall(endpoint: string, method: string, statusCode: number, duration: number): void;
    trackDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void;
    trackCacheOperation(operation: string, hit: boolean, duration: number): void;
    trackQueueMetrics(queueName: string, size: number, processingTime?: number): void;
    trackMemoryUsage(): void;
    trackCPUUsage(): void;
    trackEventLoopLag(lag: number): void;
    logEvent(title: string, text: string, alertType?: 'error' | 'warning' | 'info' | 'success', tags?: string[]): void;
    addToBuffer(metric: string, value: number): void;
    private flushBufferedMetrics;
    private startMetricsFlush;
    private startSystemMetrics;
    createSpan(name: string, options?: any): any;
    wrapAsync<T>(name: string, fn: () => Promise<T>, options?: any): Promise<T>;
    close(): Promise<void>;
}
export declare const datadogService: DataDogService;
//# sourceMappingURL=datadog.d.ts.map