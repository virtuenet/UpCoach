/**
 * System Monitoring Dashboard
 *
 * Real-time system health, performance metrics, and alerts.
 */

import React, { useState, useEffect, useCallback } from 'react';

// Types
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  version: string;
  components: ComponentHealth[];
}

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency: number;
  message: string;
  lastCheck: number;
}

interface APMSnapshot {
  timestamp: number;
  serviceName: string;
  transactions: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
  };
  activeTransactions: number;
  slowTransactions: number;
  errorTransactions: number;
}

interface MetricsSnapshot {
  timestamp: number;
  metrics: Array<{
    name: string;
    type: string;
    value: number;
  }>;
}

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'active' | 'acknowledged' | 'resolved' | 'silenced';
  title: string;
  message: string;
  triggeredAt: number;
}

interface ErrorStats {
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  errorRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Mock data generators
const generateMockHealth = (): SystemHealth => ({
  status: Math.random() > 0.1 ? 'healthy' : 'degraded',
  timestamp: Date.now(),
  uptime: Math.floor(Math.random() * 86400000 * 7),
  version: '1.0.0',
  components: [
    {
      name: 'database',
      status: 'healthy',
      latency: Math.floor(Math.random() * 50),
      message: 'PostgreSQL responding normally',
      lastCheck: Date.now(),
    },
    {
      name: 'redis',
      status: 'healthy',
      latency: Math.floor(Math.random() * 10),
      message: 'Redis cache operational',
      lastCheck: Date.now(),
    },
    {
      name: 'external-apis',
      status: Math.random() > 0.9 ? 'degraded' : 'healthy',
      latency: Math.floor(Math.random() * 200),
      message: 'All external APIs available',
      lastCheck: Date.now(),
    },
    {
      name: 'memory',
      status: 'healthy',
      latency: 0,
      message: 'Heap usage: 65%',
      lastCheck: Date.now(),
    },
    {
      name: 'event-loop',
      status: 'healthy',
      latency: Math.floor(Math.random() * 5),
      message: 'Event loop latency normal',
      lastCheck: Date.now(),
    },
  ],
});

const generateMockAPM = (): APMSnapshot => ({
  timestamp: Date.now(),
  serviceName: 'upcoach-api',
  transactions: {
    total: Math.floor(Math.random() * 10000) + 5000,
    successful: Math.floor(Math.random() * 9500) + 4500,
    failed: Math.floor(Math.random() * 100),
    avgDuration: Math.floor(Math.random() * 500) + 50,
  },
  activeTransactions: Math.floor(Math.random() * 50),
  slowTransactions: Math.floor(Math.random() * 20),
  errorTransactions: Math.floor(Math.random() * 10),
});

const generateMockAlerts = (): Alert[] => [
  {
    id: '1',
    ruleId: 'high-latency',
    ruleName: 'High API Latency',
    severity: 'medium',
    status: 'active',
    title: 'High API Latency',
    message: 'P95 latency exceeds 2 seconds',
    triggeredAt: Date.now() - 300000,
  },
  {
    id: '2',
    ruleId: 'error-rate',
    ruleName: 'Error Rate Threshold',
    severity: 'low',
    status: 'acknowledged',
    title: 'Elevated Error Rate',
    message: 'Error rate at 2.5%',
    triggeredAt: Date.now() - 600000,
  },
];

const generateMockErrors = (): ErrorStats => ({
  total: Math.floor(Math.random() * 500) + 100,
  bySeverity: {
    critical: Math.floor(Math.random() * 5),
    error: Math.floor(Math.random() * 50),
    warning: Math.floor(Math.random() * 100),
    info: Math.floor(Math.random() * 200),
  },
  byCategory: {
    database: Math.floor(Math.random() * 20),
    network: Math.floor(Math.random() * 30),
    validation: Math.floor(Math.random() * 100),
    authentication: Math.floor(Math.random() * 15),
    unknown: Math.floor(Math.random() * 50),
  },
  errorRate: Math.random() * 0.05,
  trend: Math.random() > 0.5 ? 'stable' : Math.random() > 0.5 ? 'decreasing' : 'increasing',
});

export const SystemMonitoring: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [apm, setAPM] = useState<APMSnapshot | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [errors, setErrors] = useState<ErrorStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API calls
    await new Promise((resolve) => setTimeout(resolve, 500));
    setHealth(generateMockHealth());
    setAPM(generateMockAPM());
    setAlerts(generateMockAlerts());
    setErrors(generateMockErrors());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const formatUptime = (ms: number): string => {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'unhealthy':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>System Monitoring</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Real-time health and performance monitoring</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.7 : 1,
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* System Status Banner */}
      {health && (
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: getStatusColor(health.status) + '20',
            borderLeft: `4px solid ${getStatusColor(health.status)}`,
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(health.status),
              }}
            />
            <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{health.status}</span>
            <span style={{ color: '#6b7280' }}>|</span>
            <span style={{ color: '#6b7280' }}>Version {health.version}</span>
            <span style={{ color: '#6b7280' }}>|</span>
            <span style={{ color: '#6b7280' }}>Uptime: {formatUptime(health.uptime)}</span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {apm && (
          <>
            <MetricCard
              title="Total Transactions"
              value={apm.transactions.total.toLocaleString()}
              subtitle="Last 24 hours"
            />
            <MetricCard
              title="Avg Duration"
              value={`${apm.transactions.avgDuration}ms`}
              subtitle="Response time"
            />
            <MetricCard
              title="Error Rate"
              value={`${((apm.transactions.failed / apm.transactions.total) * 100).toFixed(2)}%`}
              subtitle="Failed transactions"
              color={apm.transactions.failed > 100 ? '#ef4444' : '#10b981'}
            />
            <MetricCard
              title="Active Now"
              value={apm.activeTransactions.toString()}
              subtitle="In-flight requests"
            />
          </>
        )}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Component Health */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Component Health</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {health?.components.map((component) => (
              <div
                key={component.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(component.status),
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{component.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{component.message}</div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{component.latency}ms</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Active Alerts</h2>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No active alerts</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    padding: '12px',
                    backgroundColor: getSeverityColor(alert.severity) + '10',
                    borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{alert.title}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{alert.message}</div>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: getSeverityColor(alert.severity),
                        color: 'white',
                        textTransform: 'capitalize',
                      }}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                    {new Date(alert.triggeredAt).toLocaleString()} · {alert.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Statistics */}
      {errors && (
        <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Error Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{errors.total}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Errors</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                {errors.bySeverity.critical || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Critical</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f97316' }}>
                {errors.bySeverity.error || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Errors</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{(errors.errorRate * 100).toFixed(2)}%</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Error Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: errors.trend === 'increasing' ? '#ef4444' : errors.trend === 'decreasing' ? '#10b981' : '#6b7280',
                }}
              >
                {errors.trend === 'increasing' ? '↑' : errors.trend === 'decreasing' ? '↓' : '→'}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{errors.trend}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  color?: string;
}> = ({ title, value, subtitle, color = '#111827' }) => (
  <div
    style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}
  >
    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{title}</div>
    <div style={{ fontSize: '28px', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{subtitle}</div>
  </div>
);

export default SystemMonitoring;
