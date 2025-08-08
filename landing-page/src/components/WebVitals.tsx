"use client";

import { useEffect } from "react";
import { trackWebVitals } from "@/services/analytics";

type MetricType = {
  name: string;
  value: number;
  delta: number;
  id: string;
  entries: any[];
};

export default function WebVitals() {
  useEffect(() => {
    const reportWebVitals = async () => {
      if (typeof window !== "undefined" && "web-vitals" in window) {
        return;
      }

      try {
        const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import(
          "web-vitals"
        );

        const sendToAnalytics = (metric: MetricType) => {
          // Log to console in development
          if (process.env.NODE_ENV === "development") {
            console.log(`Web Vital: ${metric.name}`, {
              value: metric.value,
              delta: metric.delta,
              id: metric.id,
            });
          }

          // Determine rating based on thresholds
          let rating: "good" | "needs-improvement" | "poor" = "good";

          switch (metric.name) {
            case "FCP":
              rating =
                metric.value <= 1800
                  ? "good"
                  : metric.value <= 3000
                    ? "needs-improvement"
                    : "poor";
              break;
            case "LCP":
              rating =
                metric.value <= 2500
                  ? "good"
                  : metric.value <= 4000
                    ? "needs-improvement"
                    : "poor";
              break;
            case "FID":
              rating =
                metric.value <= 100
                  ? "good"
                  : metric.value <= 300
                    ? "needs-improvement"
                    : "poor";
              break;
            case "CLS":
              rating =
                metric.value <= 0.1
                  ? "good"
                  : metric.value <= 0.25
                    ? "needs-improvement"
                    : "poor";
              break;
            case "TTFB":
              rating =
                metric.value <= 800
                  ? "good"
                  : metric.value <= 1800
                    ? "needs-improvement"
                    : "poor";
              break;
            case "INP":
              rating =
                metric.value <= 200
                  ? "good"
                  : metric.value <= 500
                    ? "needs-improvement"
                    : "poor";
              break;
          }

          // Track to Google Analytics
          trackWebVitals({
            name: metric.name,
            value: metric.value,
            rating,
          });
        };

        // Core Web Vitals
        onCLS(sendToAnalytics);
        onFID(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
        onINP(sendToAnalytics);
      } catch (error) {
        console.error("Failed to load web-vitals:", error);
      }
    };

    reportWebVitals();
  }, []);

  return null;
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
