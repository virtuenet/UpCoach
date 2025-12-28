import { EventEmitter } from 'events';

/**
 * API Request Record
 */
export interface APIRequestRecord {
  keyId: string;
  userId: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number; // milliseconds
  requestSize: number; // bytes
  responseSize: number; // bytes
  ipAddress: string;
  userAgent: string;
  error?: string;
}

/**
 * Analytics Metrics
 */
export interface AnalyticsMetrics {
  totalRequests: number;
  successRate: number; // percentage
  averageResponseTime: number; // milliseconds
  p95ResponseTime: number; // milliseconds
  p99ResponseTime: number; // milliseconds
  requestsPerHour: number;
  topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
  statusCodeDistribution: Record<number, number>;
  errorRate: number; // percentage
  bandwidthUsed: number; // bytes
}

/**
 * Time Series Data Point
 */
export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
}

/**
 * APIAnalyticsService
 *
 * Tracks and analyzes API usage, performance, and errors.
 */
export class APIAnalyticsService extends EventEmitter {
  private static instance: APIAnalyticsService;
  private requests: APIRequestRecord[] = [];
  private readonly maxRecords = 100000; // Keep last 100k requests in memory

  private constructor() {
    super();
  }

  static getInstance(): APIAnalyticsService {
    if (!APIAnalyticsService.instance) {
      APIAnalyticsService.instance = new APIAnalyticsService();
    }
    return APIAnalyticsService.instance;
  }

  /**
   * Record API Request
   */
  async recordRequest(record: APIRequestRecord): Promise<void> {
    this.requests.push(record);

    // Trim old records
    if (this.requests.length > this.maxRecords) {
      this.requests = this.requests.slice(-this.maxRecords);
    }

    this.emit('analytics:request_recorded', {
      keyId: record.keyId,
      endpoint: record.endpoint,
      statusCode: record.statusCode,
      responseTime: record.responseTime,
    });
  }

  /**
   * Get Metrics for API Key
   */
  async getKeyMetrics(
    keyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    const records = this.getRecordsInRange(keyId, startDate, endDate);
    return this.calculateMetrics(records);
  }

