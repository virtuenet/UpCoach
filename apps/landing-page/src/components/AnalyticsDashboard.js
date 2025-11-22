'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { Users, TrendingUp, MousePointer, Clock, Globe, Smartphone, Monitor, BarChart3, } from 'lucide-react';
import { useEffect, useState } from 'react';
// Mock data - in production, this would come from Google Analytics API
const mockData = {
    pageViews: 45678,
    uniqueVisitors: 12345,
    avgSessionDuration: '3:45',
    bounceRate: 32.5,
    conversionRate: 4.8,
    topPages: [
        { page: '/', views: 15234 },
        { page: '/pricing', views: 8765 },
        { page: '/features', views: 6543 },
        { page: '/blog', views: 4321 },
        { page: '/contact', views: 2345 },
    ],
    topReferrers: [
        { source: 'Google', visits: 8765 },
        { source: 'Direct', visits: 6543 },
        { source: 'Facebook', visits: 3456 },
        { source: 'Twitter', visits: 2345 },
        { source: 'LinkedIn', visits: 1234 },
    ],
    deviceStats: {
        desktop: 55,
        mobile: 38,
        tablet: 7,
    },
    countryStats: [
        { country: 'United States', visits: 15234 },
        { country: 'United Kingdom', visits: 4567 },
        { country: 'Canada', visits: 3456 },
        { country: 'Australia', visits: 2345 },
        { country: 'Germany', visits: 1234 },
    ],
};
export default function AnalyticsDashboard() {
    const [data, setData] = useState(null);
    const [timeRange, setTimeRange] = useState('7d');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setData(mockData);
            setLoading(false);
        }, 1000);
    }, [timeRange]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(BarChart3, { className: "w-12 h-12 text-primary-600 animate-pulse mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading analytics..." })] }) }));
    }
    if (!data)
        return null;
    return (_jsx("div", { className: "min-h-screen bg-gray-50 py-12", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Analytics Dashboard" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("p", { className: "text-gray-600", children: "Website performance overview" }), _jsxs("select", { value: timeRange, onChange: e => setTimeRange(e.target.value), className: "px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm", children: [_jsx("option", { value: "24h", children: "Last 24 hours" }), _jsx("option", { value: "7d", children: "Last 7 days" }), _jsx("option", { value: "30d", children: "Last 30 days" }), _jsx("option", { value: "90d", children: "Last 90 days" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: "bg-white rounded-xl p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx(Users, { className: "w-8 h-8 text-blue-600" }), _jsx("span", { className: "text-sm text-green-600 font-medium", children: "+12.5%" })] }), _jsx("div", { className: "text-2xl font-bold text-gray-900", children: data.pageViews.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600", children: "Page Views" })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.1 }, className: "bg-white rounded-xl p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx(MousePointer, { className: "w-8 h-8 text-green-600" }), _jsx("span", { className: "text-sm text-green-600 font-medium", children: "+8.3%" })] }), _jsx("div", { className: "text-2xl font-bold text-gray-900", children: data.uniqueVisitors.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600", children: "Unique Visitors" })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.2 }, className: "bg-white rounded-xl p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx(Clock, { className: "w-8 h-8 text-purple-600" }), _jsx("span", { className: "text-sm text-green-600 font-medium", children: "+5.2%" })] }), _jsx("div", { className: "text-2xl font-bold text-gray-900", children: data.avgSessionDuration }), _jsx("div", { className: "text-sm text-gray-600", children: "Avg. Duration" })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.3 }, className: "bg-white rounded-xl p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx(TrendingUp, { className: "w-8 h-8 text-orange-600" }), _jsx("span", { className: "text-sm text-red-600 font-medium", children: "-2.1%" })] }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [data.bounceRate, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Bounce Rate" })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.4 }, className: "bg-white rounded-xl p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx(BarChart3, { className: "w-8 h-8 text-pink-600" }), _jsx("span", { className: "text-sm text-green-600 font-medium", children: "+15.7%" })] }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [data.conversionRate, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Conversion Rate" })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.5 }, className: "bg-white rounded-xl p-6 shadow-sm", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Top Pages" }), _jsx("div", { className: "space-y-3", children: data.topPages.map((page, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: page.page }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-24 bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-primary-600 h-2 rounded-full", style: {
                                                                width: `${(page.views / data.topPages[0].views) * 100}%`,
                                                            } }) }), _jsx("span", { className: "text-sm font-medium text-gray-900 w-16 text-right", children: page.views.toLocaleString() })] })] }, index))) })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.6 }, className: "bg-white rounded-xl p-6 shadow-sm", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Traffic Sources" }), _jsx("div", { className: "space-y-3", children: data.topReferrers.map((source, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: source.source }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-24 bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-secondary-600 h-2 rounded-full", style: {
                                                                width: `${(source.visits / data.topReferrers[0].visits) * 100}%`,
                                                            } }) }), _jsx("span", { className: "text-sm font-medium text-gray-900 w-16 text-right", children: source.visits.toLocaleString() })] })] }, index))) })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.7 }, className: "bg-white rounded-xl p-6 shadow-sm", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Device Breakdown" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Monitor, { className: "w-5 h-5 text-gray-600" }), _jsx("span", { className: "text-sm text-gray-600", children: "Desktop" })] }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: [data.deviceStats.desktop, "%"] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Smartphone, { className: "w-5 h-5 text-gray-600" }), _jsx("span", { className: "text-sm text-gray-600", children: "Mobile" })] }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: [data.deviceStats.mobile, "%"] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Monitor, { className: "w-5 h-5 text-gray-600" }), _jsx("span", { className: "text-sm text-gray-600", children: "Tablet" })] }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: [data.deviceStats.tablet, "%"] })] })] })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.8 }, className: "bg-white rounded-xl p-6 shadow-sm mt-8", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx(Globe, { className: "w-5 h-5" }), "Geographic Distribution"] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: data.countryStats.map((country, index) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900", children: country.visits.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600", children: country.country })] }, index))) })] })] }) }));
}
//# sourceMappingURL=AnalyticsDashboard.js.map