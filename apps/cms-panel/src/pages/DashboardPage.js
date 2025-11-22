import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { FileText, BookOpen, Eye, Users, TrendingUp, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mediaApi } from '../api/media';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, subDays } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from 'recharts';
import { contentApi } from '../api/content';
const StatCard = ({ title, value, icon: Icon, color, change, subtitle }) => {
    const colorClasses = {
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        orange: 'bg-orange-500',
    };
    return (_jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(Icon, { className: `h-6 w-6 text-white p-1 rounded ${colorClasses[color]}` }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: title }), _jsxs("dd", { className: "flex items-baseline", children: [_jsx("div", { className: "text-2xl font-semibold text-gray-900", children: value }), change !== undefined && (_jsxs("div", { className: `ml-2 flex items-baseline text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`, children: [change >= 0 ? '+' : '', change, "%"] }))] }), subtitle && _jsx("dd", { className: "text-sm text-gray-500 mt-1", children: subtitle })] }) })] }) }) }));
};
const ActivityFeed = ({ activities }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'article':
                return _jsx(FileText, { className: "h-4 w-4" });
            case 'course':
                return _jsx(BookOpen, { className: "h-4 w-4" });
            case 'media':
                return _jsx(Eye, { className: "h-4 w-4" });
            default:
                return _jsx(FileText, { className: "h-4 w-4" });
        }
    };
    const getColor = (type) => {
        switch (type) {
            case 'article':
                return 'text-blue-600 bg-blue-100';
            case 'course':
                return 'text-green-600 bg-green-100';
            case 'media':
                return 'text-purple-600 bg-purple-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };
    return (_jsx("div", { className: "flow-root", children: _jsx("ul", { className: "-mb-8", children: activities.map((activity, index) => (_jsx("li", { children: _jsxs("div", { className: "relative pb-8", children: [index !== activities.length - 1 && (_jsx("span", { className: "absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" })), _jsxs("div", { className: "relative flex space-x-3", children: [_jsx("div", { children: _jsx("span", { className: `h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getColor(activity.type)}`, children: getIcon(activity.type) }) }), _jsxs("div", { className: "min-w-0 flex-1 pt-1.5 flex justify-between space-x-4", children: [_jsx("div", { children: _jsxs("p", { className: "text-sm text-gray-500", children: [_jsx("span", { className: "font-medium text-gray-900", children: activity.user }), ' ', activity.action, ' ', _jsx("span", { className: "font-medium text-gray-900", children: activity.title })] }) }), _jsx("div", { className: "text-right text-sm whitespace-nowrap text-gray-500", children: activity.time })] })] })] }) }, activity.id))) }) }));
};
export default function DashboardPage() {
    // Fetch dashboard stats
    const { data: stats, isPending: statsLoading } = useQuery({
        queryKey: ['cms-dashboard-stats'],
        queryFn: async () => {
            // Mock data - in production would fetch from actual API
            return {
                totalArticles: 42,
                totalCourses: 15,
                totalViews: 25840,
                activeLearners: 1205,
                articlesGrowth: 12.5,
                coursesGrowth: 8.3,
                viewsGrowth: 18.7,
                learnersGrowth: 6.2,
                totalMedia: 156,
                storageUsed: 2.4, // GB
            };
        },
    });
    // Fetch recent content
    const { data: recentArticles } = useQuery({
        queryKey: ['recent-articles'],
        queryFn: () => contentApi.getArticles({ limit: 5, sortBy: 'updatedAt', sortOrder: 'DESC' }),
    });
    // Fetch storage stats
    const { data: storageStats } = useQuery({
        queryKey: ['storage-stats'],
        queryFn: mediaApi.getStorageStats,
    });
    // Mock chart data
    const viewsData = Array.from({ length: 7 }, (_, i) => ({
        date: format(subDays(new Date(), 6 - i), 'MMM dd'),
        views: Math.floor(Math.random() * 1000) + 500,
        users: Math.floor(Math.random() * 400) + 200,
    }));
    const contentTypeData = [
        { name: 'Articles', count: stats?.totalArticles || 0, color: '#3B82F6' },
        { name: 'Courses', count: stats?.totalCourses || 0, color: '#10B981' },
        { name: 'Media Files', count: stats?.totalMedia || 0, color: '#F59E0B' },
    ];
    // Mock recent activity
    const recentActivity = [
        {
            id: '1',
            type: 'article',
            title: 'Advanced Leadership Techniques',
            action: 'published',
            time: '2 hours ago',
            user: 'Sarah Johnson',
        },
        {
            id: '2',
            type: 'course',
            title: 'Product Management Fundamentals',
            action: 'updated',
            time: '4 hours ago',
            user: 'Mike Chen',
        },
        {
            id: '3',
            type: 'media',
            title: 'Leadership Workshop Video',
            action: 'uploaded',
            time: '6 hours ago',
            user: 'Emily Davis',
        },
        {
            id: '4',
            type: 'article',
            title: 'Remote Team Management',
            action: 'created draft',
            time: '1 day ago',
            user: 'Alex Thompson',
        },
        {
            id: '5',
            type: 'course',
            title: 'Communication Skills for Leaders',
            action: 'completed',
            time: '2 days ago',
            user: 'Lisa Park',
        },
    ];
    if (statsLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "border-b border-gray-200 pb-5", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Content Dashboard" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Welcome back! Here's an overview of your content performance." })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs(Link, { to: "/content/create", className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary-600 hover:bg-secondary-700", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "New Article"] }), _jsxs(Link, { to: "/courses/create", className: "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50", children: [_jsx(BookOpen, { className: "h-4 w-4 mr-2" }), "New Course"] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(StatCard, { title: "Total Articles", value: stats?.totalArticles || 0, icon: FileText, color: "purple", change: stats?.articlesGrowth, subtitle: "Published content" }), _jsx(StatCard, { title: "Total Courses", value: stats?.totalCourses || 0, icon: BookOpen, color: "blue", change: stats?.coursesGrowth, subtitle: "Learning paths" }), _jsx(StatCard, { title: "Total Views", value: (stats?.totalViews || 0).toLocaleString(), icon: Eye, color: "green", change: stats?.viewsGrowth, subtitle: "This month" }), _jsx(StatCard, { title: "Active Learners", value: (stats?.activeLearners || 0).toLocaleString(), icon: Users, color: "orange", change: stats?.learnersGrowth, subtitle: "Engaged users" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Views & Users (Last 7 Days)" }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-blue-500 rounded-full mr-2" }), _jsx("span", { className: "text-sm text-gray-600", children: "Views" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-green-500 rounded-full mr-2" }), _jsx("span", { className: "text-sm text-gray-600", children: "Users" })] })] })] }), _jsx("div", { className: "mt-5", children: _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(LineChart, { data: viewsData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "views", stroke: "#3B82F6", strokeWidth: 2, dot: { fill: '#3B82F6', strokeWidth: 2, r: 4 } }), _jsx(Line, { type: "monotone", dataKey: "users", stroke: "#10B981", strokeWidth: 2, dot: { fill: '#10B981', strokeWidth: 2, r: 4 } })] }) }) })] }) }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsxs("div", { className: "p-5", children: [_jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Content Distribution" }), _jsx("div", { className: "mt-5", children: _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: contentTypeData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", fill: "#3B82F6" })] }) }) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Recent Articles" }), _jsx(Link, { to: "/content", className: "text-sm text-secondary-600 hover:text-secondary-500", children: "View all" })] }), _jsx("div", { className: "mt-5", children: recentArticles?.data?.length ? (_jsx("div", { className: "space-y-4", children: recentArticles.data.slice(0, 5).map(article => (_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: `h-2 w-2 rounded-full ${article.status === 'published'
                                                            ? 'bg-green-400'
                                                            : article.status === 'draft'
                                                                ? 'bg-yellow-400'
                                                                : 'bg-gray-400'}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Link, { to: `/content/edit/${article.id}`, className: "text-sm font-medium text-gray-900 hover:text-secondary-600 truncate block", children: article.title }), _jsxs("p", { className: "text-sm text-gray-500", children: [format(new Date(article.updatedAt), 'MMM d, yyyy'), " \u2022 ", article.viewCount, ' ', "views"] })] }), _jsx("div", { className: "flex-shrink-0", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${article.status === 'published'
                                                            ? 'bg-green-100 text-green-800'
                                                            : article.status === 'draft'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-gray-100 text-gray-800'}`, children: article.status }) })] }, article.id))) })) : (_jsxs("div", { className: "text-center py-6", children: [_jsx(FileText, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No articles yet" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Get started by creating your first article." }), _jsx("div", { className: "mt-6", children: _jsxs(Link, { to: "/content/create", className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Create Article"] }) })] })) })] }) }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsxs("div", { className: "p-5", children: [_jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Recent Activity" }), _jsx("div", { className: "mt-5", children: _jsx(ActivityFeed, { activities: recentActivity }) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(Target, { className: "h-6 w-6 text-blue-500" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Storage Usage" }), _jsxs("dd", { className: "text-2xl font-semibold text-gray-900", children: [stats?.storageUsed || 0, " GB"] }), _jsxs("dd", { className: "text-sm text-gray-500", children: [storageStats?.totalFiles || 0, " files"] })] }) })] }), _jsxs("div", { className: "mt-5", children: [_jsx("div", { className: "bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-500 h-2 rounded-full", style: { width: `${Math.min(100, ((stats?.storageUsed || 0) / 10) * 100)}%` } }) }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "of 10 GB limit" })] })] }) }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(TrendingUp, { className: "h-6 w-6 text-green-500" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Avg. Engagement" }), _jsx("dd", { className: "text-2xl font-semibold text-gray-900", children: "84.2%" }), _jsx("dd", { className: "text-sm text-green-600", children: "+5.4% from last month" })] }) })] }) }) }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(Award, { className: "h-6 w-6 text-purple-500" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Content Score" }), _jsx("dd", { className: "text-2xl font-semibold text-gray-900", children: "92/100" }), _jsx("dd", { className: "text-sm text-purple-600", children: "Excellent quality" })] }) })] }) }) })] }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsxs("div", { className: "p-5", children: [_jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Link, { to: "/content/create", className: "bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white hover:from-purple-600 hover:to-purple-700 transition-all", children: [_jsx(FileText, { className: "h-8 w-8 mb-3" }), _jsx("h4", { className: "text-lg font-medium", children: "Create Article" }), _jsx("p", { className: "text-sm text-purple-100", children: "Write and publish new content" })] }), _jsxs(Link, { to: "/courses/create", className: "bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white hover:from-blue-600 hover:to-blue-700 transition-all", children: [_jsx(BookOpen, { className: "h-8 w-8 mb-3" }), _jsx("h4", { className: "text-lg font-medium", children: "Build Course" }), _jsx("p", { className: "text-sm text-blue-100", children: "Create structured learning paths" })] }), _jsxs(Link, { to: "/media", className: "bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white hover:from-green-600 hover:to-green-700 transition-all", children: [_jsx(Eye, { className: "h-8 w-8 mb-3" }), _jsx("h4", { className: "text-lg font-medium", children: "Media Library" }), _jsx("p", { className: "text-sm text-green-100", children: "Manage files and assets" })] }), _jsxs(Link, { to: "/analytics", className: "bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white hover:from-orange-600 hover:to-orange-700 transition-all", children: [_jsx(TrendingUp, { className: "h-8 w-8 mb-3" }), _jsx("h4", { className: "text-lg font-medium", children: "View Analytics" }), _jsx("p", { className: "text-sm text-orange-100", children: "Track content performance" })] })] })] }) })] }));
}
//# sourceMappingURL=DashboardPage.js.map