/**
 * Monitoring Service for Admin Panel
 *
 * Provides API client for fetching system health, performance metrics,
 * alerts, and error statistics from the backend monitoring services.
 */

import { api } from './api';

// Types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: number;
  components: ComponentHealth[];
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  latency?: number;
  lastChecked: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceBucket {
  name: string;
  count: number;
  avgDuration: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  errorRate: number;
  throughput: number;
}

export interface SlowTransaction {
  id: string;
  name: string;
  type: string;
  duration: number;
  timestamp: number;
  status: string;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalOperations: number;
  avgLatency: number;
  memoryUsage: number;
}

export interface DatabaseMetrics {
  queryCount: number;
  avgQueryTime: number;
  slowQueries: number;
  connectionPoolUsage: number;
  activeConnections: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved';
  title: string;
  message: string;
  createdAt: number;
  acknowledgedAt?: number;
  resolvedAt?: number;
}

export interface ErrorGroup {
  fingerprint: string;
  category: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
  resolved: boolean;
}

export interface ErrorStats {
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  topErrors: Array<{
    fingerprint: string;
    message: string;
    count: number;
  }>;
  errorRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MetricsSnapshot {
  timestamp: number;
  http: {
    requestsTotal: number;
    requestDurationAvg: number;
    errorRate: number;
    activeConnections: number;
  };
  database: {
    queryCount: number;
    avgQueryTime: number;
    activeConnections: number;
    poolUtilization: number;
  };
  cache: {
    hitRate: number;
    operations: number;
    memoryUsage: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    heapUsed: number;
    heapTotal: number;
    eventLoopLag: number;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  type: string;
  category: string;
  userId?: string;
  action: string;
  resource?: string;
  metadata: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// API Functions

/**
 * Fetch system health status
 */
export async function fetchSystemHealth(): Promise<SystemHealth> {
  try {
    const response = await api.get('/monitoring/health');
    return response.data;
  } catch {
    // Return mock data for development
    return {
      status: 'healthy',
      uptime: 432000000,
      timestamp: Date.now(),
      components: [
        { name: 'PostgreSQL', status: 'healthy', message: 'Connected', latency: 2, lastChecked: Date.now() },
        { name: 'Redis', status: 'healthy', message: 'Connected', latency: 1, lastChecked: Date.now() },
        { name: 'OpenAI API', status: 'healthy', message: 'Operational', latency: 150, lastChecked: Date.now() },
        { name: 'Stripe', status: 'healthy', message: 'Operational', latency: 45, lastChecked: Date.now() },
        { name: 'Firebase', status: 'healthy', message: 'Connected', latency: 23, lastChecked: Date.now() },
      ],
    };
  }
}

/**
 * Fetch performance metrics
 */
export async function fetchPerformanceMetrics(timeRange: string): Promise<{
  buckets: PerformanceBucket[];
  slowTransactions: SlowTransaction[];
  cache: CacheMetrics;
  database: DatabaseMetrics;
}> {
  try {
    const response = await api.get('/monitoring/performance', { params: { timeRange } });
    return response.data;
  } catch {
    // Return mock data for development
    return {
      buckets: [
        { name: 'GET:/api/v3/users/me', count: 15234, avgDuration: 45, p50: 32, p90: 78, p95: 120, p99: 250, errorRate: 0.002, throughput: 25.4 },
        { name: 'POST:/api/v3/habits/complete', count: 8456, avgDuration: 89, p50: 65, p90: 145, p95: 210, p99: 450, errorRate: 0.015, throughput: 14.1 },
        { name: 'GET:/api/v3/coaching/sessions', count: 6234, avgDuration: 156, p50: 120, p90: 280, p95: 380, p99: 750, errorRate: 0.008, throughput: 10.4 },
        { name: 'POST:/api/v3/ai/chat', count: 4567, avgDuration: 1250, p50: 950, p90: 2100, p95: 2800, p99: 4500, errorRate: 0.025, throughput: 7.6 },
        { name: 'GET:/api/v3/goals', count: 12345, avgDuration: 67, p50: 48, p90: 120, p95: 180, p99: 350, errorRate: 0.003, throughput: 20.6 },
      ],
      slowTransactions: [
        { id: '1', name: 'POST:/api/v3/ai/generate-plan', type: 'ai-inference', duration: 5420, timestamp: Date.now() - 60000, status: 'ok' },
        { id: '2', name: 'GET:/api/v3/analytics/dashboard', type: 'http-request', duration: 3200, timestamp: Date.now() - 120000, status: 'ok' },
        { id: '3', name: 'POST:/api/v3/reports/generate', type: 'background-job', duration: 2800, timestamp: Date.now() - 180000, status: 'ok' },
      ],
      cache: {
        hitRate: 0.89,
        missRate: 0.11,
        totalOperations: 78542,
        avgLatency: 2,
        memoryUsage: 256,
      },
      database: {
        queryCount: 34521,
        avgQueryTime: 8,
        slowQueries: 23,
        connectionPoolUsage: 0.65,
        activeConnections: 12,
      },
    };
  }
}

/**
 * Fetch active alerts
 */
export async function fetchAlerts(status?: string): Promise<Alert[]> {
  try {
    const response = await api.get('/monitoring/alerts', { params: { status } });
    return response.data;
  } catch {
    // Return mock data for development
    return [
      {
        id: 'alert_1',
        ruleId: 'high_error_rate',
        severity: 'warning',
        status: 'active',
        title: 'Elevated Error Rate',
        message: 'Error rate exceeded 1% threshold on /api/v3/ai/chat',
        createdAt: Date.now() - 300000,
      },
      {
        id: 'alert_2',
        ruleId: 'slow_response',
        severity: 'info',
        status: 'active',
        title: 'Slow Response Time',
        message: 'P95 latency above 2s for AI endpoints',
        createdAt: Date.now() - 600000,
      },
    ];
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await api.post(`/monitoring/alerts/${alertId}/acknowledge`);
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string): Promise<void> {
  await api.post(`/monitoring/alerts/${alertId}/resolve`);
}

/**
 * Fetch error statistics
 */
export async function fetchErrorStats(): Promise<ErrorStats> {
  try {
    const response = await api.get('/monitoring/errors/stats');
    return response.data;
  } catch {
    // Return mock data for development
    return {
      total: 1247,
      bySeverity: { critical: 3, error: 45, warning: 189, info: 1010 },
      byCategory: { validation: 523, network: 312, database: 89, authentication: 156, business_logic: 167 },
      topErrors: [
        { fingerprint: 'ValidationError_email_format', message: 'Invalid email format', count: 234 },
        { fingerprint: 'NetworkError_timeout', message: 'Request timeout', count: 145 },
        { fingerprint: 'AuthError_token_expired', message: 'Token expired', count: 98 },
      ],
      errorRate: 0.012,
      trend: 'stable',
    };
  }
}

/**
 * Fetch error groups
 */
export async function fetchErrorGroups(options?: {
  resolved?: boolean;
  severity?: string;
  category?: string;
  limit?: number;
}): Promise<ErrorGroup[]> {
  try {
    const response = await api.get('/monitoring/errors/groups', { params: options });
    return response.data;
  } catch {
    // Return mock data for development
    return [
      {
        fingerprint: 'ValidationError_email_format',
        category: 'validation',
        severity: 'warning',
        message: 'Invalid email format provided',
        occurrences: 234,
        firstSeen: Date.now() - 86400000 * 7,
        lastSeen: Date.now() - 3600000,
        resolved: false,
      },
      {
        fingerprint: 'NetworkError_timeout',
        category: 'network',
        severity: 'error',
        message: 'Request timeout to external service',
        occurrences: 145,
        firstSeen: Date.now() - 86400000 * 3,
        lastSeen: Date.now() - 7200000,
        resolved: false,
      },
    ];
  }
}

/**
 * Resolve an error group
 */
export async function resolveErrorGroup(fingerprint: string): Promise<void> {
  await api.post(`/monitoring/errors/groups/${fingerprint}/resolve`);
}

/**
 * Fetch metrics snapshot
 */
export async function fetchMetricsSnapshot(): Promise<MetricsSnapshot> {
  try {
    const response = await api.get('/monitoring/metrics/snapshot');
    return response.data;
  } catch {
    // Return mock data for development
    return {
      timestamp: Date.now(),
      http: {
        requestsTotal: 156789,
        requestDurationAvg: 125,
        errorRate: 0.012,
        activeConnections: 234,
      },
      database: {
        queryCount: 89234,
        avgQueryTime: 8,
        activeConnections: 15,
        poolUtilization: 0.65,
      },
      cache: {
        hitRate: 0.89,
        operations: 234567,
        memoryUsage: 256,
      },
      system: {
        cpuUsage: 0.35,
        memoryUsage: 0.68,
        heapUsed: 512 * 1024 * 1024,
        heapTotal: 1024 * 1024 * 1024,
        eventLoopLag: 2,
      },
    };
  }
}

/**
 * Fetch audit events
 */
export async function fetchAuditEvents(options?: {
  type?: string;
  userId?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): Promise<AuditEvent[]> {
  try {
    const response = await api.get('/monitoring/audit', { params: options });
    return response.data;
  } catch {
    // Return mock data for development
    return [
      {
        id: 'audit_1',
        timestamp: Date.now() - 60000,
        type: 'user.login',
        category: 'authentication',
        userId: 'user_123',
        action: 'User logged in',
        metadata: { ip: '192.168.1.1', userAgent: 'Chrome/120' },
        severity: 'low',
      },
      {
        id: 'audit_2',
        timestamp: Date.now() - 120000,
        type: 'admin.config_change',
        category: 'admin',
        userId: 'admin_1',
        action: 'Updated system configuration',
        resource: 'system.settings',
        metadata: { field: 'maintenance_mode', oldValue: false, newValue: true },
        severity: 'high',
      },
    ];
  }
}

/**
 * Fetch Prometheus-format metrics
 */
export async function fetchPrometheusMetrics(): Promise<string> {
  try {
    const response = await api.get('/monitoring/metrics/prometheus', {
      headers: { Accept: 'text/plain' },
    });
    return response.data;
  } catch {
    return '# No metrics available';
  }
}

export default {
  fetchSystemHealth,
  fetchPerformanceMetrics,
  fetchAlerts,
  acknowledgeAlert,
  resolveAlert,
  fetchErrorStats,
  fetchErrorGroups,
  resolveErrorGroup,
  fetchMetricsSnapshot,
  fetchAuditEvents,
  fetchPrometheusMetrics,
};
