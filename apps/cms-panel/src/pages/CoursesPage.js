import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, BookOpen, Users, Clock, Edit, Trash2 } from 'lucide-react';
import { coursesApi } from '../api/courses';
import LoadingSpinner from '../components/LoadingSpinner';
export default function CoursesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const { data: courses, isLoading } = useQuery({
        queryKey: ['courses', searchTerm, difficultyFilter],
        queryFn: () => coursesApi.getCourses({
            search: searchTerm,
            difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
        }),
    });
    const getDifficultyBadge = (difficulty) => {
        const colors = {
            beginner: 'bg-green-100 text-green-800',
            intermediate: 'bg-yellow-100 text-yellow-800',
            advanced: 'bg-red-100 text-red-800',
        };
        return colors[difficulty] || colors.beginner;
    };
    const getStatusBadge = (status) => {
        const colors = {
            published: 'bg-green-100 text-green-800',
            draft: 'bg-gray-100 text-gray-800',
            archived: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || colors.draft;
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Courses" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Create and manage structured learning paths" })] }), _jsxs(Link, { to: "/courses/create", className: "flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700", children: [_jsx(Plus, { className: "h-4 w-4" }), "New Course"] })] }), _jsx("div", { className: "bg-white p-4 rounded-lg shadow", children: _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search courses...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), className: "pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500" })] }) }), _jsxs("select", { value: difficultyFilter, onChange: e => setDifficultyFilter(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "all", children: "All Levels" }), _jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: courses?.map((course) => (_jsx("div", { className: "bg-white rounded-lg shadow hover:shadow-md transition-shadow", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 line-clamp-2", children: course.title }), _jsx("p", { className: "text-sm text-gray-500 mt-1 capitalize", children: course.category })] }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(course.status)}`, children: course.status })] }), _jsx("p", { className: "text-gray-600 text-sm line-clamp-3 mb-4", children: course.description }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyBadge(course.difficulty)}`, children: course.difficulty }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-500", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(BookOpen, { className: "h-4 w-4 mr-1" }), course.lessonsCount, " lessons"] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "h-4 w-4 mr-1" }), Math.round(course.duration / 60), "h"] })] })] }), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-gray-100", children: [_jsxs("div", { className: "flex items-center text-sm text-gray-500", children: [_jsx(Users, { className: "h-4 w-4 mr-1" }), course.enrolledCount, " enrolled"] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { className: "text-secondary-600 hover:text-secondary-900", children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx("button", { className: "text-red-600 hover:text-red-900", children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] })] }) }, course.id))) }), courses?.length === 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow p-12 text-center", children: [_jsx(BookOpen, { className: "h-12 w-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No courses yet" }), _jsx("p", { className: "text-gray-500 mb-4", children: "Get started by creating your first course" }), _jsxs(Link, { to: "/courses/create", className: "inline-flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700", children: [_jsx(Plus, { className: "h-4 w-4" }), "Create Course"] })] }))] }));
}
//# sourceMappingURL=CoursesPage.js.map