import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Card, CardContent, Typography, Chip, LinearProgress, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, IconButton, Tooltip, Skeleton, } from '@mui/material';
import { lazy, Suspense, useMemo, useCallback, useState } from 'react';
import { TrendingUp, TrendingDown, People, ContentCopy, Security, AttachMoney, Warning, CheckCircle, MoreVert, Refresh, } from '@mui/icons-material';
// Lazy load heavy chart components for better performance
const LazyBarChart = lazy(() => import('recharts').then(module => ({
    default: ({ data, ...props }) => {
        const { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } = module;
        return (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: data, ...props, "aria-label": "User growth and activity bar chart", role: "img", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", "aria-hidden": "true" }), _jsx(XAxis, { dataKey: "month", "aria-label": "Month" }), _jsx(YAxis, { "aria-label": "Number of users" }), _jsx(Tooltip, { formatter: (value, name) => [
                            value,
                            name === 'users' ? 'Total Users' : 'Active Users'
                        ], labelFormatter: (label) => `Month: ${label}` }), _jsx(Legend, { wrapperStyle: { paddingTop: '20px' } }), _jsx(Bar, { dataKey: "users", fill: "#1976d2", name: "Total Users", "aria-label": "Total users data" }), _jsx(Bar, { dataKey: "active", fill: "#42a5f5", name: "Active Users", "aria-label": "Active users data" })] }) }));
    }
})));
const LazyLineChart = lazy(() => import('recharts').then(module => ({
    default: ({ data, ...props }) => {
        const { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } = module;
        return (_jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(LineChart, { data: data, ...props, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month" }), _jsx(YAxis, {}), _jsx(Line, { type: "monotone", dataKey: "users", stroke: "#1976d2", strokeWidth: 2 })] }) }));
    }
})));
const LazyPieChart = lazy(() => import('recharts').then(module => ({
    default: ({ data, ...props }) => {
        const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = module;
        return (_jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(PieChart, { ...props, "aria-label": "Content moderation status pie chart", role: "img", children: [_jsx(Pie, { data: data, cx: "50%", cy: "50%", innerRadius: 40, outerRadius: 80, paddingAngle: 5, dataKey: "value", "aria-label": "Content moderation distribution", children: data.map((entry, index) => (_jsx(Cell, { fill: entry.color, "aria-label": `${entry.name}: ${entry.value}%` }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value, name) => [`${value}%`, name] }), _jsx(Legend, { wrapperStyle: { paddingTop: '10px' } })] }) }));
    }
})));
// Skeleton components for better loading UX
const ChartSkeleton = ({ height = 300 }) => (_jsxs(Box, { sx: { width: '100%', height }, role: "status", "aria-label": "Chart loading", "aria-live": "polite", children: [_jsx(Skeleton, { variant: "rectangular", width: "100%", height: "80%", "aria-hidden": "true" }), _jsx(Skeleton, { variant: "text", width: "60%", sx: { mt: 1 }, "aria-hidden": "true" }), _jsx(Skeleton, { variant: "text", width: "40%", "aria-hidden": "true" }), _jsx("span", { className: "sr-only", children: "Loading chart data..." })] }));
const StatCardSkeleton = () => (_jsx(Card, { role: "status", "aria-label": "Statistics card loading", children: _jsxs(CardContent, { children: [_jsx(Skeleton, { variant: "text", width: "60%", "aria-hidden": "true" }), _jsx(Skeleton, { variant: "text", width: "40%", height: 40, "aria-hidden": "true" }), _jsx(Skeleton, { variant: "text", width: "80%", "aria-hidden": "true" }), _jsx("span", { className: "sr-only", children: "Loading statistics..." })] }) }));
// Mock data for dashboard
const userGrowthData = [
    { month: 'Jan', users: 1200, active: 980 },
    { month: 'Feb', users: 1350, active: 1100 },
    { month: 'Mar', users: 1500, active: 1200 },
    { month: 'Apr', users: 1680, active: 1350 },
    { month: 'May', users: 1850, active: 1480 },
    { month: 'Jun', users: 2100, active: 1680 },
];
const contentModerationData = [
    { name: 'Approved', value: 85, color: '#4caf50' },
    { name: 'Pending', value: 10, color: '#ff9800' },
    { name: 'Rejected', value: 5, color: '#f44336' },
];
const recentActivities = [
    { id: 1, user: 'John Smith', action: 'Created new content', time: '2 minutes ago', severity: 'info' },
    { id: 2, user: 'Sarah Johnson', action: 'Reported inappropriate content', time: '15 minutes ago', severity: 'warning' },
    { id: 3, user: 'Mike Davis', action: 'Upgraded to premium', time: '1 hour ago', severity: 'success' },
    { id: 4, user: 'Emma Wilson', action: 'Account suspended', time: '2 hours ago', severity: 'error' },
    { id: 5, user: 'Alex Brown', action: 'Completed onboarding', time: '3 hours ago', severity: 'info' },
];
function StatsCard({ title, value, subtitle, trend, icon, color }) {
    const trendDirection = trend && trend > 0 ? 'increased' : 'decreased';
    const trendAnnouncement = trend ? `${title} has ${trendDirection} by ${Math.abs(trend)} percent` : '';
    return (_jsx(Card, { sx: { height: '100%' }, role: "region", "aria-labelledby": `stats-${title.replace(/\s+/g, '-').toLowerCase()}-title`, "aria-describedby": `stats-${title.replace(/\s+/g, '-').toLowerCase()}-value`, children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }, children: [_jsx(Avatar, { sx: { bgcolor: `${color}.main`, color: 'white' }, "aria-hidden": "true", children: icon }), trend && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 0.5 }, role: "img", "aria-label": trendAnnouncement, children: [trend > 0 ? (_jsx(TrendingUp, { sx: { color: 'success.main', fontSize: 16 }, "aria-hidden": "true" })) : (_jsx(TrendingDown, { sx: { color: 'error.main', fontSize: 16 }, "aria-hidden": "true" })), _jsxs(Typography, { variant: "caption", sx: {
                                        color: trend > 0 ? 'success.main' : 'error.main',
                                        fontWeight: 600,
                                    }, "aria-label": `${Math.abs(trend)} percent ${trendDirection}`, children: [Math.abs(trend), "%"] })] }))] }), _jsx(Typography, { variant: "h4", sx: { fontWeight: 700, mb: 0.5 }, id: `stats-${title.replace(/\s+/g, '-').toLowerCase()}-value`, "aria-live": "polite", children: value }), _jsx(Typography, { variant: "body2", color: "text.secondary", id: `stats-${title.replace(/\s+/g, '-').toLowerCase()}-title`, children: title }), subtitle && (_jsx(Typography, { variant: "caption", color: "text.secondary", "aria-label": `Additional info: ${subtitle}`, children: subtitle }))] }) }));
}
export default function DashboardPage() {
    // State for dashboard functionality
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Mock dashboard data
    const dashboardData = {
        userStats: {
            totalUsers: 2100,
            activeUsers: 1680,
            growth: 12
        },
        contentStats: {
            totalContent: 450,
            pendingModeration: 23,
            moderationRate: 97,
            approvedToday: 12,
            trend: -3
        },
        financialStats: {
            revenue: 12450,
            growth: 15
        },
        securityStats: {
            alerts: 5,
            resolved: 95,
            trend: 8
        }
    };
    // Memoize heavy data processing
    const memoizedUserGrowthData = useMemo(() => userGrowthData, []);
    const memoizedContentModerationData = useMemo(() => contentModerationData, []);
    const memoizedRecentActivities = useMemo(() => recentActivities, []);
    // Handler for toggling auto-refresh
    const handleToggleAutoRefresh = useCallback(() => {
        setAutoRefresh(prev => !prev);
    }, []);
    // Memoize refresh handler to prevent unnecessary re-renders
    const handleRefresh = useCallback(() => {
        setIsLoading(true);
        // TODO: Implement actual data refresh
        console.log('Refreshing dashboard data...');
        setTimeout(() => setIsLoading(false), 1000);
    }, []);
    return (_jsxs(Box, { role: "main", "aria-labelledby": "dashboard-title", children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }, children: [_jsx(Typography, { variant: "h4", sx: { fontWeight: 600 }, id: "dashboard-title", component: "h1", children: "System Overview" }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Tooltip, { title: autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh', children: _jsx(Chip, { label: autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF', color: autoRefresh ? 'success' : 'default', variant: autoRefresh ? 'filled' : 'outlined', onClick: handleToggleAutoRefresh, size: "small" }) }), _jsx(Tooltip, { title: "Refresh dashboard data", children: _jsx(IconButton, { onClick: handleRefresh, disabled: isLoading, "aria-label": "Refresh dashboard data", size: "large", sx: {
                                        animation: isLoading ? 'spin 1s linear infinite' : 'none',
                                        '@keyframes spin': {
                                            '0%': { transform: 'rotate(0deg)' },
                                            '100%': { transform: 'rotate(360deg)' },
                                        },
                                    }, children: _jsx(Refresh, {}) }) })] })] }), _jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 3 }, role: "region", "aria-labelledby": "stats-section", children: [_jsx("div", { style: { display: 'none' }, id: "stats-section", children: "Key Performance Indicators" }), _jsx(Box, { sx: { flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }, children: _jsx(StatsCard, { title: "Total Users", value: dashboardData.userStats.totalUsers.toLocaleString(), subtitle: `Active users: ${dashboardData.userStats.activeUsers.toLocaleString()}`, trend: dashboardData.userStats.growth, icon: _jsx(People, {}), color: "primary" }) }), _jsx(Box, { sx: { flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }, children: _jsx(StatsCard, { title: "Pending Moderation", value: dashboardData.contentStats.pendingModeration.toString(), subtitle: "Requires attention", trend: dashboardData.contentStats.moderationRate - 95, icon: _jsx(Security, {}), color: "warning" }) }), _jsx(Box, { sx: { flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }, children: _jsx(StatsCard, { title: "Monthly Revenue", value: `$${dashboardData.financialStats.revenue.toLocaleString()}`, subtitle: "vs last month", trend: dashboardData.financialStats.growth, icon: _jsx(AttachMoney, {}), color: "success" }) }), _jsx(Box, { sx: { flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }, children: _jsx(StatsCard, { title: "Content Items", value: dashboardData.contentStats.totalContent.toLocaleString(), subtitle: `Approved today: ${dashboardData.contentStats.approvedToday}`, trend: Math.round((dashboardData.contentStats.approvedToday / dashboardData.contentStats.totalContent) * 1000) / 10, icon: _jsx(ContentCopy, {}), color: "info" }) }), _jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }, role: "region", "aria-labelledby": "charts-section", children: [_jsx("div", { style: { display: 'none' }, id: "charts-section", children: "Data Visualization Charts" }), _jsx(Box, { sx: { flex: { xs: '1 1 100%', md: '1 1 65%' } }, children: _jsx(Card, { role: "region", "aria-labelledby": "user-growth-title", "aria-describedby": "user-growth-description", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, id: "user-growth-title", component: "h2", children: "User Growth & Activity" }), _jsx("div", { id: "user-growth-description", className: "sr-only", children: "Bar chart showing user growth and activity over the past 6 months" }), _jsx(Suspense, { fallback: _jsx(ChartSkeleton, { height: 300 }), children: _jsx("div", { role: "img", "aria-labelledby": "user-growth-title", "aria-describedby": "user-growth-description", children: _jsx(LazyBarChart, { data: memoizedUserGrowthData }) }) })] }) }) }), _jsx(Box, { sx: { flex: { xs: '1 1 100%', md: '1 1 30%' } }, children: _jsx(Card, { role: "region", "aria-labelledby": "moderation-title", "aria-describedby": "moderation-description", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, id: "moderation-title", component: "h2", children: "Content Moderation" }), _jsx("div", { id: "moderation-description", className: "sr-only", children: "Pie chart showing content moderation status distribution: approved, pending, and rejected content" }), _jsx(Suspense, { fallback: _jsx(ChartSkeleton, { height: 300 }), children: _jsx("div", { role: "img", "aria-labelledby": "moderation-title", "aria-describedby": "moderation-description", children: _jsx(LazyPieChart, { data: memoizedContentModerationData }) }) }), _jsx(Box, { sx: { mt: 2 }, role: "list", "aria-label": "Content moderation legend", children: memoizedContentModerationData.map((item, index) => (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 1 }, role: "listitem", children: [_jsx(Box, { sx: {
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: '50%',
                                                                bgcolor: item.color,
                                                                mr: 1,
                                                            }, role: "img", "aria-label": `${item.name} indicator color` }), _jsxs(Typography, { variant: "body2", "aria-label": `${item.name} represents ${item.value} percent of content`, children: [item.name, ": ", item.value, "%"] })] }, index))) })] }) }) })] }), _jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }, role: "region", "aria-labelledby": "health-activity-section", children: [_jsx("div", { style: { display: 'none' }, id: "health-activity-section", children: "System Health and Recent Activity" }), _jsx(Box, { sx: { flex: { xs: '1 1 100%', md: '1 1 45%' } }, children: _jsx(Card, { role: "region", "aria-labelledby": "system-health-title", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, id: "system-health-title", component: "h2", children: "System Health" }), _jsxs(Box, { sx: { mb: 3 }, role: "group", "aria-labelledby": "api-response-label", children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "body2", id: "api-response-label", component: "h3", children: "API Response Time" }), _jsx(Chip, { label: "Excellent", color: "success", size: "small", icon: _jsx(CheckCircle, { "aria-hidden": "true" }), "aria-label": "API Response Time status: Excellent" })] }), _jsx(LinearProgress, { variant: "determinate", value: 95, sx: { height: 8, borderRadius: 4 }, color: "success", "aria-label": "API Response Time: 95 percent excellent", role: "progressbar", "aria-valuenow": 95, "aria-valuemin": 0, "aria-valuemax": 100 })] }), _jsxs(Box, { sx: { mb: 3 }, role: "group", "aria-labelledby": "db-performance-label", children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "body2", id: "db-performance-label", component: "h3", children: "Database Performance" }), _jsx(Chip, { label: "Good", color: "warning", size: "small", icon: _jsx(Warning, { "aria-hidden": "true" }), "aria-label": "Database Performance status: Good with warnings" })] }), _jsx(LinearProgress, { variant: "determinate", value: 78, sx: { height: 8, borderRadius: 4 }, color: "warning", "aria-label": "Database Performance: 78 percent good", role: "progressbar", "aria-valuenow": 78, "aria-valuemin": 0, "aria-valuemax": 100 })] }), _jsxs(Box, { role: "group", "aria-labelledby": "server-uptime-label", children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "body2", id: "server-uptime-label", component: "h3", children: "Server Uptime" }), _jsx(Chip, { label: "99.9%", color: "success", size: "small", icon: _jsx(CheckCircle, { "aria-hidden": "true" }), "aria-label": "Server Uptime: 99.9 percent excellent" })] }), _jsx(LinearProgress, { variant: "determinate", value: 99.9, sx: { height: 8, borderRadius: 4 }, color: "success", "aria-label": "Server Uptime: 99.9 percent excellent", role: "progressbar", "aria-valuenow": 99.9, "aria-valuemin": 0, "aria-valuemax": 100 })] })] }) }) }), _jsx(Box, { sx: { flex: { xs: '1 1 100%', md: '1 1 45%' } }, children: _jsx(Card, { role: "region", "aria-labelledby": "recent-activity-title", children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }, children: [_jsx(Typography, { variant: "h6", id: "recent-activity-title", component: "h2", children: "Recent Activity" }), _jsx(Tooltip, { title: "More activity options", children: _jsx(IconButton, { size: "small", "aria-label": "More activity options", children: _jsx(MoreVert, {}) }) })] }), _jsx(List, { sx: { maxHeight: 300, overflow: 'auto' }, role: "log", "aria-label": "Recent user activities", "aria-live": "polite", children: memoizedRecentActivities.map((activity, index) => (_jsxs(Box, { children: [_jsxs(ListItem, { alignItems: "flex-start", sx: { px: 0 }, role: "listitem", children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: {
                                                                            bgcolor: activity.severity === 'error'
                                                                                ? 'error.main'
                                                                                : activity.severity === 'warning'
                                                                                    ? 'warning.main'
                                                                                    : activity.severity === 'success'
                                                                                        ? 'success.main'
                                                                                        : 'info.main',
                                                                            width: 32,
                                                                            height: 32,
                                                                            fontSize: '0.75rem',
                                                                        }, "aria-label": `${activity.user} profile`, children: activity.user.split(' ').map(n => n[0]).join('') }) }), _jsx(ListItemText, { primary: activity.action, secondary: `${activity.user} • ${activity.time}`, primaryTypographyProps: {
                                                                        variant: 'body2',
                                                                        'aria-label': `Activity: ${activity.action}`
                                                                    }, secondaryTypographyProps: {
                                                                        variant: 'caption',
                                                                        'aria-label': `By ${activity.user}, ${activity.time}`
                                                                    } })] }), index < recentActivities.length - 1 && (_jsx(Divider, { "aria-hidden": "true", role: "separator" }))] }, activity.id))) })] }) }) })] })] })] }));
}
//# sourceMappingURL=DashboardPage.js.map