import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
export default function ErrorFallback({ error, resetError, errorInfo }) {
    const isDevelopment = import.meta.env.DEV;
    const handleReportError = () => {
        // In production, this would send error to monitoring service
        const errorReport = {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo?.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        };
        // For now, just log it
        console.error('Error Report:', errorReport);
        // In production, send to monitoring service
        if (!isDevelopment) {
            // Example: sendToMonitoring(errorReport);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "max-w-md w-full bg-white rounded-lg shadow-xl p-6", children: [_jsx("div", { className: "flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full", children: _jsx(AlertTriangle, { className: "w-6 h-6 text-red-600" }) }), _jsx("h1", { className: "mt-4 text-xl font-semibold text-center text-gray-900", children: "Oops! Something went wrong" }), _jsx("p", { className: "mt-2 text-sm text-center text-gray-600", children: "We're sorry for the inconvenience. The application encountered an unexpected error." }), isDevelopment && (_jsxs("div", { className: "mt-4 p-3 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-xs font-mono text-red-600 break-all", children: error.message }), error.stack && (_jsxs("details", { className: "mt-2", children: [_jsx("summary", { className: "text-xs text-gray-500 cursor-pointer hover:text-gray-700", children: "Stack trace" }), _jsx("pre", { className: "mt-2 text-xs text-gray-600 overflow-auto max-h-40", children: error.stack })] })), errorInfo?.componentStack && (_jsxs("details", { className: "mt-2", children: [_jsx("summary", { className: "text-xs text-gray-500 cursor-pointer hover:text-gray-700", children: "Component stack" }), _jsx("pre", { className: "mt-2 text-xs text-gray-600 overflow-auto max-h-40", children: errorInfo.componentStack })] }))] })), _jsxs("div", { className: "mt-6 flex flex-col gap-3", children: [_jsxs("button", { onClick: resetError, className: "flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "Try Again"] }), _jsxs("button", { onClick: () => (window.location.href = '/'), className: "flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500", children: [_jsx(Home, { className: "w-4 h-4 mr-2" }), "Go to Dashboard"] }), !isDevelopment && (_jsxs("button", { onClick: handleReportError, className: "flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800", children: [_jsx(Bug, { className: "w-4 h-4 mr-2" }), "Report Issue"] }))] })] }) }));
}
//# sourceMappingURL=ErrorFallback.js.map