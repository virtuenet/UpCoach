/**
 * Dashboard Service
 * Handles all dashboard-related API calls and data management
 */

import { apiClient } from './api';
import { ApiResponse } from '../../../../shared/types/api';

export interface DashboardStats {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    growth: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  };
  contentStats: {
    totalContent: number;
    pendingModeration: number;
    moderationRate: number;
    approvedToday: number;
    rejectedToday: number;
    trend: number;
  };
  financialStats: {
    revenue: number;
    growth: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    churnRate: number;
  };
  securityStats: {
    alerts: number;
    resolved: number;
    trend: number;
    criticalAlerts: number;
    lastSecurityScan: string;
  };
}

export interface UserGrowthData {
  month: string;
  users: number;
  active: number;
  growth: number;
}

export interface ContentModerationData {
  name: string;
  value: number;
  color: string;
}

export interface ActivityItem {
  id: number;
  user: string;
  action: string;
  time: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  apiResponseTime: {
    value: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    trend: number;
  };
  databasePerformance: {
    value: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    trend: number;
  };
  serverUptime: {
    value: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    upSince: string;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  userGrowth: UserGrowthData[];
  contentModeration: ContentModerationData[];
  recentActivities: ActivityItem[];
  systemHealth: SystemHealth;
  lastUpdated: string;
}

class DashboardService {
  private cache: DashboardData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private refreshInterval: NodeJS.Timeout | null = null;

  /**
   * Get dashboard data with caching
   */
  async getDashboardData(forceRefresh: boolean = false): Promise<DashboardData> {
    const now = Date.now();

    // Return cached data if available and not expired, unless force refresh
    if (
      !forceRefresh &&
      this.cache &&
      (now - this.lastFetch) < this.CACHE_DURATION
    ) {
      return this.cache;
    }

    try {
      // Fetch real metrics overview when forcing refresh; otherwise, still allow mock cache fallback
      if (forceRefresh) {
        const response = await apiClient.get<ApiResponse<any>>('/api/metrics/overview');
        const payload = response.data.data;

        const data: DashboardData = {
          stats: payload,
          userGrowth: await this.getUserGrowthData(),
          contentModeration: await this.generateContentModerationData(),
          recentActivities: await this.generateRecentActivities(),
          systemHealth: await this.getSystemHealth(),
          lastUpdated: new Date().toISOString(),
        } as any;

        this.cache = data;
        this.lastFetch = now;
        return data;
      }

      // Fallback to mock when not forcing refresh
      const data = await this.fetchMockDashboardData();

      this.cache = data;
      this.lastFetch = now;

      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);

      // Return cached data if available, otherwise throw
      if (this.cache) {
        console.warn('Using cached dashboard data due to API error');
        return this.cache;
      }

      throw error;
    }
  }

