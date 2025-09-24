import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, IconButton, Select, MenuItem, FormControl, InputLabel, Tooltip, Chip, Alert, LinearProgress, } from '@mui/material';
import { TrendingUp, TrendingDown, DollarSign, Users, CreditCard, RefreshCw, Download, AlertTriangle, } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { format } from 'date-fns';
// Custom metric card component
const MetricCard = ({ title, value, change, icon: Icon, color, trend, subtitle, loading = false }) => {
    const isPositive = change >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    return (_jsxs(Card, { sx: { height: '100%', position: 'relative', overflow: 'hidden' }, children: [loading && _jsx(LinearProgress, { sx: { position: 'absolute', top: 0, left: 0, right: 0 } }), _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "flex-start", children: [_jsxs(Box, { children: [_jsx(Typography, { color: "textSecondary", gutterBottom: true, variant: "overline", children: title }), _jsx(Typography, { variant: "h4", component: "div", fontWeight: "bold", children: value }), subtitle && (_jsx(Typography, { variant: "caption", color: "textSecondary", children: subtitle })), _jsxs(Box, { display: "flex", alignItems: "center", mt: 1, children: [_jsx(TrendIcon, { size: 16, color: isPositive ? '#10b981' : '#ef4444' }), _jsxs(Typography, { variant: "body2", color: isPositive ? 'success.main' : 'error.main', ml: 0.5, children: [Math.abs(change), "% vs last period"] })] })] }), _jsx(Box, { sx: {
                                    backgroundColor: `${color}20`,
                                    borderRadius: 2,
                                    p: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }, children: _jsx(Icon, { size: 24, color: color }) })] }), trend && (_jsx(Box, { mt: 2, height: 40, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsx(LineChart, { data: trend, children: _jsx(Line, { type: "monotone", dataKey: "value", stroke: color, strokeWidth: 2, dot: false }) }) }) }))] })] }));
};
// Main Financial Dashboard Component
export default function FinancialDashboard() {
    const [timeRange, setTimeRange] = useState('30d');
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedMetric, setSelectedMetric] = useState('revenue');
    // Fetch financial metrics
    const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
        queryKey: ['financial-metrics', timeRange, refreshKey],
        queryFn: async () => {
            const response = await apiClient.get(`/api/financial/metrics?range=${timeRange}`);
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
    // Fetch revenue analytics
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['revenue-analytics', timeRange],
        queryFn: async () => {
            const response = await apiClient.get(`/api/financial/revenue?range=${timeRange}`);
            return response.data;
        },
    });
    // Fetch subscription analytics
    const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
        queryKey: ['subscription-analytics', timeRange],
        queryFn: async () => {
            const response = await apiClient.get(`/api/financial/subscriptions/analytics?range=${timeRange}`);
            return response.data;
        },
    });
    // Fetch churn and retention data
    const { data: retentionData } = useQuery({
        queryKey: ['retention-analytics', timeRange],
        queryFn: async () => {
            const response = await apiClient.get(`/api/financial/retention?range=${timeRange}`);
            return response.data;
        },
    });
    // Generate mock trend data for metric cards
    const generateTrend = (baseValue, days = 7) => {
        return Array.from({ length: days }, (_, i) => ({
            day: i,
            value: baseValue * (1 + (Math.random() - 0.5) * 0.2),
        }));
    };
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        refetchMetrics();
    };
    const handleExport = () => {
        // Implement CSV export functionality
        const csvData = [
            ['Metric', 'Value', 'Change %'],
            ['MRR', metrics?.mrr || 0, metrics?.mrrChange || 0],
            ['ARR', metrics?.arr || 0, metrics?.arrChange || 0],
            ['Customers', metrics?.totalCustomers || 0, metrics?.customerChange || 0],
            ['ARPU', metrics?.arpu || 0, metrics?.arpuChange || 0],
        ];
        const csv = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };
    // Colors for charts
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return (_jsxs(Box, { sx: { flexGrow: 1, p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", children: "Financial Dashboard" }), _jsx(Typography, { variant: "body2", color: "textSecondary", children: "Real-time financial metrics and analytics" })] }), _jsxs(Box, { display: "flex", gap: 2, alignItems: "center", children: [_jsxs(FormControl, { size: "small", sx: { minWidth: 120 }, children: [_jsx(InputLabel, { children: "Time Range" }), _jsxs(Select, { value: timeRange, label: "Time Range", onChange: (e) => setTimeRange(e.target.value), children: [_jsx(MenuItem, { value: "7d", children: "Last 7 days" }), _jsx(MenuItem, { value: "30d", children: "Last 30 days" }), _jsx(MenuItem, { value: "90d", children: "Last 90 days" }), _jsx(MenuItem, { value: "1y", children: "Last year" })] })] }), _jsx(Tooltip, { title: "Refresh data", children: _jsx(IconButton, { onClick: handleRefresh, children: _jsx(RefreshCw, { size: 20 }) }) }), _jsx(Tooltip, { title: "Export data", children: _jsx(IconButton, { onClick: handleExport, children: _jsx(Download, { size: 20 }) }) })] })] }), metrics?.alerts && metrics.alerts.length > 0 && (_jsx(Box, { mb: 3, children: metrics.alerts.map((alert, index) => (_jsx(Alert, { severity: alert.severity, icon: _jsx(AlertTriangle, { size: 20 }), sx: { mb: 1 }, children: alert.message }, index))) })), _jsxs(Grid, { container: true, spacing: 3, mb: 3, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(MetricCard, { title: "Monthly Recurring Revenue", value: `$${(metrics?.mrr || 0).toLocaleString()}`, change: metrics?.mrrChange || 0, icon: DollarSign, color: "#3b82f6", trend: generateTrend(metrics?.mrr || 0), subtitle: "MRR", loading: metricsLoading }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(MetricCard, { title: "Annual Recurring Revenue", value: `$${(metrics?.arr || 0).toLocaleString()}`, change: metrics?.arrChange || 0, icon: TrendingUp, color: "#10b981", trend: generateTrend(metrics?.arr || 0), subtitle: "ARR", loading: metricsLoading }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(MetricCard, { title: "Total Customers", value: (metrics?.totalCustomers || 0).toLocaleString(), change: metrics?.customerChange || 0, icon: Users, color: "#f59e0b", trend: generateTrend(metrics?.totalCustomers || 0), subtitle: `${metrics?.newCustomers || 0} new this month`, loading: metricsLoading }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(MetricCard, { title: "Average Revenue Per User", value: `$${(metrics?.arpu || 0).toFixed(2)}`, change: metrics?.arpuChange || 0, icon: CreditCard, color: "#8b5cf6", trend: generateTrend(metrics?.arpu || 0), subtitle: "ARPU", loading: metricsLoading }) })] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, lg: 8, children: _jsxs(Paper, { sx: { p: 3, height: 400 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", children: "Revenue Trend" }), _jsx(Box, { display: "flex", gap: 1, children: ['revenue', 'subscriptions', 'transactions'].map(metric => (_jsx(Chip, { label: metric.charAt(0).toUpperCase() + metric.slice(1), onClick: () => setSelectedMetric(metric), color: selectedMetric === metric ? 'primary' : 'default', size: "small" }, metric))) })] }), _jsx(ResponsiveContainer, { width: "100%", height: "85%", children: _jsxs(AreaChart, { data: revenueData?.trend || [], children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorRevenue", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 12 }, tickFormatter: (value) => format(new Date(value), 'MMM dd') }), _jsx(YAxis, { tick: { fontSize: 12 }, tickFormatter: (value) => `$${(value / 1000).toFixed(0)}k` }), _jsx(RechartsTooltip, { formatter: (value) => `$${Number(value).toLocaleString()}`, labelFormatter: (label) => format(new Date(label), 'MMM dd, yyyy') }), _jsx(Area, { type: "monotone", dataKey: selectedMetric, stroke: "#3b82f6", strokeWidth: 2, fill: "url(#colorRevenue)" })] }) })] }) }), _jsx(Grid, { item: true, xs: 12, lg: 4, children: _jsxs(Paper, { sx: { p: 3, height: 400 }, children: [_jsx(Typography, { variant: "h6", mb: 2, children: "Subscription Distribution" }), _jsx(ResponsiveContainer, { width: "100%", height: "85%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: subscriptionData?.distribution || [], cx: "50%", cy: "50%", labelLine: false, label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`, outerRadius: 80, fill: "#8884d8", dataKey: "value", children: (subscriptionData?.distribution || []).map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(RechartsTooltip, {})] }) })] }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Paper, { sx: { p: 3, height: 400 }, children: [_jsx(Typography, { variant: "h6", mb: 2, children: "Churn & Retention Analysis" }), _jsx(ResponsiveContainer, { width: "100%", height: "85%", children: _jsxs(BarChart, { data: retentionData?.monthly || [], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 12 } }), _jsx(YAxis, { tick: { fontSize: 12 }, tickFormatter: (value) => `${value}%` }), _jsx(RechartsTooltip, { formatter: (value) => `${value}%` }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "retention", fill: "#10b981", name: "Retention Rate" }), _jsx(Bar, { dataKey: "churn", fill: "#ef4444", name: "Churn Rate" })] }) })] }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Paper, { sx: { p: 3, height: 400 }, children: [_jsx(Typography, { variant: "h6", mb: 2, children: "Customer Lifetime Value Analysis" }), _jsx(ResponsiveContainer, { width: "100%", height: "85%", children: _jsxs(RadarChart, { data: metrics?.ltvAnalysis || [], children: [_jsx(PolarGrid, { stroke: "#e5e7eb" }), _jsx(PolarAngleAxis, { dataKey: "segment", tick: { fontSize: 12 } }), _jsx(PolarRadiusAxis, { tick: { fontSize: 10 } }), _jsx(Radar, { name: "Current", dataKey: "current", stroke: "#3b82f6", fill: "#3b82f6", fillOpacity: 0.6 }), _jsx(Radar, { name: "Target", dataKey: "target", stroke: "#10b981", fill: "#10b981", fillOpacity: 0.3 }), _jsx(Legend, {})] }) })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsxs(Paper, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", children: "Recent Transactions" }), _jsx(Chip, { label: `${metrics?.todayTransactions || 0} today`, color: "primary", size: "small" })] }), _jsx(Box, { sx: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "Transaction ID" }), _jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "Customer" }), _jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "Type" }), _jsx("th", { style: { padding: '12px', textAlign: 'right' }, children: "Amount" }), _jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "Status" }), _jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "Date" })] }) }), _jsx("tbody", { children: (metrics?.recentTransactions || []).map((transaction, index) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '12px' }, children: transaction.id }), _jsx("td", { style: { padding: '12px' }, children: transaction.customer }), _jsx("td", { style: { padding: '12px' }, children: _jsx(Chip, { label: transaction.type, size: "small", color: transaction.type === 'subscription' ? 'primary' : 'default' }) }), _jsxs("td", { style: { padding: '12px', textAlign: 'right', fontWeight: 'bold' }, children: ["$", transaction.amount.toLocaleString()] }), _jsx("td", { style: { padding: '12px' }, children: _jsx(Chip, { label: transaction.status, size: "small", color: transaction.status === 'completed' ? 'success' : 'warning' }) }), _jsx("td", { style: { padding: '12px' }, children: format(new Date(transaction.date), 'MMM dd, yyyy') })] }, index))) })] }) })] }) })] })] }));
}
//# sourceMappingURL=FinancialDashboard.js.map