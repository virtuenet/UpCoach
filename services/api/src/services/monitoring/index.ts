/**
 * Monitoring Services Index
 *
 * Exports all monitoring-related services including
 * production monitoring, health checks, profiling, and external integrations.
 */

// Production Monitoring Service
export {
  ProductionMonitoringService,
  productionMonitoringService,
  type MonitoredModel,
  type ModelMetrics,
  type AlertRule,
  type Alert,
  type AlertSeverity,
  type AlertStatus,
  type DriftReport,
  type SLAReport,
  type MonitoringStats,
} from './ProductionMonitoringService';

// Model Health Check Service
export {
  ModelHealthCheckService,
  modelHealthCheckService,
  type CheckType,
  type HealthStatus,
  type HealthCheck,
  type HealthCheckResult,
  type ModelHealthStatus,
  type DependencyHealth,
  type HealingRule,
  type HealingAction,
  type HealingEvent,
  type AggregatedHealth,
  type HealthCheckStats,
} from './ModelHealthCheckService';

// DataDog Service
export { DataDogService } from './DataDogService';

// Performance Profiler
export { PerformanceProfiler } from './PerformanceProfiler';

// Sentry Service
export { SentryService } from './SentryService';
