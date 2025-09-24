interface PerformanceData {
    FCP?: number;
    LCP?: number;
    FID?: number;
    CLS?: number;
    TTI?: number;
    TBT?: number;
    navigationTiming?: {
        domContentLoaded: number;
        loadComplete: number;
        domInteractive: number;
        requestStart: number;
        responseEnd: number;
    };
    resourceTiming?: {
        scripts: number;
        stylesheets: number;
        images: number;
        fonts: number;
        total: number;
    };
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        limit: number;
    };
}
export declare class PerformanceOptimizer {
    static lazyLoadImages(): void;
    static preloadCriticalResources(resources: string[]): void;
    static prefetchNextPage(url: string): void;
    static optimizeThirdPartyScripts(): void;
    static addResourceHints(): void;
    static deferNonCriticalJS(): void;
    static optimizeCSSDelivery(): void;
}
export declare function registerServiceWorker(): void;
export declare function initializePerformanceMonitoring(): void;
export declare function getPerformanceMetrics(): PerformanceData | null;
export declare function getPerformanceScore(): number;
export {};
//# sourceMappingURL=performance-monitoring.d.ts.map