import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Performance Monitoring Dashboard Component
 * Real-time performance metrics and alerts display
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Activity, Clock, RefreshCw } from 'lucide-react';
export const PerformanceMonitor = () => {
    const [summary, setSummary] = useState(null);
    const [alerts, setAlerts] = useState([]);
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
        }
        catch (error) {
            console.error('Failed to fetch performance data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchPerformanceData();
    }, [timeRange]);
    useEffect(() => {
        if (!autoRefresh)
            return;
        const interval = setInterval(fetchPerformanceData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [autoRefresh, timeRange]);
    const getMetricStatus = (metricName, value) => {
        const thresholds = {
            FCP: { good: 1800, poor: 3000 },
            LCP: { good: 2500, poor: 4000 },
            CLS: { good: 0.1, poor: 0.25 },
            FID: { good: 100, poor: 300 },
            TTFB: { good: 800, poor: 1800 }
        };
        const threshold = thresholds[metricName];
        if (!threshold)
            return 'unknown';
        if (value <= threshold.good)
            return 'good';
        if (value <= threshold.poor)
            return 'needs-improvement';
        return 'poor';
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'good': return 'text-green-600 bg-green-100';
            case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
            case 'poor': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    const getPerformanceScoreColor = (score) => {
        if (score >= 90)
            return 'text-green-600';
        if (score >= 50)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    const formatMetricValue = (metricName, value) => {
        if (metricName === 'CLS') {
            return value.toFixed(3);
        }
        return `${Math.round(value)}ms`;
    };
    if (loading && !summary) {
        return (_jsxs("div", { className: "flex items-center justify-center p-8", children: [_jsx(RefreshCw, { className: "h-6 w-6 animate-spin mr-2" }), _jsx("span", { children: "Loading performance data..." })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Performance Monitor" }), _jsx("p", { className: "text-gray-600", children: "Real-time Core Web Vitals and performance metrics" })] }), _jsx("div", { className: "flex items-center gap-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: autoRefresh ? "primary" : "outline", size: "sm", onClick: () => setAutoRefresh(!autoRefresh), children: [_jsx(Activity, { className: "h-4 w-4 mr-1" }), "Auto-refresh"] }), _jsx(Button, { variant: "outline", size: "sm", onClick: fetchPerformanceData, disabled: loading, children: _jsx(RefreshCw, { className: `h-4 w-4 ${loading ? 'animate-spin' : ''}` }) })] }) })] }), alerts.length > 0 && (_jsx("div", { className: "space-y-2", children: alerts.slice(0, 3).map((alert, index) => (_jsxs(Alert, { className: alert.severity === 'high' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50', children: [_jsx(AlertTriangle, { className: "h-4 w-4" }), _jsxs(AlertTitle, { className: "capitalize", children: [alert.severity, " Priority"] }), _jsx(AlertDescription, { children: alert.message })] }, index))) })), _jsxs(Tabs, { value: timeRange, onValueChange: setTimeRange, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "1h", children: "Last Hour" }), _jsx(TabsTrigger, { value: "24h", children: "Last 24 Hours" }), _jsx(TabsTrigger, { value: "7d", children: "Last 7 Days" })] }), _jsxs(TabsContent, { value: timeRange, className: "space-y-6", children: [summary && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-gray-600", children: "Performance Score" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: `text-3xl font-bold ${getPerformanceScoreColor(summary.performanceScore)}`, children: [summary.performanceScore, "/100"] }), _jsx("p", { className: "text-sm text-gray-500", children: summary.performanceScore >= 90 ? 'Excellent' :
                                                                    summary.performanceScore >= 50 ? 'Good' : 'Needs Improvement' })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-gray-600", children: "Total Reports" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-3xl font-bold", children: summary.totalReports }), _jsx("p", { className: "text-sm text-gray-500", children: "Performance measurements" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-gray-600", children: "Issues" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: `text-3xl font-bold ${summary.issuesCount > 0 ? 'text-red-600' : 'text-green-600'}`, children: summary.issuesCount }), _jsx("p", { className: "text-sm text-gray-500", children: "Performance violations" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-gray-600", children: "Alerts" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: `text-3xl font-bold ${alerts.length > 0 ? 'text-yellow-600' : 'text-green-600'}`, children: alerts.length }), _jsx("p", { className: "text-sm text-gray-500", children: "Active alerts" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Core Web Vitals" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: summary.averageMetrics && Object.entries(summary.averageMetrics).map(([metric, value]) => {
                                                        const status = getMetricStatus(metric, value);
                                                        return (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-sm font-medium text-gray-600 mb-1", children: metric }), _jsx("div", { className: "text-2xl font-bold mb-1", children: formatMetricValue(metric, value) }), _jsx(Badge, { className: getStatusColor(status), children: status })] }, metric));
                                                    }) }) })] }), summary.pageBreakdown && summary.pageBreakdown.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Page Performance Breakdown" }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left py-2", children: "Page" }), _jsx("th", { className: "text-center py-2", children: "FCP" }), _jsx("th", { className: "text-center py-2", children: "LCP" }), _jsx("th", { className: "text-center py-2", children: "CLS" }), _jsx("th", { className: "text-center py-2", children: "Samples" })] }) }), _jsx("tbody", { children: summary.pageBreakdown.map((page, index) => (_jsxs("tr", { className: "border-b", children: [_jsx("td", { className: "py-2 font-medium", children: page.page }), _jsx("td", { className: "py-2 text-center", children: page.averageFCP ? `${Math.round(page.averageFCP)}ms` : '-' }), _jsx("td", { className: "py-2 text-center", children: page.averageLCP ? `${Math.round(page.averageLCP)}ms` : '-' }), _jsx("td", { className: "py-2 text-center", children: page.averageCLS ? page.averageCLS.toFixed(3) : '-' }), _jsx("td", { className: "py-2 text-center", children: page.sampleSize })] }, index))) })] }) }) })] }))] })), !summary && (_jsx(Card, { children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx(Clock, { className: "h-12 w-12 mx-auto text-gray-400 mb-4" }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No Performance Data" }), _jsx("p", { className: "text-gray-500", children: "No performance reports received in the selected time range. Make sure performance monitoring is enabled on your applications." })] }) }))] })] })] }));
};
//# sourceMappingURL=PerformanceMonitor.js.map