  /**
   * Get Metrics for User
   */
  async getUserMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    const records = this.requests.filter(
      r =>
        r.userId === userId &&
        r.timestamp >= startDate &&
        r.timestamp <= endDate
    );
    return this.calculateMetrics(records);
  }

  /**
   * Get Time Series Data
   */
  async getTimeSeries(
    keyId: string,
    metric: 'requests' | 'responseTime' | 'errorRate',
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' = 'hour'
  ): Promise<TimeSeriesDataPoint[]> {
    const records = this.getRecordsInRange(keyId, startDate, endDate);

    const buckets = new Map<string, APIRequestRecord[]>();

    records.forEach(record => {
      const bucketKey = this.getBucketKey(record.timestamp, interval);
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(record);
    });

    const dataPoints: TimeSeriesDataPoint[] = [];

    buckets.forEach((bucketRecords, bucketKey) => {
      let value = 0;

      switch (metric) {
        case 'requests':
          value = bucketRecords.length;
          break;
        case 'responseTime':
          value =
            bucketRecords.reduce((sum, r) => sum + r.responseTime, 0) /
            bucketRecords.length;
          break;
        case 'errorRate':
          const errors = bucketRecords.filter(r => r.statusCode >= 400).length;
          value = (errors / bucketRecords.length) * 100;
          break;
      }

      dataPoints.push({
        timestamp: new Date(bucketKey),
        value,
      });
    });

    return dataPoints.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Get Top Endpoints
   */
  async getTopEndpoints(
    keyId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{ endpoint: string; count: number; avgResponseTime: number }>> {
    const records = this.getRecordsInRange(keyId, startDate, endDate);

    const endpointStats = new Map<
      string,
      { count: number; totalResponseTime: number }
    >();

    records.forEach(record => {
      if (!endpointStats.has(record.endpoint)) {
        endpointStats.set(record.endpoint, { count: 0, totalResponseTime: 0 });
      }
      const stats = endpointStats.get(record.endpoint)!;
      stats.count++;
      stats.totalResponseTime += record.responseTime;
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgResponseTime: stats.totalResponseTime / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get Error Analysis
   */
  async getErrorAnalysis(
    keyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalErrors: number;
    errorRate: number;
    errorsByStatusCode: Record<number, number>;
    errorsByEndpoint: Array<{ endpoint: string; count: number }>;
    commonErrors: Array<{ error: string; count: number }>;
  }> {
    const records = this.getRecordsInRange(keyId, startDate, endDate);
    const errors = records.filter(r => r.statusCode >= 400);

    const errorsByStatusCode: Record<number, number> = {};
    const errorsByEndpointMap = new Map<string, number>();
    const commonErrorsMap = new Map<string, number>();

    errors.forEach(error => {
      // Status code distribution
      errorsByStatusCode[error.statusCode] =
        (errorsByStatusCode[error.statusCode] || 0) + 1;

      // Endpoint distribution
      errorsByEndpointMap.set(
        error.endpoint,
        (errorsByEndpointMap.get(error.endpoint) || 0) + 1
      );

      // Common errors
      if (error.error) {
        commonErrorsMap.set(error.error, (commonErrorsMap.get(error.error) || 0) + 1);
      }
    });

    const errorsByEndpoint = Array.from(errorsByEndpointMap.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const commonErrors = Array.from(commonErrorsMap.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: errors.length,
      errorRate: (errors.length / records.length) * 100,
      errorsByStatusCode,
      errorsByEndpoint,
      commonErrors,
    };
  }

  /**
   * Get Performance Insights
   */
  async getPerformanceInsights(
    keyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    slowestEndpoints: Array<{ endpoint: string; avgResponseTime: number; count: number }>;
    p95ResponseTime: number;
    p99ResponseTime: number;
    performanceTrend: 'improving' | 'degrading' | 'stable';
  }> {
    const records = this.getRecordsInRange(keyId, startDate, endDate);

    // Group by endpoint
    const endpointStats = new Map<
      string,
      { totalResponseTime: number; count: number }
    >();

    records.forEach(record => {
      if (!endpointStats.has(record.endpoint)) {
        endpointStats.set(record.endpoint, { totalResponseTime: 0, count: 0 });
      }
      const stats = endpointStats.get(record.endpoint)!;
      stats.totalResponseTime += record.responseTime;
      stats.count++;
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.totalResponseTime / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);

    // Calculate percentiles
    const responseTimes = records.map(r => r.responseTime).sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    // Performance trend
    const midpoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
    const firstHalf = records.filter(r => r.timestamp < midpoint);
    const secondHalf = records.filter(r => r.timestamp >= midpoint);

    const firstHalfAvg =
      firstHalf.reduce((sum, r) => sum + r.responseTime, 0) / firstHalf.length || 0;
    const secondHalfAvg =
      secondHalf.reduce((sum, r) => sum + r.responseTime, 0) / secondHalf.length || 0;

    let performanceTrend: 'improving' | 'degrading' | 'stable';
    const diff = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (diff < -10) {
      performanceTrend = 'improving';
    } else if (diff > 10) {
      performanceTrend = 'degrading';
    } else {
      performanceTrend = 'stable';
    }

    return {
      slowestEndpoints,
      p95ResponseTime,
      p99ResponseTime,
      performanceTrend,
    };
  }

  /**
   * Get Bandwidth Usage
   */
  async getBandwidthUsage(
    keyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBandwidth: number;
    requestBandwidth: number;
    responseBandwidth: number;
    dailyUsage: Array<{ date: string; bandwidth: number }>;
  }> {
    const records = this.getRecordsInRange(keyId, startDate, endDate);

    const totalRequestSize = records.reduce((sum, r) => sum + r.requestSize, 0);
    const totalResponseSize = records.reduce((sum, r) => sum + r.responseSize, 0);

    // Daily usage
    const dailyUsageMap = new Map<string, number>();
    records.forEach(record => {
      const date = record.timestamp.toISOString().split('T')[0];
      const bandwidth = record.requestSize + record.responseSize;
      dailyUsageMap.set(date, (dailyUsageMap.get(date) || 0) + bandwidth);
    });

    const dailyUsage = Array.from(dailyUsageMap.entries())
      .map(([date, bandwidth]) => ({ date, bandwidth }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalBandwidth: totalRequestSize + totalResponseSize,
      requestBandwidth: totalRequestSize,
      responseBandwidth: totalResponseSize,
      dailyUsage,
    };
  }

  /**
   * Calculate Metrics
   */
  private calculateMetrics(records: APIRequestRecord[]): AnalyticsMetrics {
    if (records.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        requestsPerHour: 0,
        topEndpoints: [],
        statusCodeDistribution: {},
        errorRate: 0,
        bandwidthUsed: 0,
      };
    }

    const successfulRequests = records.filter(
      r => r.statusCode >= 200 && r.statusCode < 300
    ).length;

    const responseTimes = records.map(r => r.responseTime).sort((a, b) => a - b);
    const averageResponseTime =
      records.reduce((sum, r) => sum + r.responseTime, 0) / records.length;
    const p95Index = Math.floor(records.length * 0.95);
    const p99Index = Math.floor(records.length * 0.99);

    // Calculate requests per hour
    const timeRange =
      (records[records.length - 1].timestamp.getTime() -
        records[0].timestamp.getTime()) /
      (1000 * 60 * 60);
    const requestsPerHour = timeRange > 0 ? records.length / timeRange : 0;

    // Top endpoints
    const endpointCounts = new Map<string, { count: number; totalResponseTime: number }>();
    records.forEach(r => {
      if (!endpointCounts.has(r.endpoint)) {
        endpointCounts.set(r.endpoint, { count: 0, totalResponseTime: 0 });
      }
      const stats = endpointCounts.get(r.endpoint)!;
      stats.count++;
      stats.totalResponseTime += r.responseTime;
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgResponseTime: stats.totalResponseTime / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Status code distribution
    const statusCodeDistribution: Record<number, number> = {};
    records.forEach(r => {
      statusCodeDistribution[r.statusCode] = (statusCodeDistribution[r.statusCode] || 0) + 1;
    });

    const errors = records.filter(r => r.statusCode >= 400).length;
    const bandwidthUsed = records.reduce(
      (sum, r) => sum + r.requestSize + r.responseSize,
      0
    );

    return {
      totalRequests: records.length,
      successRate: (successfulRequests / records.length) * 100,
      averageResponseTime,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      requestsPerHour,
      topEndpoints,
      statusCodeDistribution,
      errorRate: (errors / records.length) * 100,
      bandwidthUsed,
    };
  }

  /**
   * Get Records in Range
   */
  private getRecordsInRange(
    keyId: string,
    startDate: Date,
    endDate: Date
  ): APIRequestRecord[] {
    return this.requests.filter(
      r => r.keyId === keyId && r.timestamp >= startDate && r.timestamp <= endDate
    );
  }

  /**
   * Get Bucket Key for Time Series
   */
  private getBucketKey(timestamp: Date, interval: 'hour' | 'day'): string {
    if (interval === 'hour') {
      const date = new Date(timestamp);
      date.setMinutes(0, 0, 0);
      return date.toISOString();
    } else {
      return timestamp.toISOString().split('T')[0];
    }
  }
}

export const apiAnalyticsService = APIAnalyticsService.getInstance();
