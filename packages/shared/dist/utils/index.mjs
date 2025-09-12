var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../node_modules/web-vitals/dist/web-vitals.js
var web_vitals_exports = {};
__export(web_vitals_exports, {
  CLSThresholds: () => b,
  FCPThresholds: () => L,
  FIDThresholds: () => D,
  INPThresholds: () => j,
  LCPThresholds: () => U,
  TTFBThresholds: () => X,
  getCLS: () => S,
  getFCP: () => w,
  getFID: () => x,
  getINP: () => Q,
  getLCP: () => W,
  getTTFB: () => Z,
  onCLS: () => S,
  onFCP: () => w,
  onFID: () => x,
  onINP: () => Q,
  onLCP: () => W,
  onTTFB: () => Z
});
var e, n, t, i, r, a, o, c, u, f, s, d, l, p, v, m, h, g, y, T, E, C, L, w, b, S, A, I, P, F, M, k, D, x, B, R, H, N, O, q, j, _, z, G, J, K, Q, U, V, W, X, Y, Z;
var init_web_vitals = __esm({
  "../../node_modules/web-vitals/dist/web-vitals.js"() {
    a = -1;
    o = function(e3) {
      addEventListener("pageshow", (function(n2) {
        n2.persisted && (a = n2.timeStamp, e3(n2));
      }), true);
    };
    c = function() {
      return window.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    };
    u = function() {
      var e3 = c();
      return e3 && e3.activationStart || 0;
    };
    f = function(e3, n2) {
      var t2 = c(), i2 = "navigate";
      a >= 0 ? i2 = "back-forward-cache" : t2 && (document.prerendering || u() > 0 ? i2 = "prerender" : document.wasDiscarded ? i2 = "restore" : t2.type && (i2 = t2.type.replace(/_/g, "-")));
      return { name: e3, value: void 0 === n2 ? -1 : n2, rating: "good", delta: 0, entries: [], id: "v3-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: i2 };
    };
    s = function(e3, n2, t2) {
      try {
        if (PerformanceObserver.supportedEntryTypes.includes(e3)) {
          var i2 = new PerformanceObserver((function(e4) {
            Promise.resolve().then((function() {
              n2(e4.getEntries());
            }));
          }));
          return i2.observe(Object.assign({ type: e3, buffered: true }, t2 || {})), i2;
        }
      } catch (e4) {
      }
    };
    d = function(e3, n2, t2, i2) {
      var r2, a2;
      return function(o2) {
        n2.value >= 0 && (o2 || i2) && ((a2 = n2.value - (r2 || 0)) || void 0 === r2) && (r2 = n2.value, n2.delta = a2, n2.rating = (function(e4, n3) {
          return e4 > n3[1] ? "poor" : e4 > n3[0] ? "needs-improvement" : "good";
        })(n2.value, t2), e3(n2));
      };
    };
    l = function(e3) {
      requestAnimationFrame((function() {
        return requestAnimationFrame((function() {
          return e3();
        }));
      }));
    };
    p = function(e3) {
      var n2 = function(n3) {
        "pagehide" !== n3.type && "hidden" !== document.visibilityState || e3(n3);
      };
      addEventListener("visibilitychange", n2, true), addEventListener("pagehide", n2, true);
    };
    v = function(e3) {
      var n2 = false;
      return function(t2) {
        n2 || (e3(t2), n2 = true);
      };
    };
    m = -1;
    h = function() {
      return "hidden" !== document.visibilityState || document.prerendering ? 1 / 0 : 0;
    };
    g = function(e3) {
      "hidden" === document.visibilityState && m > -1 && (m = "visibilitychange" === e3.type ? e3.timeStamp : 0, T());
    };
    y = function() {
      addEventListener("visibilitychange", g, true), addEventListener("prerenderingchange", g, true);
    };
    T = function() {
      removeEventListener("visibilitychange", g, true), removeEventListener("prerenderingchange", g, true);
    };
    E = function() {
      return m < 0 && (m = h(), y(), o((function() {
        setTimeout((function() {
          m = h(), y();
        }), 0);
      }))), { get firstHiddenTime() {
        return m;
      } };
    };
    C = function(e3) {
      document.prerendering ? addEventListener("prerenderingchange", (function() {
        return e3();
      }), true) : e3();
    };
    L = [1800, 3e3];
    w = function(e3, n2) {
      n2 = n2 || {}, C((function() {
        var t2, i2 = E(), r2 = f("FCP"), a2 = s("paint", (function(e4) {
          e4.forEach((function(e5) {
            "first-contentful-paint" === e5.name && (a2.disconnect(), e5.startTime < i2.firstHiddenTime && (r2.value = Math.max(e5.startTime - u(), 0), r2.entries.push(e5), t2(true)));
          }));
        }));
        a2 && (t2 = d(e3, r2, L, n2.reportAllChanges), o((function(i3) {
          r2 = f("FCP"), t2 = d(e3, r2, L, n2.reportAllChanges), l((function() {
            r2.value = performance.now() - i3.timeStamp, t2(true);
          }));
        })));
      }));
    };
    b = [0.1, 0.25];
    S = function(e3, n2) {
      n2 = n2 || {}, w(v((function() {
        var t2, i2 = f("CLS", 0), r2 = 0, a2 = [], c2 = function(e4) {
          e4.forEach((function(e5) {
            if (!e5.hadRecentInput) {
              var n3 = a2[0], t3 = a2[a2.length - 1];
              r2 && e5.startTime - t3.startTime < 1e3 && e5.startTime - n3.startTime < 5e3 ? (r2 += e5.value, a2.push(e5)) : (r2 = e5.value, a2 = [e5]);
            }
          })), r2 > i2.value && (i2.value = r2, i2.entries = a2, t2());
        }, u2 = s("layout-shift", c2);
        u2 && (t2 = d(e3, i2, b, n2.reportAllChanges), p((function() {
          c2(u2.takeRecords()), t2(true);
        })), o((function() {
          r2 = 0, i2 = f("CLS", 0), t2 = d(e3, i2, b, n2.reportAllChanges), l((function() {
            return t2();
          }));
        })), setTimeout(t2, 0));
      })));
    };
    A = { passive: true, capture: true };
    I = /* @__PURE__ */ new Date();
    P = function(i2, r2) {
      e || (e = r2, n = i2, t = /* @__PURE__ */ new Date(), k(removeEventListener), F());
    };
    F = function() {
      if (n >= 0 && n < t - I) {
        var r2 = { entryType: "first-input", name: e.type, target: e.target, cancelable: e.cancelable, startTime: e.timeStamp, processingStart: e.timeStamp + n };
        i.forEach((function(e3) {
          e3(r2);
        })), i = [];
      }
    };
    M = function(e3) {
      if (e3.cancelable) {
        var n2 = (e3.timeStamp > 1e12 ? /* @__PURE__ */ new Date() : performance.now()) - e3.timeStamp;
        "pointerdown" == e3.type ? (function(e4, n3) {
          var t2 = function() {
            P(e4, n3), r2();
          }, i2 = function() {
            r2();
          }, r2 = function() {
            removeEventListener("pointerup", t2, A), removeEventListener("pointercancel", i2, A);
          };
          addEventListener("pointerup", t2, A), addEventListener("pointercancel", i2, A);
        })(n2, e3) : P(n2, e3);
      }
    };
    k = function(e3) {
      ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((function(n2) {
        return e3(n2, M, A);
      }));
    };
    D = [100, 300];
    x = function(t2, r2) {
      r2 = r2 || {}, C((function() {
        var a2, c2 = E(), u2 = f("FID"), l2 = function(e3) {
          e3.startTime < c2.firstHiddenTime && (u2.value = e3.processingStart - e3.startTime, u2.entries.push(e3), a2(true));
        }, m2 = function(e3) {
          e3.forEach(l2);
        }, h2 = s("first-input", m2);
        a2 = d(t2, u2, D, r2.reportAllChanges), h2 && p(v((function() {
          m2(h2.takeRecords()), h2.disconnect();
        }))), h2 && o((function() {
          var o2;
          u2 = f("FID"), a2 = d(t2, u2, D, r2.reportAllChanges), i = [], n = -1, e = null, k(addEventListener), o2 = l2, i.push(o2), F();
        }));
      }));
    };
    B = 0;
    R = 1 / 0;
    H = 0;
    N = function(e3) {
      e3.forEach((function(e4) {
        e4.interactionId && (R = Math.min(R, e4.interactionId), H = Math.max(H, e4.interactionId), B = H ? (H - R) / 7 + 1 : 0);
      }));
    };
    O = function() {
      return r ? B : performance.interactionCount || 0;
    };
    q = function() {
      "interactionCount" in performance || r || (r = s("event", N, { type: "event", buffered: true, durationThreshold: 0 }));
    };
    j = [200, 500];
    _ = 0;
    z = function() {
      return O() - _;
    };
    G = [];
    J = {};
    K = function(e3) {
      var n2 = G[G.length - 1], t2 = J[e3.interactionId];
      if (t2 || G.length < 10 || e3.duration > n2.latency) {
        if (t2) t2.entries.push(e3), t2.latency = Math.max(t2.latency, e3.duration);
        else {
          var i2 = { id: e3.interactionId, latency: e3.duration, entries: [e3] };
          J[i2.id] = i2, G.push(i2);
        }
        G.sort((function(e4, n3) {
          return n3.latency - e4.latency;
        })), G.splice(10).forEach((function(e4) {
          delete J[e4.id];
        }));
      }
    };
    Q = function(e3, n2) {
      n2 = n2 || {}, C((function() {
        var t2;
        q();
        var i2, r2 = f("INP"), a2 = function(e4) {
          e4.forEach((function(e5) {
            (e5.interactionId && K(e5), "first-input" === e5.entryType) && (!G.some((function(n4) {
              return n4.entries.some((function(n5) {
                return e5.duration === n5.duration && e5.startTime === n5.startTime;
              }));
            })) && K(e5));
          }));
          var n3, t3 = (n3 = Math.min(G.length - 1, Math.floor(z() / 50)), G[n3]);
          t3 && t3.latency !== r2.value && (r2.value = t3.latency, r2.entries = t3.entries, i2());
        }, c2 = s("event", a2, { durationThreshold: null !== (t2 = n2.durationThreshold) && void 0 !== t2 ? t2 : 40 });
        i2 = d(e3, r2, j, n2.reportAllChanges), c2 && ("PerformanceEventTiming" in window && "interactionId" in PerformanceEventTiming.prototype && c2.observe({ type: "first-input", buffered: true }), p((function() {
          a2(c2.takeRecords()), r2.value < 0 && z() > 0 && (r2.value = 0, r2.entries = []), i2(true);
        })), o((function() {
          G = [], _ = O(), r2 = f("INP"), i2 = d(e3, r2, j, n2.reportAllChanges);
        })));
      }));
    };
    U = [2500, 4e3];
    V = {};
    W = function(e3, n2) {
      n2 = n2 || {}, C((function() {
        var t2, i2 = E(), r2 = f("LCP"), a2 = function(e4) {
          var n3 = e4[e4.length - 1];
          n3 && n3.startTime < i2.firstHiddenTime && (r2.value = Math.max(n3.startTime - u(), 0), r2.entries = [n3], t2());
        }, c2 = s("largest-contentful-paint", a2);
        if (c2) {
          t2 = d(e3, r2, U, n2.reportAllChanges);
          var m2 = v((function() {
            V[r2.id] || (a2(c2.takeRecords()), c2.disconnect(), V[r2.id] = true, t2(true));
          }));
          ["keydown", "click"].forEach((function(e4) {
            addEventListener(e4, (function() {
              return setTimeout(m2, 0);
            }), true);
          })), p(m2), o((function(i3) {
            r2 = f("LCP"), t2 = d(e3, r2, U, n2.reportAllChanges), l((function() {
              r2.value = performance.now() - i3.timeStamp, V[r2.id] = true, t2(true);
            }));
          }));
        }
      }));
    };
    X = [800, 1800];
    Y = function e2(n2) {
      document.prerendering ? C((function() {
        return e2(n2);
      })) : "complete" !== document.readyState ? addEventListener("load", (function() {
        return e2(n2);
      }), true) : setTimeout(n2, 0);
    };
    Z = function(e3, n2) {
      n2 = n2 || {};
      var t2 = f("TTFB"), i2 = d(e3, t2, X, n2.reportAllChanges);
      Y((function() {
        var r2 = c();
        if (r2) {
          var a2 = r2.responseStart;
          if (a2 <= 0 || a2 > performance.now()) return;
          t2.value = Math.max(a2 - u(), 0), t2.entries = [r2], i2(true), o((function() {
            t2 = f("TTFB", 0), (i2 = d(e3, t2, X, n2.reportAllChanges))(true);
          }));
        }
      }));
    };
  }
});

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
    Promise.resolve().then(() => (init_web_vitals(), web_vitals_exports)).then(({ onFCP, onLCP, onCLS, onFID, onTTFB }) => {
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

export { SharedUtils, checkPerformanceBudget, createPerformanceHook, generatePerformanceReport, initializePerformanceMonitoring, measureWebVitals, reportPerformanceData };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map