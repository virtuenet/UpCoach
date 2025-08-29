/**
 * Performance Monitoring Service
 * Tracks and reports application performance metrics
 */


interface PerformanceMetrics {
  fcp: number | null;      // First Contentful Paint
  lcp: number | null;      // Largest Contentful Paint
  fid: number | null;      // First Input Delay
  cls: number | null;      // Cumulative Layout Shift
  ttfb: number | null;     // Time to First Byte
  tti: number | null;      // Time to Interactive
  tbt: number | null;      // Total Blocking Time
  inp: number | null;      // Interaction to Next Paint
}

interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  startTime: number;
}

interface NavigationMetrics {
  domContentLoaded: number;
  loadComplete: number;
  domInteractive: number;
  redirectTime: number;
  dnsTime: number;
  tcpTime: number;
  requestTime: number;
  responseTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    tti: null,
    tbt: null,
    inp: null,
  };

  private resourceTimings: ResourceTiming[] = [];
  private customMarks: Map<string, number> = new Map();
  private customMeasures: Map<string, number> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private reportQueue: any[] = [];
  private reportTimer: NodeJS.Timeout | null = null;
  private readonly REPORT_INTERVAL = 30000; // Report every 30 seconds
  private readonly MAX_QUEUE_SIZE = 100;

  constructor() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.initializeObservers();
      this.startReporting();
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Observe paint metrics (FCP, LCP)
    this.observePaintMetrics();
    
    // Observe layout shifts (CLS)
    this.observeLayoutShifts();
    
    // Observe first input delay (FID)
    this.observeFirstInputDelay();
    
    // Observe navigation timing
    this.observeNavigationTiming();
    
    // Observe resource timing
    this.observeResourceTiming();

    // Observe long tasks
    this.observeLongTasks();

    // Observe INP (Interaction to Next Paint)
    this.observeINP();
  }

  /**
   * Observe paint metrics
   */
  private observePaintMetrics(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = Math.round(entry.startTime);
          }
          if (entry.entryType === 'largest-contentful-paint') {
            this.metrics.lcp = Math.round(entry.startTime);
          }
        }
      });

      observer.observe({ 
        type: 'paint', 
        buffered: true 
      });
      
      observer.observe({ 
        type: 'largest-contentful-paint', 
        buffered: true 
      });

      this.observers.set('paint', observer);
    } catch (error) {
      console.warn('Paint metrics observation not supported:', error);
    }
  }

  /**
   * Observe layout shifts
   */
  private observeLayoutShifts(): void {
    try {
      let clsValue = 0;
      let clsEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only count layout shifts without recent input
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            clsEntries.push(entry);
          }
        }
        this.metrics.cls = Math.round(clsValue * 1000) / 1000;
      });

      observer.observe({ 
        type: 'layout-shift', 
        buffered: true 
      });

      this.observers.set('cls', observer);
    } catch (error) {
      console.warn('CLS observation not supported:', error);
    }
  }

  /**
   * Observe first input delay
   */
  private observeFirstInputDelay(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0];
        if (firstInput) {
          this.metrics.fid = Math.round(
            (firstInput as any).processingStart - firstInput.startTime
          );
        }
      });

      observer.observe({ 
        type: 'first-input', 
        buffered: true 
      });

      this.observers.set('fid', observer);
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }
  }

  /**
   * Observe Interaction to Next Paint
   */
  private observeINP(): void {
    try {
      let maxDuration = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'event' && (entry as any).duration > maxDuration) {
            maxDuration = (entry as any).duration;
            this.metrics.inp = Math.round(maxDuration);
          }
        }
      });

      observer.observe({ 
        type: 'event', 
        buffered: true,
        // durationThreshold: 40 // Only observe events > 40ms
      });

      this.observers.set('inp', observer);
    } catch (error) {
      console.warn('INP observation not supported:', error);
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming(): void {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      
      // Calculate TTFB
      this.metrics.ttfb = Math.round(
        timing.responseStart - timing.fetchStart
      );

      // Calculate other navigation metrics
      window.addEventListener('load', () => {
        const navMetrics: NavigationMetrics = {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
          loadComplete: timing.loadEventEnd - timing.fetchStart,
          domInteractive: timing.domInteractive - timing.fetchStart,
          redirectTime: timing.redirectEnd - timing.redirectStart,
          dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
          tcpTime: timing.connectEnd - timing.connectStart,
          requestTime: timing.responseStart - timing.requestStart,
          responseTime: timing.responseEnd - timing.responseStart,
        };

        this.reportNavigationMetrics(navMetrics);
      });
    }
  }

  /**
   * Observe resource timing
   */
  private observeResourceTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          this.resourceTimings.push({
            name: resourceEntry.name,
            type: resourceEntry.initiatorType,
            duration: Math.round(resourceEntry.duration),
            size: Math.round(resourceEntry.transferSize || 0),
            startTime: Math.round(resourceEntry.startTime),
          });

          // Keep only recent resource timings
          if (this.resourceTimings.length > 100) {
            this.resourceTimings = this.resourceTimings.slice(-50);
          }
        }
      });

      observer.observe({ 
        type: 'resource', 
        buffered: true 
      });

      this.observers.set('resource', observer);
    } catch (error) {
      console.warn('Resource timing observation not supported:', error);
    }
  }

  /**
   * Observe long tasks
   */
  private observeLongTasks(): void {
    try {
      let totalBlockingTime = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration;
          if (duration > 50) {
            totalBlockingTime += duration - 50;
          }
        }
        this.metrics.tbt = Math.round(totalBlockingTime);
      });

      observer.observe({ 
        type: 'longtask', 
        buffered: true 
      });

      this.observers.set('longtask', observer);
    } catch (error) {
      console.warn('Long task observation not supported:', error);
    }
  }

  /**
   * Mark a custom timing point
   */
  mark(name: string): void {
    try {
      performance.mark(name);
      this.customMarks.set(name, performance.now());
    } catch (error) {
      console.warn(`Failed to mark ${name}:`, error);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const duration = measures[measures.length - 1].duration;
        this.customMeasures.set(name, duration);
        return duration;
      }
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error);
    }
    return null;
  }

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.queueReport({
      type: 'component-render',
      name: componentName,
      duration: Math.round(renderTime),
      timestamp: Date.now(),
    });
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint: string, duration: number, status: number): void {
    this.queueReport({
      type: 'api-call',
      endpoint,
      duration: Math.round(duration),
      status,
      timestamp: Date.now(),
    });
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, data?: any): void {
    this.queueReport({
      type: 'custom-event',
      name: eventName,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get resource timings
   */
  getResourceTimings(): ResourceTiming[] {
    return [...this.resourceTimings];
  }

  /**
   * Queue report for batching
   */
  private queueReport(data: any): void {
    this.reportQueue.push(data);

    // Limit queue size
    if (this.reportQueue.length > this.MAX_QUEUE_SIZE) {
      this.reportQueue = this.reportQueue.slice(-this.MAX_QUEUE_SIZE);
    }

    // Send immediately if queue is getting large
    if (this.reportQueue.length >= 50) {
      this.sendReports();
    }
  }

  /**
   * Report navigation metrics
   */
  private reportNavigationMetrics(metrics: NavigationMetrics): void {
    this.queueReport({
      type: 'navigation',
      metrics,
      timestamp: Date.now(),
    });
  }

  /**
   * Start periodic reporting
   */
  private startReporting(): void {
    this.reportTimer = setInterval(() => {
      this.sendReports();
    }, this.REPORT_INTERVAL);

    // Send report before page unload
    window.addEventListener('beforeunload', () => {
      this.sendReports(true);
    });
  }

  /**
   * Send accumulated reports to server
   */
  private async sendReports(immediate = false): Promise<void> {
    if (this.reportQueue.length === 0 && !immediate) {
      return;
    }

    const reports = [...this.reportQueue];
    this.reportQueue = [];

    // Add current metrics to report
    const payload = {
      metrics: this.getMetrics(),
      reports,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
    };

    try {
      // Use sendBeacon for reliability on page unload
      if (immediate && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/performance/report',
          JSON.stringify(payload)
        );
      } else {
        // Regular fetch for periodic reports
        await fetch('/api/performance/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    // Send final reports
    this.sendReports(true);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  return {
    mark: (name: string) => performanceMonitor.mark(name),
    measure: (name: string, start: string, end?: string) => 
      performanceMonitor.measure(name, start, end),
    trackRender: (component: string, time: number) => 
      performanceMonitor.trackComponentRender(component, time),
    trackApi: (endpoint: string, duration: number, status: number) =>
      performanceMonitor.trackApiCall(endpoint, duration, status),
    trackEvent: (name: string, data?: any) =>
      performanceMonitor.trackEvent(name, data),
    getMetrics: () => performanceMonitor.getMetrics(),
  };
}

/**
 * Component render time tracker HOC
 * Note: This should be used in a .tsx file, not .ts
 * Keeping here for reference but actual implementation should be in a React component file
 */
export function withPerformanceTracking<P extends object>(
  Component: ComponentType<P>,
  _componentName: string
): ComponentType<P> {
  return Component; // Placeholder - actual HOC implementation should be in .tsx file
}