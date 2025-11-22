'use client';

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Web Vitals monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        console.log(`${entry.name}: ${entry.startTime}ms`);
      });

      // Largest Contentful Paint
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any; // Cast to handle missing processingStart property
          if (fidEntry.processingStart) {
            const delay = fidEntry.processingStart - entry.startTime;
            console.log('FID:', delay);
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as any; // Cast to handle layout-shift specific properties
          if (!clsEntry.hadRecentInput && clsEntry.value !== undefined) {
            clsValue += clsEntry.value;
            console.log('CLS:', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      return () => {
        observer.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);

  return null;
}
