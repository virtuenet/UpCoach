export { LoadingSpinner, LoadingSpinnerProps, SessionWarningModal, useSessionWarning } from './components/index.js';
export { SharedHooks } from './hooks/index.js';
export { Metric, PerformanceBudget, PerformanceReport, SharedUtils, checkPerformanceBudget, createPerformanceHook, generatePerformanceReport, initializePerformanceMonitoring, measureWebVitals, reportPerformanceData } from './utils/index.js';
export { ApiClient, ApiClientConfig, createApiClient, handleApiError, transformers, withRetry } from './services/index.js';
import 'react';
import 'axios';
