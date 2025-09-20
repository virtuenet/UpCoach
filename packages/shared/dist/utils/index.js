'use strict';

// src/utils/performance.ts
var THRESHOLDS = {
  FCP: { good: 1800, poor: 3e3 },
  // First Contentful Paint
  LCP: { good: 2500, poor: 4e3 },
  // Largest Contentful Paint
  CLS: { good: 0.1, poor: 0.25 },
  // Cumulative Layout Shift
  FID: { good: 100, poor: 300 },
  // First Input Delay
  TTFB: { good: 800, poor: 1800 }
  // Time to First Byte
};
function getPerformanceRating(metricName, value) {
  const threshold = THRESHOLDS[metricName];
  if (!threshold) return "good";
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}
function measureWebVitals(callback) {
  if (typeof window === "undefined") return;
  try {
    import('web-vitals').then(({ onFCP, onLCP, onCLS, onFID, onTTFB }) => {
      onFCP((metric) => {
        callback({
          id: metric.id,
          name: "FCP",
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating("FCP", metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });
      onLCP((metric) => {
        callback({
          id: metric.id,
          name: "LCP",
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating("LCP", metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });
      onCLS((metric) => {
        callback({
          id: metric.id,
          name: "CLS",
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating("CLS", metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });
      onFID((metric) => {
        callback({
          id: metric.id,
          name: "FID",
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating("FID", metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });
      onTTFB((metric) => {
        callback({
          id: metric.id,
          name: "TTFB",
          value: metric.value,
          delta: metric.delta,
          rating: getPerformanceRating("TTFB", metric.value),
          entries: metric.entries,
          navigationType: metric.navigationType
        });
      });
    }).catch((error) => {
      console.warn("Failed to load web-vitals library:", error);
    });
  } catch (error) {
    console.warn("Error measuring web vitals:", error);
  }
}
function generatePerformanceReport(metrics) {
  const navigation = performance.getEntriesByType("navigation")[0];
  const resources = performance.getEntriesByType("resource");
  return {
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    connectionType: navigator.connection?.effectiveType || "unknown",
    metrics,
    pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
    resourceTimings: resources.slice(0, 20).map((resource) => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: getResourceType(resource.name)
    }))
  };
}
function getResourceType(url) {
  if (url.includes(".css")) return "stylesheet";
  if (url.includes(".js")) return "script";
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return "image";
  if (url.includes(".woff") || url.includes(".woff2")) return "font";
  return "other";
}
async function reportPerformanceData(report) {
  try {
    if ("sendBeacon" in navigator) {
      navigator.sendBeacon("/api/analytics/performance", JSON.stringify(report));
    } else {
      await fetch("/api/analytics/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
        keepalive: true
      });
    }
  } catch (error) {
    console.warn("Failed to report performance data:", error);
  }
}
var DEFAULT_BUDGET = {
  FCP: 1800,
  LCP: 2500,
  CLS: 0.1,
  FID: 100,
  TTFB: 800
};
function checkPerformanceBudget(metrics, budget = DEFAULT_BUDGET) {
  const violations = [];
  metrics.forEach((metric) => {
    const budgetValue = budget[metric.name];
    if (budgetValue && metric.value > budgetValue) {
      violations.push(`${metric.name}: ${metric.value}ms exceeds budget of ${budgetValue}ms`);
    }
  });
  return {
    passed: violations.length === 0,
    violations
  };
}
function initializePerformanceMonitoring(options = {}) {
  const { enableReporting = true, budget, onMetric } = options;
  const collectedMetrics = [];
  measureWebVitals((metric) => {
    collectedMetrics.push(metric);
    onMetric?.(metric);
    if (budget) {
      const budgetCheck = checkPerformanceBudget([metric], budget);
      if (!budgetCheck.passed) {
        console.warn("Performance budget violation:", budgetCheck.violations);
      }
    }
    console.debug(`${metric.name}: ${metric.value}ms (${metric.rating})`);
  });
  if (enableReporting) {
    window.addEventListener("beforeunload", () => {
      if (collectedMetrics.length > 0) {
        const report = generatePerformanceReport(collectedMetrics);
        reportPerformanceData(report);
      }
    });
  }
}
function createPerformanceHook() {
  return function usePerformanceMonitoring(enabled = true) {
    if (typeof window !== "undefined" && window.React?.useEffect) {
      const React = window.React;
      React.useEffect(() => {
        if (!enabled) return;
        initializePerformanceMonitoring({
          enableReporting: true,
          onMetric: (metric) => {
            if (process.env.NODE_ENV === "development") {
              console.debug("Performance metric:", metric);
            }
          }
        });
      }, [enabled]);
    } else {
      console.warn("React not available for performance hook");
    }
  };
}

// src/utils/index.ts
var SharedUtils = {};

exports.SharedUtils = SharedUtils;
exports.checkPerformanceBudget = checkPerformanceBudget;
exports.createPerformanceHook = createPerformanceHook;
exports.generatePerformanceReport = generatePerformanceReport;
exports.initializePerformanceMonitoring = initializePerformanceMonitoring;
exports.measureWebVitals = measureWebVitals;
exports.reportPerformanceData = reportPerformanceData;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map