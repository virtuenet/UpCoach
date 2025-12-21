/**
 * Monitoring Services Index
 *
 * Exports all monitoring-related services including
 * production monitoring, health checks, profiling, and external integrations.
 */

// APM Service
export {
  APMService,
  getAPMService,
  type TransactionType,
  type TransactionStatus,
  type TransactionContext,
  type Span,
  type ErrorInfo,
  type TransactionMetrics,
  type APMConfig,
  type PerformanceBucket,
  type SystemMetrics,
  type APMSnapshot,
} from './APMService';

// Metrics Collector
export {
  MetricsCollector,
  getMetricsCollector,
  type MetricType,
  type Labels,
  type CounterMetric,
  type GaugeMetric,
  type HistogramMetric,
  type SummaryMetric,
  type Metric,
  type MetricDefinition,
  type MetricsConfig,
  type MetricsSnapshot,
  type BusinessMetrics,
} from './MetricsCollector';

// Health Check Service
export {
  HealthCheckService,
  getHealthCheckService,
  type HealthStatus as ServiceHealthStatus,
  type ComponentHealth,
  type SystemHealth,
  type ReadinessCheck,
  type LivenessCheck,
  type HealthCheckConfig,
  type CheckFunction,
} from './HealthCheckService';

// Error Reporter
export {
  ErrorReporter,
  getErrorReporter,
  type ErrorSeverity,
  type ErrorCategory,
  type ErrorContext,
  type ReportedError,
  type ErrorGroup,
  type ErrorReporterConfig,
  type ErrorStats,
} from './ErrorReporter';

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

// Initialize all monitoring services
export async function initializeMonitoring(): Promise<{
  apm: InstanceType<typeof APMService>;
  metrics: InstanceType<typeof MetricsCollector>;
  health: InstanceType<typeof HealthCheckService>;
  errors: InstanceType<typeof ErrorReporter>;
}> {
  const apm = getAPMService();
  const metrics = getMetricsCollector();
  const health = getHealthCheckService();
  const errors = getErrorReporter();

  await apm.initialize();
  health.start();

  console.log('Monitoring services initialized');

  return { apm, metrics, health, errors };
}

// Shutdown all monitoring services
export async function shutdownMonitoring(): Promise<void> {
  const apm = getAPMService();
  const metrics = getMetricsCollector();
  const health = getHealthCheckService();

  await apm.shutdown();
  metrics.stop();
  health.stop();

  console.log('Monitoring services shut down');
}
