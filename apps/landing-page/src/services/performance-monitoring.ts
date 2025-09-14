// Performance Monitoring and Optimization Service
import { event } from './analytics';

// Performance metrics thresholds
const THRESHOLDS = {
  FCP: 1800, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100, // First Input Delay (ms)
  CLS: 0.1, // Cumulative Layout Shift
  TTI: 3800, // Time to Interactive (ms)
  TBT: 200, // Total Blocking Time (ms)
};

// Performance data structure
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

class PerformanceMonitor {
  private metrics: PerformanceData = {};
  private observer: PerformanceObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Observe Core Web Vitals
    this.observeWebVitals();

    // Monitor navigation timing
    this.measureNavigationTiming();

    // Monitor resource timing
    this.measureResourceTiming();

    // Monitor memory usage
    this.measureMemoryUsage();

    // Set up visibility change listener
    this.setupVisibilityListener();
  }

  private observeWebVitals() {
    try {
      // Observe FCP
      new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = Math.round(entry.startTime);
            this.reportMetric('FCP', this.metrics.FCP);
          }
        });
      }).observe({ entryTypes: ['paint'] });

      // Observe LCP
      new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = Math.round(lastEntry.startTime);
        this.reportMetric('LCP', this.metrics.LCP);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe FID
      new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-input') {
            const fidEntry = entry as any;
            this.metrics.FID = Math.round(fidEntry.processingStart - fidEntry.startTime);
            this.reportMetric('FID', this.metrics.FID);
          }
        });
      }).observe({ entryTypes: ['first-input'] });

      // Observe CLS
      let clsValue = 0;
      let clsEntries: any[] = [];

      new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsEntries.push(entry);
            clsValue += (entry as any).value;
          }
        }
        this.metrics.CLS = clsValue;
        this.reportMetric('CLS', this.metrics.CLS);
      }).observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.error('Failed to observe performance metrics:', e);
    }
  }

  private measureNavigationTiming() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;

      this.metrics.navigationTiming = {
        domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
        loadComplete: timing.loadEventEnd - navigationStart,
        domInteractive: timing.domInteractive - navigationStart,
        requestStart: timing.requestStart - navigationStart,
        responseEnd: timing.responseEnd - navigationStart,
      };
    }
  }

  private measureResourceTiming() {
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');

      const resourcesByType = {
        scripts: 0,
        stylesheets: 0,
        images: 0,
        fonts: 0,
        total: 0,
      };

      resources.forEach((resource: any) => {
        const duration = resource.responseEnd - resource.startTime;
        resourcesByType.total += duration;

        if (resource.initiatorType === 'script') {
          resourcesByType.scripts += duration;
        } else if (resource.initiatorType === 'css' || resource.initiatorType === 'link') {
          resourcesByType.stylesheets += duration;
        } else if (resource.initiatorType === 'img') {
          resourcesByType.images += duration;
        } else if (resource.initiatorType === 'font') {
          resourcesByType.fonts += duration;
        }
      });

      this.metrics.resourceTiming = resourcesByType;
    }
  }

  private measureMemoryUsage() {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      this.metrics.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }
  }

  private setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.reportAllMetrics();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.reportAllMetrics();
    });
  }

  private reportMetric(name: string, value: number) {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    const status = threshold && value > threshold ? 'poor' : 'good';

    event('performance_metric', {
      metric_name: name,
      value,
      threshold,
      status,
      url: window.location.href,
      user_agent: navigator.userAgent,
    });
  }

  private reportAllMetrics() {
    const report = {
      ...this.metrics,
      url: window.location.href,
      timestamp: Date.now(),
      connection: this.getConnectionInfo(),
    };

    // Send to analytics
    event('performance_report', report);

    // Send to backend
    this.sendToBackend(report);
  }

  private getConnectionInfo() {
    const nav = navigator as any;
    if (nav.connection) {
      return {
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt,
        saveData: nav.connection.saveData,
      };
    }
    return null;
  }

  private async sendToBackend(data: any) {
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to send performance data:', error);
    }
  }

  public getMetrics(): PerformanceData {
    return this.metrics;
  }

  public getScore(): number {
    let score = 100;
    const weights = {
      FCP: 0.15,
      LCP: 0.25,
      FID: 0.15,
      CLS: 0.15,
      TTI: 0.15,
      TBT: 0.15,
    };

    Object.entries(weights).forEach(([metric, weight]) => {
      const value = this.metrics[metric as keyof PerformanceData] as number;
      const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];

      if (value && threshold) {
        const ratio = Math.min(value / threshold, 2);
        score -= (ratio - 1) * weight * 100;
      }
    });

    return Math.max(0, Math.min(100, score));
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  // Lazy load images
  static lazyLoadImages() {
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src!;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }

  // Preload critical resources
  static preloadCriticalResources(resources: string[]) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';

      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.match(/\.(woff2?|ttf|otf)$/)) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      }

      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Prefetch next page resources
  static prefetchNextPage(url: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  // Optimize third-party scripts
  static optimizeThirdPartyScripts() {
    // Delay non-critical third-party scripts
    window.addEventListener('load', () => {
      setTimeout(() => {
        // Load Google Analytics
        const ga = document.createElement('script');
        ga.async = true;
        ga.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
        document.head.appendChild(ga);

        // Load other third-party scripts
      }, 2000);
    });
  }

  // Implement resource hints
  static addResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossOrigin) {
        link.crossOrigin = hint.crossOrigin;
      }
      document.head.appendChild(link);
    });
  }

  // Reduce JavaScript execution time
  static deferNonCriticalJS() {
    const scripts = document.querySelectorAll('script[data-defer]');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.src = (script as HTMLScriptElement).src;
      newScript.defer = true;
      script.parentNode?.replaceChild(newScript, script);
    });
  }

  // Optimize CSS delivery
  static optimizeCSSDelivery() {
    // Load critical CSS inline
    // Load non-critical CSS asynchronously
    const links = document.querySelectorAll('link[rel="stylesheet"][data-async]');
    links.forEach(link => {
      const newLink = link.cloneNode() as HTMLLinkElement;
      newLink.media = 'print';
      newLink.onload = function () {
        (this as HTMLLinkElement).media = 'all';
      };
      link.parentNode?.replaceChild(newLink, link);
    });
  }
}

// Service Worker for caching
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        registration => {
          console.log('ServiceWorker registration successful');
        },
        error => {
          console.log('ServiceWorker registration failed:', error);
        }
      );
    });
  }
}

// Global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();

    // Apply optimizations
    PerformanceOptimizer.lazyLoadImages();
    PerformanceOptimizer.addResourceHints();
    PerformanceOptimizer.optimizeThirdPartyScripts();
    PerformanceOptimizer.deferNonCriticalJS();
    PerformanceOptimizer.optimizeCSSDelivery();

    // Register service worker
    registerServiceWorker();
  }
}

// Get current performance metrics
export function getPerformanceMetrics(): PerformanceData | null {
  return performanceMonitor?.getMetrics() || null;
}

// Get performance score
export function getPerformanceScore(): number {
  return performanceMonitor?.getScore() || 0;
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
  initializePerformanceMonitoring();
}
