/**
 * Core Web Vitals and Performance Monitoring Utilities
 * Implements comprehensive performance tracking across all UpCoach applications
 */
interface Metric {
    id: string;
    name: string;
    value: number;
    delta?: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    entries?: PerformanceEntry[];
    navigationType?: string;
}
interface PerformanceReport {
    timestamp: number;
    url: string;
    userAgent: string;
    connectionType: string;
    metrics: Metric[];
    pageLoadTime: number;
    resourceTimings: ResourceTiming[];
}
interface ResourceTiming {
    name: string;
    duration: number;
    size: number;
    type: string;
}
/**
 * Measure and report Core Web Vitals
 */
declare function measureWebVitals(callback: (metric: Metric) => void): void;
/**
 * Collect comprehensive performance report
 */
declare function generatePerformanceReport(metrics: Metric[]): PerformanceReport;
/**
 * Send performance data to analytics endpoint
 */
declare function reportPerformanceData(report: PerformanceReport): Promise<void>;
/**
 * Performance budget checker
 */
interface PerformanceBudget {
    FCP: number;
    LCP: number;
    CLS: number;
    FID: number;
    TTFB: number;
}
declare function checkPerformanceBudget(metrics: Metric[], budget?: PerformanceBudget): {
    passed: boolean;
    violations: string[];
};
/**
 * Initialize performance monitoring for an application
 */
declare function initializePerformanceMonitoring(options?: {
    enableReporting?: boolean;
    budget?: PerformanceBudget;
    onMetric?: (metric: Metric) => void;
}): void;
/**
 * Create performance monitoring hook for React applications
 */
declare function createPerformanceHook(): (enabled?: boolean) => void;

/**
 * Shared utilities index
 */

declare const SharedUtils: {};

export { type Metric, type PerformanceBudget, type PerformanceReport, SharedUtils, checkPerformanceBudget, createPerformanceHook, generatePerformanceReport, initializePerformanceMonitoring, measureWebVitals, reportPerformanceData };
