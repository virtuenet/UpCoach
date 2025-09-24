/**
 * Core Web Vitals and Performance Monitoring Utilities
 * Implements comprehensive performance tracking across all UpCoach applications
 */

// Type definitions for web-vitals when package is not available
interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  delta?: number;
  entries?: PerformanceEntry[];
  navigationType?: string;
}

type WebVitalsCallback = (metric: WebVitalsMetric) => void;

export interface Metric {
  id: string;
  name: string;
  value: number;
  delta?: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  entries?: PerformanceEntry[];
  navigationType?: string;
}

export interface PerformanceReport {
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

// Core Web Vitals thresholds (Google standards)
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FID: { good: 100, poor: 300 },   // First Input Delay
  TTFB: { good: 800, poor: 1800 }  // Time to First Byte
};

/**
 * Get performance rating based on metric value and thresholds
 */
function getPerformanceRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Measure and report Core Web Vitals
 */
export function measureWebVitals(callback: (metric: Metric) => void): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  try {
    // Dynamic import for web-vitals to avoid SSR issues
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getFCP((metric: WebVitalsMetric) => {
        callback({
          id: metric.id,
          name: 'FCP',
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating('FCP', metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });

      getLCP((metric: WebVitalsMetric) => {
        callback({
          id: metric.id,
          name: 'LCP',
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating('LCP', metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });

      getCLS((metric: WebVitalsMetric) => {
        callback({
          id: metric.id,
          name: 'CLS',
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating('CLS', metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });

      getFID((metric: WebVitalsMetric) => {
        callback({
          id: metric.id,
          name: 'FID',
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating('FID', metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });

      getTTFB((metric: WebVitalsMetric) => {
        callback({
          id: metric.id,
          name: 'TTFB',
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating('TTFB', metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });
    }).catch((error) => {
      console.warn('Failed to load web-vitals library:', error);
    });
  } catch (error) {
    console.warn('Error measuring web vitals:', error);
  }
}

/**
 * Collect comprehensive performance report
 */
export function generatePerformanceReport(metrics: Metric[]): PerformanceReport {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return {
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    metrics,
    pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
    resourceTimings: resources.slice(0, 20).map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: getResourceType(resource.name)
    }))
  };
}

/**
 * Get resource type from URL
 */
function getResourceType(url: string): string {
  if (url.includes('.css')) return 'stylesheet';
  if (url.includes('.js')) return 'script';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
  if (url.includes('.woff') || url.includes('.woff2')) return 'font';
  return 'other';
}

/**
 * Send performance data to analytics endpoint
 */
export async function reportPerformanceData(report: PerformanceReport): Promise<void> {
  try {
    // Use beacon API for reliable delivery
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon('/api/analytics/performance', JSON.stringify(report));
    } else {
      // Fallback to fetch
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true
      });
    }
  } catch (error) {
    console.warn('Failed to report performance data:', error);
  }
}

/**
 * Performance budget checker
 */
export interface PerformanceBudget {
  FCP: number;
  LCP: number;
  CLS: number;
  FID: number;
  TTFB: number;
}

const DEFAULT_BUDGET: PerformanceBudget = {
  FCP: 1800,
  LCP: 2500,
  CLS: 0.1,
  FID: 100,
  TTFB: 800
};

export function checkPerformanceBudget(
  metrics: Metric[], 
  budget: PerformanceBudget = DEFAULT_BUDGET
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  
  metrics.forEach(metric => {
    const budgetValue = budget[metric.name as keyof PerformanceBudget];
    if (budgetValue && metric.value > budgetValue) {
      violations.push(`${metric.name}: ${metric.value}ms exceeds budget of ${budgetValue}ms`);
    }
  });
  
  return {
    passed: violations.length === 0,
    violations
  };
}

/**
 * Initialize performance monitoring for an application
 */
export function initializePerformanceMonitoring(options: {
  enableReporting?: boolean;
  budget?: PerformanceBudget;
  onMetric?: (metric: Metric) => void;
} = {}): void {
  const { enableReporting = true, budget, onMetric } = options;
  const collectedMetrics: Metric[] = [];
  
  measureWebVitals((metric) => {
    collectedMetrics.push(metric);
    
    // Call custom metric handler
    onMetric?.(metric);
    
    // Check budget if provided
    if (budget) {
      const budgetCheck = checkPerformanceBudget([metric], budget);
      if (!budgetCheck.passed) {
        console.warn('Performance budget violation:', budgetCheck.violations);
      }
    }
    
    // Log metric for debugging
    console.debug(`${metric.name}: ${metric.value}ms (${metric.rating})`);
  });
  
  // Send report when page unloads
  if (enableReporting) {
    window.addEventListener('beforeunload', () => {
      if (collectedMetrics.length > 0) {
        const report = generatePerformanceReport(collectedMetrics);
        reportPerformanceData(report);
      }
    });
  }
}

/**
 * Create performance monitoring hook for React applications
 */
export function createPerformanceHook() {
  return function usePerformanceMonitoring(enabled = true) {
    // Use lazy React import to avoid dependency issues
    if (typeof window !== 'undefined' && (window as any).React?.useEffect) {
      const React = (window as any).React;
      React.useEffect(() => {
        if (!enabled) return;
        
        initializePerformanceMonitoring({
          enableReporting: true,
          onMetric: (metric) => {
            // Could integrate with React DevTools or state management
            if (process.env.NODE_ENV === 'development') {
              console.debug('Performance metric:', metric);
            }
          }
        });
      }, [enabled]);
    } else {
      console.warn('React not available for performance hook');
    }
  };
}