'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');
var axios = require('axios');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var axios__default = /*#__PURE__*/_interopDefault(axios);

// src/components/SessionWarningModal.tsx
var SessionWarningModal = ({
  onExtend,
  onExpire,
  className = ""
}) => {
  const [isVisible, setIsVisible] = react.useState(false);
  const [timeRemaining, setTimeRemaining] = react.useState("2:00");
  const modalRef = react.useRef(null);
  const extendButtonRef = react.useRef(null);
  react.useRef(null);
  const countdownIntervalRef = react.useRef(null);
  react.useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [onExtend, onExpire]);
  react.useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
      } else if (e.key === "Enter" || e.key === " ") {
        if (document.activeElement === extendButtonRef.current) {
          e.preventDefault();
          handleExtendSession();
        }
      }
    };
    const handleFocusTrap = (e) => {
      if (!modalRef.current || !isVisible) return;
      if (!modalRef.current.contains(e.target)) {
        e.preventDefault();
        extendButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusTrap);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusTrap);
    };
  }, [isVisible]);
  const handleExtendSession = () => {
    if (onExtend) {
      onExtend();
    }
    setIsVisible(false);
  };
  const handleLogout = () => {
    setIsVisible(false);
    if (onExpire) {
      onExpire();
    }
  };
  if (!isVisible) return null;
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "fixed inset-0 z-40 bg-black bg-opacity-50", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref: modalRef,
        role: "alertdialog",
        "aria-modal": "true",
        "aria-labelledby": "session-warning-title",
        "aria-describedby": "session-warning-description",
        className: `fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`,
        children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "max-w-md w-full bg-white rounded-lg shadow-xl p-6", children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntime.jsx(
            "svg",
            {
              className: "w-8 h-8 text-yellow-600",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              xmlns: "http://www.w3.org/2000/svg",
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                }
              )
            }
          ) }) }),
          /* @__PURE__ */ jsxRuntime.jsx(
            "h2",
            {
              id: "session-warning-title",
              className: "text-xl font-bold text-center text-gray-900 mb-2",
              children: "Session Expiring Soon"
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { id: "session-warning-description", className: "text-center mb-6", children: [
            /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600 mb-2", children: "Your session will expire due to inactivity." }),
            /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "text-lg font-semibold text-gray-900", children: [
              "Time remaining: ",
              timeRemaining
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              id: "session-countdown",
              role: "timer",
              "aria-live": "polite",
              "aria-atomic": "true",
              className: "sr-only",
              children: [
                "Time remaining: ",
                timeRemaining
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                ref: extendButtonRef,
                onClick: handleExtendSession,
                className: "flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "aria-label": "Extend session and continue working",
                children: "Continue Working"
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                onClick: handleLogout,
                className: "flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
                "aria-label": "Log out now",
                children: "Log Out"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx("p", { className: "mt-4 text-xs text-center text-gray-500", children: "For your security, sessions expire after 30 minutes of inactivity." })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx("div", { role: "status", "aria-live": "assertive", "aria-atomic": "true", className: "sr-only", children: parseInt(timeRemaining) <= 30 && `Warning: Only ${timeRemaining} remaining. Please choose to continue working or log out.` })
  ] });
};
function useSessionWarning() {
  const [showModal, setShowModal] = react.useState(false);
  react.useEffect(() => {
    return () => {
    };
  }, []);
  return showModal;
}
var LoadingSpinner = ({
  size = "md",
  color = "#3b82f6",
  className = ""
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: `inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] ${sizeClasses[size]} ${className}`,
      style: { borderTopColor: color, borderLeftColor: color, borderBottomColor: color },
      role: "status",
      "aria-label": "Loading",
      children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: "Loading..." })
    }
  );
};

