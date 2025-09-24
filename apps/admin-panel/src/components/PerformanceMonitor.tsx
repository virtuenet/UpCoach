/**
 * Performance Monitoring Dashboard Component
 * Real-time performance metrics and alerts display
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@upcoach/ui';
import { Badge } from '@upcoach/ui';
import { Alert, AlertDescription, AlertTitle } from '@upcoach/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@upcoach/ui';
import { Button } from '@upcoach/ui';
import { 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetrics {
  FCP: number;
  LCP: number;
  CLS: number;
  FID: number;
  TTFB: number;
}

interface PerformanceAlert {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  details: any;
}

interface PerformanceSummary {
  totalReports: number;
  averageMetrics: PerformanceMetrics;
  performanceScore: number;
  issuesCount: number;
  timeRange: string;
  pageBreakdown: Array<{
    page: string;
    averageFCP: number;
    averageLCP: number;
    averageCLS: number;
    sampleSize: number;
  }>;
}

export const PerformanceMonitor: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch performance summary
      const summaryResponse = await fetch(`/api/analytics/performance/summary?timeRange=${timeRange}`);
      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary);

      // Fetch alerts
      const alertsResponse = await fetch('/api/analytics/performance/alerts');
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts || []);

    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPerformanceData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

  const getMetricStatus = (metricName: string, value: number) => {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatMetricValue = (metricName: string, value: number) => {
    if (metricName === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-gray-600">Real-time Core Web Vitals and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "primary" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="h-4 w-4 mr-1" />
              Auto-refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPerformanceData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert, index) => (
            <Alert key={index} className={alert.severity === 'high' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="capitalize">{alert.severity} Priority</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs value={timeRange} onValueChange={setTimeRange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="1h">Last Hour</TabsTrigger>
          <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
          <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-6">
          {summary && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Performance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getPerformanceScoreColor(summary.performanceScore)}`}>
                      {summary.performanceScore}/100
                    </div>
                    <p className="text-sm text-gray-500">
                      {summary.performanceScore >= 90 ? 'Excellent' : 
                       summary.performanceScore >= 50 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.totalReports}</div>
                    <p className="text-sm text-gray-500">Performance measurements</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${summary.issuesCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {summary.issuesCount}
                    </div>
                    <p className="text-sm text-gray-500">Performance violations</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${alerts.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {alerts.length}
                    </div>
                    <p className="text-sm text-gray-500">Active alerts</p>
                  </CardContent>
                </Card>
              </div>

              {/* Core Web Vitals */}
              <Card>
                <CardHeader>
                  <CardTitle>Core Web Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {summary.averageMetrics && Object.entries(summary.averageMetrics).map(([metric, value]) => {
                      const status = getMetricStatus(metric, value);
                      return (
                        <div key={metric} className="text-center">
                          <div className="text-sm font-medium text-gray-600 mb-1">{metric}</div>
                          <div className="text-2xl font-bold mb-1">
                            {formatMetricValue(metric, value)}
                          </div>
                          <Badge className={getStatusColor(status)}>
                            {status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Page Breakdown */}
              {summary.pageBreakdown && summary.pageBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Page Performance Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Page</th>
                            <th className="text-center py-2">FCP</th>
                            <th className="text-center py-2">LCP</th>
                            <th className="text-center py-2">CLS</th>
                            <th className="text-center py-2">Samples</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.pageBreakdown.map((page, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 font-medium">{page.page}</td>
                              <td className="py-2 text-center">
                                {page.averageFCP ? `${Math.round(page.averageFCP)}ms` : '-'}
                              </td>
                              <td className="py-2 text-center">
                                {page.averageLCP ? `${Math.round(page.averageLCP)}ms` : '-'}
                              </td>
                              <td className="py-2 text-center">
                                {page.averageCLS ? page.averageCLS.toFixed(3) : '-'}
                              </td>
                              <td className="py-2 text-center">{page.sampleSize}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!summary && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Performance Data</h3>
                <p className="text-gray-500">
                  No performance reports received in the selected time range.
                  Make sure performance monitoring is enabled on your applications.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};