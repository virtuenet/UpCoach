import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
export default function LoadingSkeleton({ type = 'spinner', rows = 3, className = '', }) {
    // Spinner loader
    if (type === 'spinner') {
        return (_jsx("div", { className: `flex items-center justify-center min-h-[200px] ${className}`, children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-gray-400" }) }));
    }
    // Card skeleton
    if (type === 'card') {
        return (_jsxs("div", { className: `bg-white rounded-lg shadow p-6 animate-pulse ${className}`, children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-3/4 mb-4" }), _jsx("div", { className: "h-3 bg-gray-200 rounded mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-5/6" })] }));
    }
    // Table skeleton
    if (type === 'table') {
        return (_jsxs("div", { className: `bg-white rounded-lg shadow overflow-hidden ${className}`, children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsx("div", { className: "h-4 bg-gray-200 rounded w-1/4 animate-pulse" }) }), _jsx("div", { className: "divide-y divide-gray-200", children: [...Array(rows)].map((_, i) => (_jsx("div", { className: "p-4 animate-pulse", children: _jsxs("div", { className: "flex space-x-4", children: [_jsx("div", { className: "h-3 bg-gray-200 rounded w-1/6" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/4" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/3" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/6" })] }) }, i))) })] }));
    }
    // Form skeleton
    if (type === 'form') {
        return (_jsxs("div", { className: `bg-white rounded-lg shadow p-6 space-y-6 ${className}`, children: [[...Array(rows)].map((_, i) => (_jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-3 bg-gray-200 rounded w-1/4 mb-2" }), _jsx("div", { className: "h-10 bg-gray-100 rounded" })] }, i))), _jsxs("div", { className: "flex space-x-3 pt-4", children: [_jsx("div", { className: "h-10 bg-gray-200 rounded w-24 animate-pulse" }), _jsx("div", { className: "h-10 bg-gray-100 rounded w-24 animate-pulse" })] })] }));
    }
    // List skeleton
    if (type === 'list') {
        return (_jsx("div", { className: `space-y-3 ${className}`, children: [...Array(rows)].map((_, i) => (_jsx("div", { className: "bg-white rounded-lg shadow p-4 animate-pulse", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "h-10 w-10 bg-gray-200 rounded-full" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx("div", { className: "h-3 bg-gray-200 rounded w-3/4" }), _jsx("div", { className: "h-3 bg-gray-100 rounded w-1/2" })] })] }) }, i))) }));
    }
    // Default fallback
    return (_jsx("div", { className: `animate-pulse space-y-2 ${className}`, children: [...Array(rows)].map((_, i) => (_jsx("div", { className: "h-4 bg-gray-200 rounded" }, i))) }));
}
// Specialized skeleton components
export function CardSkeleton({ className = '' }) {
    return _jsx(LoadingSkeleton, { type: "card", className: className });
}
export function TableSkeleton({ rows = 5, className = '' }) {
    return _jsx(LoadingSkeleton, { type: "table", rows: rows, className: className });
}
export function FormSkeleton({ fields = 4, className = '', }) {
    return _jsx(LoadingSkeleton, { type: "form", rows: fields, className: className });
}
export function ListSkeleton({ items = 3, className = '', }) {
    return _jsx(LoadingSkeleton, { type: "list", rows: items, className: className });
}
//# sourceMappingURL=LoadingSkeleton.js.map