// src/hooks/index.ts
var SharedHooks = {};

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
      const React2 = window.React;
      React2.useEffect(() => {
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
function createApiClient(config) {
  const client = axios__default.default.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 3e4,
    withCredentials: config.withCredentials || false,
    headers: {
      "Content-Type": "application/json"
    }
  });
  let authToken = null;
  client.setAuthToken = (token) => {
    authToken = token;
  };
  client.interceptors.request.use(
    async (requestConfig) => {
      const token = authToken || (config.getAuthToken ? config.getAuthToken() : null);
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      const method = requestConfig.method?.toUpperCase();
      if (!config.skipCSRF && method && ["POST", "PUT", "DELETE", "PATCH"].includes(method) && !requestConfig.headers["X-Skip-CSRF"]) {
        try {
          const csrfToken = config.getCSRFToken ? await config.getCSRFToken() : null;
          if (csrfToken) {
            requestConfig.headers["X-CSRF-Token"] = csrfToken;
          }
        } catch (error) {
          console.warn("Failed to get CSRF token:", error);
        }
      }
      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && config.onUnauthorized) {
        config.onUnauthorized();
      }
      if (error.response?.status === 403 && error.response.data?.code === "CSRF_TOKEN_INVALID") {
        if (!error.config?._retried && config.getCSRFToken) {
          error.config._retried = true;
          try {
            const newToken = await config.getCSRFToken();
            if (newToken && error.config) {
              error.config.headers["X-CSRF-Token"] = newToken;
              return client(error.config);
            }
          } catch (csrfError) {
            console.error("Failed to refresh CSRF token:", csrfError);
          }
        }
      }
      if (config.onError) {
        config.onError(error);
      }
      return Promise.reject(error);
    }
  );
  return client;
}
function handleApiError(error) {
  if (axios__default.default.isAxiosError(error)) {
    const response = error.response;
    if (response) {
      return {
        message: response.data?.message || response.data?.error || `Error: ${response.status}`,
        code: response.data?.code || String(response.status),
        details: response.data
      };
    } else if (error.request) {
      return {
        message: "No response from server. Please check your connection.",
        code: "NETWORK_ERROR"
      };
    }
  }
  return {
    message: error.message || "An unexpected error occurred",
    code: "UNKNOWN_ERROR"
  };
}
function withRetry(apiCall, options = {}) {
  const {
    maxRetries = 3,
    delay = 1e3,
    shouldRetry = (error) => {
      if (axios__default.default.isAxiosError(error)) {
        return !error.response || error.response.status >= 500;
      }
      return false;
    }
  } = options;
  return new Promise(async (resolve, reject) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await apiCall();
        return resolve(result);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error) || i === maxRetries - 1) {
          return reject(error);
        }
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
      }
    }
    reject(lastError);
  });
}
var transformers = {
  // Convert snake_case to camelCase
  snakeToCamel: (data) => {
    if (Array.isArray(data)) {
      return data.map(transformers.snakeToCamel);
    }
    if (data !== null && typeof data === "object") {
      return Object.keys(data).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = transformers.snakeToCamel(data[key]);
        return acc;
      }, {});
    }
    return data;
  },
  // Convert camelCase to snake_case
  camelToSnake: (data) => {
    if (Array.isArray(data)) {
      return data.map(transformers.camelToSnake);
    }
    if (data !== null && typeof data === "object") {
      return Object.keys(data).reduce((acc, key) => {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        acc[snakeKey] = transformers.camelToSnake(data[key]);
        return acc;
      }, {});
    }
    return data;
  }
};

exports.LoadingSpinner = LoadingSpinner;
exports.SessionWarningModal = SessionWarningModal;
exports.SharedHooks = SharedHooks;
exports.SharedUtils = SharedUtils;
exports.checkPerformanceBudget = checkPerformanceBudget;
exports.createApiClient = createApiClient;
exports.createPerformanceHook = createPerformanceHook;
exports.generatePerformanceReport = generatePerformanceReport;
exports.handleApiError = handleApiError;
exports.initializePerformanceMonitoring = initializePerformanceMonitoring;
exports.measureWebVitals = measureWebVitals;
exports.reportPerformanceData = reportPerformanceData;
exports.transformers = transformers;
exports.useSessionWarning = useSessionWarning;
exports.withRetry = withRetry;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map