/**
 * Performance Dashboard
 *
 * Detailed performance metrics, trends, and optimization insights.
 */

import React, { useState, useEffect, useCallback } from 'react';

// Types
interface PerformanceBucket {
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

interface SlowTransaction {
  id: string;
  name: string;
  type: string;
  duration: number;
  timestamp: number;
  status: string;
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalOperations: number;
  avgLatency: number;
  memoryUsage: number;
}

interface DatabaseMetrics {
  queryCount: number;
  avgQueryTime: number;
  slowQueries: number;
  connectionPoolUsage: number;
  activeConnections: number;
}

// Mock data generators
const generateMockBuckets = (): PerformanceBucket[] => [
  {
    name: 'GET:/api/v3/users/me',
    count: 15234,
    avgDuration: 45,
    p50: 32,
    p90: 78,
    p95: 120,
    p99: 250,
    errorRate: 0.002,
    throughput: 25.4,
  },
  {
    name: 'POST:/api/v3/habits/complete',
    count: 8456,
    avgDuration: 89,
    p50: 65,
    p90: 145,
    p95: 210,
    p99: 450,
    errorRate: 0.015,
    throughput: 14.1,
  },
  {
    name: 'GET:/api/v3/coaching/sessions',
    count: 6234,
    avgDuration: 156,
    p50: 120,
    p90: 280,
    p95: 380,
    p99: 750,
    errorRate: 0.008,
    throughput: 10.4,
  },
  {
    name: 'POST:/api/v3/ai/chat',
    count: 4567,
    avgDuration: 1250,
    p50: 950,
    p90: 2100,
    p95: 2800,
    p99: 4500,
    errorRate: 0.025,
    throughput: 7.6,
  },
  {
    name: 'GET:/api/v3/goals',
    count: 12345,
    avgDuration: 67,
    p50: 48,
    p90: 120,
    p95: 180,
    p99: 350,
    errorRate: 0.003,
    throughput: 20.6,
  },
];

const generateSlowTransactions = (): SlowTransaction[] => [
  {
    id: '1',
    name: 'POST:/api/v3/ai/generate-plan',
    type: 'ai-inference',
    duration: 5420,
    timestamp: Date.now() - 60000,
    status: 'ok',
  },
  {
    id: '2',
    name: 'GET:/api/v3/analytics/dashboard',
    type: 'http-request',
    duration: 3200,
    timestamp: Date.now() - 120000,
    status: 'ok',
  },
  {
    id: '3',
    name: 'POST:/api/v3/reports/generate',
    type: 'background-job',
    duration: 2800,
    timestamp: Date.now() - 180000,
    status: 'ok',
  },
];

const generateCacheMetrics = (): CacheMetrics => ({
  hitRate: 0.85 + Math.random() * 0.1,
  missRate: 0.05 + Math.random() * 0.1,
  totalOperations: Math.floor(Math.random() * 100000) + 50000,
  avgLatency: Math.floor(Math.random() * 5) + 1,
  memoryUsage: Math.floor(Math.random() * 500) + 100,
});

const generateDatabaseMetrics = (): DatabaseMetrics => ({
  queryCount: Math.floor(Math.random() * 50000) + 20000,
  avgQueryTime: Math.floor(Math.random() * 20) + 5,
  slowQueries: Math.floor(Math.random() * 50),
  connectionPoolUsage: 0.4 + Math.random() * 0.4,
  activeConnections: Math.floor(Math.random() * 15) + 5,
});

export const PerformanceDashboard: React.FC = () => {
  const [buckets, setBuckets] = useState<PerformanceBucket[]>([]);
  const [slowTransactions, setSlowTransactions] = useState<SlowTransaction[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics | null>(null);
  const [databaseMetrics, setDatabaseMetrics] = useState<DatabaseMetrics | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setBuckets(generateMockBuckets());
    setSlowTransactions(generateSlowTransactions());
    setCacheMetrics(generateCacheMetrics());
    setDatabaseMetrics(generateDatabaseMetrics());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Performance Dashboard</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>API performance metrics and optimization insights</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
            }}
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
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
      </div>

      {/* Cache & Database Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Cache Metrics */}
        {cacheMetrics && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Cache Performance</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <MetricItem
                label="Hit Rate"
                value={`${(cacheMetrics.hitRate * 100).toFixed(1)}%`}
                color={cacheMetrics.hitRate > 0.8 ? '#10b981' : '#f59e0b'}
              />
              <MetricItem label="Avg Latency" value={`${cacheMetrics.avgLatency}ms`} />
              <MetricItem label="Total Ops" value={cacheMetrics.totalOperations.toLocaleString()} />
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Cache Hit Rate</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{(cacheMetrics.hitRate * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${cacheMetrics.hitRate * 100}%`,
                    backgroundColor: cacheMetrics.hitRate > 0.8 ? '#10b981' : '#f59e0b',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Database Metrics */}
        {databaseMetrics && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Database Performance</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <MetricItem label="Query Count" value={databaseMetrics.queryCount.toLocaleString()} />
              <MetricItem label="Avg Query Time" value={`${databaseMetrics.avgQueryTime}ms`} />
              <MetricItem
                label="Slow Queries"
                value={databaseMetrics.slowQueries.toString()}
                color={databaseMetrics.slowQueries > 30 ? '#ef4444' : '#10b981'}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Connection Pool</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  {databaseMetrics.activeConnections} active ({(databaseMetrics.connectionPoolUsage * 100).toFixed(0)}%)
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${databaseMetrics.connectionPoolUsage * 100}%`,
                    backgroundColor: databaseMetrics.connectionPoolUsage > 0.8 ? '#ef4444' : '#10b981',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Endpoint Performance Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Endpoint Performance</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  ENDPOINT
                </th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  REQUESTS
                </th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  AVG
                </th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  P50
                </th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  P95
                </th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  P99
                </th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  ERROR RATE
                </th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  RPS
                </th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 8px', fontSize: '14px', fontFamily: 'monospace' }}>{bucket.name}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'right' }}>{bucket.count.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'right' }}>{formatDuration(bucket.avgDuration)}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'right' }}>{formatDuration(bucket.p50)}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'right' }}>{formatDuration(bucket.p95)}</td>
                  <td
                    style={{
                      padding: '12px 8px',
                      fontSize: '14px',
                      textAlign: 'right',
                      color: bucket.p99 > 1000 ? '#ef4444' : 'inherit',
                    }}
                  >
                    {formatDuration(bucket.p99)}
                  </td>
                  <td
                    style={{
                      padding: '12px 8px',
                      fontSize: '14px',
                      textAlign: 'right',
                      color: bucket.errorRate > 0.01 ? '#ef4444' : '#10b981',
                    }}
                  >
                    {(bucket.errorRate * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'right' }}>{bucket.throughput.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slow Transactions */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Recent Slow Transactions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {slowTransactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
              }}
            >
              <div>
                <div style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '14px' }}>{tx.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {tx.type} · {new Date(tx.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div
                style={{
                  padding: '4px 12px',
                  backgroundColor: tx.duration > 3000 ? '#ef4444' : '#f59e0b',
                  color: 'white',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {formatDuration(tx.duration)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Metric Item Component
const MetricItem: React.FC<{
  label: string;
  value: string;
  color?: string;
}> = ({ label, value, color = '#111827' }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#6b7280' }}>{label}</div>
  </div>
);

export default PerformanceDashboard;
