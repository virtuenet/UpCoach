import { useState, useEffect, useCallback } from 'react';

/**
 * System health data types
 */
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number; // ms
  lastChecked?: string;
  errorMessage?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down' | 'warning';
  uptime: number; // milliseconds
  services: {
    api: ServiceHealth;
    database: ServiceHealth;
    redis: ServiceHealth;
    storage: ServiceHealth;
    [key: string]: ServiceHealth; // Allow for additional services
  };
  lastChecked: string;
}

export interface UseSystemHealthReturn {
  data: SystemHealth | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * useSystemHealth Hook
 *
 * Monitors overall system health including:
 * - API service status
 * - Database connectivity
 * - Redis cache status
 * - Storage service status
 * - System uptime
 *
 * @param {number} refreshInterval - Auto-refresh interval in milliseconds (default: 60000)
 * @returns {UseSystemHealthReturn} System health state and methods
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useSystemHealth();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <HealthDashboard
 *     status={data.status}
 *     services={data.services}
 *     uptime={data.uptime}
 *   />
 * );
 * ```
 */
export function useSystemHealth(refreshInterval: number = 60000): UseSystemHealthReturn {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch system health from API
   */
  const fetchHealth = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/v1/admin/health', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch system health: ${response.statusText}`);
      }

      const healthData: SystemHealth = await response.json();
      setData(healthData);
      setError(null);
    } catch (err) {
      console.error('Error fetching system health:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refetch health data manually
   */
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchHealth();
  }, [fetchHealth]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchHealth();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval, fetchHealth]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
