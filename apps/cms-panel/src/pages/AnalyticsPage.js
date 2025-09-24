import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Eye, Users, Clock, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, subDays } from 'date-fns';
const StatCard = ({ title, value, change, icon: Icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        orange: 'bg-orange-50 text-orange-600 border-orange-200',
        red: 'bg-red-50 text-red-600 border-red-200',
    };
    const isPositive = change >= 0;
    return (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: title }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: value })] }), _jsx("div", { className: `p-3 rounded-lg border ${colorClasses[color]}`, children: _jsx(Icon, { className: "h-6 w-6" }) })] }), _jsxs("div", { className: "mt-4 flex items-center", children: [_jsxs("div", { className: `flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`, children: [isPositive ? (_jsx(ArrowUp, { className: "h-4 w-4 mr-1" })) : (_jsx(ArrowDown, { className: "h-4 w-4 mr-1" })), _jsxs("span", { className: "text-sm font-medium", children: [Math.abs(change), "%"] })] }), _jsx("span", { className: "text-sm text-gray-500 ml-2", children: "vs last period" })] })] }));
};
export default function AnalyticsPage() {
    const [timeframe, setTimeframe] = useState('month');
    const [contentType, setContentType] = useState('all');
    // Mock data - in production would come from API
    const dashboardData = {
        totalArticles: 125,
        totalCourses: 23,
        totalViews: 45670,
        activeLearners: 2840,
        articlesGrowth: 12.5,
        coursesGrowth: 8.3,
        viewsGrowth: 18.7,
        learnersGrowth: 6.2,
    };
    // Fetch analytics data
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['content-analytics', timeframe, contentType],
        queryFn: () => {
            // Mock analytics data
            return Promise.resolve({
                totalViews: 45670,
                uniqueUsers: 12430,
                averageReadTime: 285,
                completionRate: 72.5,
                engagementScore: 85.2,
                topReferrers: ['Google', 'Direct', 'Social Media', 'Email'],
                deviceBreakdown: {
                    Desktop: 45,
                    Mobile: 35,
                    Tablet: 20,
                },
                locationBreakdown: {
                    'United States': 35,
                    'United Kingdom': 15,
                    Canada: 12,
                    Australia: 10,
                    Other: 28,
                },
            });
        },
    });
    // Mock trend data
    const viewsTrendData = Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(new Date(), 29 - i), 'MMM dd'),
        views: Math.floor(Math.random() * 2000) + 1000,
        uniqueUsers: Math.floor(Math.random() * 800) + 400,
    }));
    const contentPerformanceData = [
        { name: 'Week 1', articles: 45, courses: 12, engagement: 85 },
        { name: 'Week 2', articles: 52, courses: 15, engagement: 88 },
        { name: 'Week 3', articles: 48, courses: 18, engagement: 82 },
        { name: 'Week 4', articles: 61, courses: 22, engagement: 91 },
    ];
    const topContentData = [
        { title: 'Effective Leadership Strategies', views: 12500, readTime: 8.5, engagement: 92 },
        { title: 'Productivity Hacks for Managers', views: 9800, readTime: 6.2, engagement: 87 },
        { title: 'Building High-Performance Teams', views: 8600, readTime: 12.1, engagement: 89 },
        { title: 'Communication Skills Masterclass', views: 7200, readTime: 15.3, engagement: 85 },
        { title: 'Time Management Fundamentals', views: 6900, readTime: 7.8, engagement: 83 },
    ];
    const deviceData = analytics
        ? Object.entries(analytics.deviceBreakdown).map(([device, percentage]) => ({
            name: device,
            value: percentage,
            fill: device === 'Desktop' ? '#3B82F6' : device === 'Mobile' ? '#10B981' : '#F59E0B',
        }))
        : [];
    // const _COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Content Analytics" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Track performance and engagement across your content" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("select", { value: timeframe, onChange: e => setTimeframe(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "week", children: "Last Week" }), _jsx("option", { value: "month", children: "Last Month" }), _jsx("option", { value: "quarter", children: "Last Quarter" })] }), _jsxs("select", { value: contentType, onChange: e => setContentType(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "all", children: "All Content" }), _jsx("option", { value: "article", children: "Articles Only" }), _jsx("option", { value: "course", children: "Courses Only" })] }), _jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700", children: [_jsx(Download, { className: "h-4 w-4" }), "Export Report"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(StatCard, { title: "Total Views", value: dashboardData.totalViews.toLocaleString(), change: dashboardData.viewsGrowth, icon: Eye, color: "blue" }), _jsx(StatCard, { title: "Active Learners", value: dashboardData.activeLearners.toLocaleString(), change: dashboardData.learnersGrowth, icon: Users, color: "green" }), _jsx(StatCard, { title: "Avg. Read Time", value: `${Math.round((analytics?.averageReadTime || 0) / 60)}m`, change: 5.2, icon: Clock, color: "purple" }), _jsx(StatCard, { title: "Engagement Score", value: `${analytics?.engagementScore}%`, change: 2.8, icon: TrendingUp, color: "orange" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Views & Users Trend" }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-blue-500 rounded-full mr-2" }), _jsx("span", { className: "text-sm text-gray-600", children: "Views" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-green-500 rounded-full mr-2" }), _jsx("span", { className: "text-sm text-gray-600", children: "Users" })] })] })] }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: viewsTrendData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "views", stroke: "#3B82F6", strokeWidth: 2, dot: { fill: '#3B82F6', strokeWidth: 2, r: 4 } }), _jsx(Line, { type: "monotone", dataKey: "uniqueUsers", stroke: "#10B981", strokeWidth: 2, dot: { fill: '#10B981', strokeWidth: 2, r: 4 } })] }) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border border-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-6", children: "Device Breakdown" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: deviceData, cx: "50%", cy: "50%", outerRadius: 80, dataKey: "value", label: ({ name, value }) => `${name}: ${value}%`, children: deviceData.map((entry, index) => (_jsx(Cell, { fill: entry.fill }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) })] })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border border-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-6", children: "Content Performance Over Time" }), _jsx(ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(AreaChart, { data: contentPerformanceData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Area, { type: "monotone", dataKey: "articles", stackId: "1", stroke: "#3B82F6", fill: "#3B82F6", fillOpacity: 0.6 }), _jsx(Area, { type: "monotone", dataKey: "courses", stackId: "1", stroke: "#10B981", fill: "#10B981", fillOpacity: 0.6 })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow border border-gray-200 overflow-hidden", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Top Performing Content" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Content Title" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Views" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Avg. Read Time" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Engagement" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Performance" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: topContentData.map((content, index) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: content.title }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Eye, { className: "h-4 w-4 text-gray-400 mr-2" }), _jsx("span", { className: "text-sm text-gray-900", children: content.views.toLocaleString() })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "h-4 w-4 text-gray-400 mr-2" }), _jsxs("span", { className: "text-sm text-gray-900", children: [content.readTime, "m"] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-16 bg-gray-200 rounded-full h-2 mr-3", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: { width: `${content.engagement}%` } }) }), _jsxs("span", { className: "text-sm text-gray-900", children: [content.engagement, "%"] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${content.engagement >= 90
                                                        ? 'bg-green-100 text-green-800'
                                                        : content.engagement >= 80
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'}`, children: content.engagement >= 90
                                                        ? 'Excellent'
                                                        : content.engagement >= 80
                                                            ? 'Good'
                                                            : 'Needs Improvement' }) })] }, index))) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow border border-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-6", children: "Top Referrers" }), _jsx("div", { className: "space-y-4", children: analytics?.topReferrers.map((referrer, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3", children: _jsx("span", { className: "text-sm font-medium text-blue-600", children: index + 1 }) }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: referrer })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-24 bg-gray-200 rounded-full h-2 mr-3", children: _jsx("div", { className: "bg-blue-500 h-2 rounded-full", style: { width: `${Math.max(20, 100 - index * 20)}%` } }) }), _jsxs("span", { className: "text-sm text-gray-500", children: [Math.max(5, 40 - index * 8), "%"] })] })] }, index))) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border border-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-6", children: "Top Locations" }), _jsx("div", { className: "space-y-4", children: analytics &&
                                    Object.entries(analytics.locationBreakdown).map(([location, percentage], index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3", children: _jsx("span", { className: "text-sm font-medium text-green-600", children: index + 1 }) }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: location })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-24 bg-gray-200 rounded-full h-2 mr-3", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: { width: `${percentage}%` } }) }), _jsxs("span", { className: "text-sm text-gray-500", children: [percentage, "%"] })] })] }, index))) })] })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border border-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-6", children: "Insights & Recommendations" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg border border-blue-200", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(TrendingUp, { className: "h-5 w-5 text-blue-600 mr-2" }), _jsx("h4", { className: "font-medium text-blue-900", children: "Growing Engagement" })] }), _jsx("p", { className: "text-sm text-blue-700", children: "Mobile engagement is up 23% this month. Consider optimizing more content for mobile readers." })] }), _jsxs("div", { className: "bg-green-50 p-4 rounded-lg border border-green-200", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(Users, { className: "h-5 w-5 text-green-600 mr-2" }), _jsx("h4", { className: "font-medium text-green-900", children: "Audience Growth" })] }), _jsx("p", { className: "text-sm text-green-700", children: "New user acquisition is strong. Your content is reaching 15% more unique visitors." })] }), _jsxs("div", { className: "bg-orange-50 p-4 rounded-lg border border-orange-200", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(Clock, { className: "h-5 w-5 text-orange-600 mr-2" }), _jsx("h4", { className: "font-medium text-orange-900", children: "Content Length" })] }), _jsx("p", { className: "text-sm text-orange-700", children: "Shorter articles (5-8 min read) have 30% higher completion rates than longer ones." })] })] })] })] }));
}
//# sourceMappingURL=AnalyticsPage.js.map