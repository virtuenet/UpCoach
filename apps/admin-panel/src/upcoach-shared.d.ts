/**
 * Type declarations for @upcoach/shared package
 */
declare module '@upcoach/shared' {
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
    resourceTimings: Array<{
      name: string;
      duration: number;
      size: number;
      type: string;
    }>;
  }

  export interface PerformanceBudget {
    FCP: number;
    LCP: number;
    CLS: number;
    FID: number;
    TTFB: number;
  }

  export function measureWebVitals(callback: (metric: Metric) => void): void;
  export function generatePerformanceReport(metrics: Metric[]): PerformanceReport;
  export function reportPerformanceData(report: PerformanceReport): Promise<void>;
  export function checkPerformanceBudget(
    metrics: Metric[],
    budget?: PerformanceBudget
  ): { passed: boolean; violations: string[] };
  export function initializePerformanceMonitoring(options?: {
    enableReporting?: boolean;
    budget?: PerformanceBudget;
    onMetric?: (metric: Metric) => void;
  }): void;
  export function createPerformanceHook(): (enabled?: boolean) => void;
}

declare module '@upcoach/shared/components' {
  import { FC, ReactNode } from 'react';

  export interface SessionWarningModalProps {
    onExtend: () => void;
    onExpire: () => void;
  }

  export const SessionWarningModal: FC<SessionWarningModalProps>;
  export function useSessionWarning(): {
    isWarningVisible: boolean;
    remainingTime: number;
  };
}

declare module '@upcoach/shared/hooks' {
  export const SharedHooks: Record<string, unknown>;
}

declare module '@upcoach/shared/utils' {
  export * from '@upcoach/shared';
}

declare module '@upcoach/shared/services' {
  export const SharedServices: Record<string, unknown>;
}
