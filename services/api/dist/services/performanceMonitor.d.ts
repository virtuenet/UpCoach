import { EventEmitter } from 'events';
interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    tags?: Record<string, any>;
}
interface RequestMetrics {
    url: string;
    method: string;
    statusCode: number;
    duration: number;
    timestamp: Date;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
}
interface AlertRule {
    name: string;
    metric: string;
    threshold: number;
    operator: '>' | '<' | '>=' | '<=' | '==';
    action: (metric: PerformanceMetric) => void;
}
declare class PerformanceMonitor extends EventEmitter {
    private metrics;
    private requestMetrics;
    private alertRules;
    private samplingRate;
    private maxMetricsAge;
    private cleanupInterval;
    private metricsBuffer;
    private bufferFlushInterval;
    constructor();
    measure<T>(name: string, fn: () => Promise<T>, tags?: Record<string, any>): Promise<T>;
    measureMethod(name?: string, tags?: Record<string, any>): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
    recordMetric(metric: PerformanceMetric): void;
    recordRequest(metrics: RequestMetrics): void;
    getAggregatedMetrics(name: string, period?: number): any;
    getSystemMetrics(): any;
    getRequestStats(period?: number): any;
    addAlertRule(rule: AlertRule): void;
    setSamplingRate(rate: number): void;
    middleware(): (req: any, res: any, next: any) => void;
    generateReport(): any;
    getPrometheusMetrics(): string;
    private percentile;
    private checkAlerts;
    private setupCleanup;
    private setupMetricsFlush;
    private setupDefaultAlerts;
    destroy(): void;
}
export declare const performanceMonitor: PerformanceMonitor;
export declare const measure: (name?: string, tags?: Record<string, any>) => (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const performanceMiddleware: () => (req: any, res: any, next: any) => void;
export {};
//# sourceMappingURL=performanceMonitor.d.ts.map