import { useState, useEffect, useCallback } from 'react';

/**
 * Performance data types
 */
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

export interface CPUMetrics {
  usage: number;
  cores: number;
  loadAverage: [number, number, number];
  history: TimeSeriesDataPoint[];
}

export interface MemoryMetrics {
  used: number; // bytes
  total: number; // bytes
  percentage: number;
  history: TimeSeriesDataPoint[];
}

export interface DatabaseMetrics {
  connections: {
    active: number;
    max: number;
    percentage: number;
  };
  queries: {
    avgResponseTime: number; // ms
    slowQueries: number;
    queriesPerSecond: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
  };
}

export interface APIMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  responseTime: {
    avg: number; // ms
    p95: number;
    p99: number;
  };
  endpoints: Array<{
    path: string;
    requests: number;
    avgResponseTime: number;
  }>;
}

export interface RedisMetrics {
  connections: number;
  memory: {
    used: number; // bytes
    peak: number; // bytes
    percentage: number;
  };
  operations: {
    gets: number;
    sets: number;
    deletes: number;
  };
  hitRate: number;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface PerformanceData {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  database: DatabaseMetrics;
  api: APIMetrics;
  redis: RedisMetrics;
  alerts: Alert[];
}

export interface UsePerformanceMetricsReturn {
  data: PerformanceData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * usePerformanceMetrics Hook
 *
 * Fetches and manages performance metrics data for the admin dashboard.
 * This hook provides real-time system performance monitoring including:
 * - CPU usage and history
 * - Memory consumption
 * - Database performance
 * - API response times
 * - Redis cache metrics
 * - System alerts
 *
 * @param {number} refreshInterval - Auto-refresh interval in milliseconds (default: 30000)
 * @returns {UsePerformanceMetricsReturn} Performance metrics state and methods
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = usePerformanceMetrics();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <PerformanceCharts data={data} />;
 * ```
 */
export function usePerformanceMetrics(refreshInterval: number = 30000): UsePerformanceMetricsReturn {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch performance metrics from API
   */
  const fetchMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/v1/admin/performance/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch performance metrics: ${response.statusText}`);
      }

      const metricsData: PerformanceData = await response.json();
      setData(metricsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refetch metrics manually
   */
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchMetrics();
  }, [fetchMetrics]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval, fetchMetrics]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