  /**
   * Get user growth data
   */
  async getUserGrowthData(): Promise<UserGrowthData[]> {
    try {
      // In real implementation: await apiClient.get('/admin/analytics/user-growth')
      return this.generateUserGrowthData();
    } catch (error) {
      console.error('Failed to fetch user growth data:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // In real implementation: await apiClient.get('/admin/system/health')
      return this.generateSystemHealthData();
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw error;
    }
  }

  /**
   * Enable auto-refresh of dashboard data
   */
  enableAutoRefresh(interval: number = 30000): void {
    this.disableAutoRefresh(); // Clear any existing interval

    this.refreshInterval = setInterval(async () => {
      try {
        await this.getDashboardData(true);
        // Emit event or use callback to notify components
        this.notifyDataUpdate();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, interval);
  }

  /**
   * Disable auto-refresh
   */
  disableAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Clear cache and force fresh data on next request
   */
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  /**
   * Check if data is stale
   */
  isDataStale(): boolean {
    if (!this.cache) return true;
    return (Date.now() - this.lastFetch) > this.CACHE_DURATION;
  }

  /**
   * Get cache status
   */
  getCacheInfo(): { hasCache: boolean; age: number; isStale: boolean } {
    return {
      hasCache: !!this.cache,
      age: this.cache ? Date.now() - this.lastFetch : 0,
      isStale: this.isDataStale(),
    };
  }

  /**
   * Mock data generation - replace with actual API calls
   */
  private async fetchMockDashboardData(): Promise<DashboardData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const now = new Date();
    const variance = () => Math.random() * 0.2 - 0.1; // ±10% variance

    return {
      stats: {
        userStats: {
          totalUsers: Math.floor(2100 * (1 + variance())),
          activeUsers: Math.floor(1680 * (1 + variance())),
          growth: Math.floor(12 * (1 + variance())),
          newUsersToday: Math.floor(45 * (1 + variance())),
          newUsersThisWeek: Math.floor(312 * (1 + variance())),
          newUsersThisMonth: Math.floor(1248 * (1 + variance())),
        },
        contentStats: {
          totalContent: Math.floor(450 * (1 + variance())),
          pendingModeration: Math.floor(23 * (1 + variance())),
          moderationRate: Math.floor(97 * (1 + variance())),
          approvedToday: Math.floor(12 * (1 + variance())),
          rejectedToday: Math.floor(2 * (1 + variance())),
          trend: Math.floor(-3 * (1 + variance())),
        },
        financialStats: {
          revenue: Math.floor(12450 * (1 + variance())),
          growth: Math.floor(15 * (1 + variance())),
          monthlyRecurringRevenue: Math.floor(8750 * (1 + variance())),
          averageRevenuePerUser: Math.floor(5.93 * 100) / 100,
          churnRate: Math.floor(3.2 * 10) / 10,
        },
        securityStats: {
          alerts: Math.floor(5 * (1 + variance())),
          resolved: Math.floor(95 * (1 + variance())),
          trend: Math.floor(8 * (1 + variance())),
          criticalAlerts: Math.floor(1 * (1 + variance())),
          lastSecurityScan: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        },
      },
      userGrowth: this.generateUserGrowthData(),
      contentModeration: this.generateContentModerationData(),
      recentActivities: this.generateRecentActivities(),
      systemHealth: this.generateSystemHealthData(),
      lastUpdated: now.toISOString(),
    };
  }

  private generateUserGrowthData(): UserGrowthData[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => {
      const baseUsers = 1200 + index * 150;
      const variance = Math.random() * 0.15 - 0.075; // ±7.5%

      return {
        month,
        users: Math.floor(baseUsers * (1 + variance)),
        active: Math.floor(baseUsers * 0.8 * (1 + variance)),
        growth: Math.floor((5 + index * 2) * (1 + variance)),
      };
    });
  }

  private generateContentModerationData(): ContentModerationData[] {
    const variance = () => Math.random() * 0.1 - 0.05; // ±5%

    return [
      { name: 'Approved', value: Math.floor(85 * (1 + variance())), color: '#4caf50' },
      { name: 'Pending', value: Math.floor(10 * (1 + variance())), color: '#ff9800' },
      { name: 'Rejected', value: Math.floor(5 * (1 + variance())), color: '#f44336' },
    ];
  }

  private generateRecentActivities(): ActivityItem[] {
    const users = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emma Wilson', 'Alex Brown'];
    const actions = [
      'Created new content',
      'Reported inappropriate content',
      'Upgraded to premium',
      'Account suspended',
      'Completed onboarding',
      'Updated profile',
      'Posted new comment',
      'Shared content',
    ];
    const severities: ActivityItem['severity'][] = ['info', 'warning', 'success', 'error'];

    return Array.from({ length: 8 }, (_, index) => ({
      id: index + 1,
      user: users[Math.floor(Math.random() * users.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      time: this.getRelativeTime(Date.now() - (index + 1) * 15 * 60 * 1000),
      severity: severities[Math.floor(Math.random() * severities.length)],
      metadata: {
        timestamp: Date.now() - (index + 1) * 15 * 60 * 1000,
      },
    }));
  }

  private generateSystemHealthData(): SystemHealth {
    const variance = () => Math.random() * 0.1 - 0.05; // ±5%

    return {
      apiResponseTime: {
        value: Math.floor(95 * (1 + variance())),
        status: 'excellent',
        trend: Math.floor(2 * (1 + variance())),
      },
      databasePerformance: {
        value: Math.floor(78 * (1 + variance())),
        status: 'good',
        trend: Math.floor(-1 * (1 + variance())),
      },
      serverUptime: {
        value: 99.9,
        status: 'excellent',
        upSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  private getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  private notifyDataUpdate(): void {
    // In a real app, you might use an event emitter or state management
    // to notify components that data has been updated
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dashboardDataUpdated'));
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;