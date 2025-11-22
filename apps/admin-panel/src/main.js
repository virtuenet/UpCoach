import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { initializePerformanceMonitoring } from '@upcoach/shared';
import App from './App';
import './index.css';
// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
        },
    },
});
// Initialize performance monitoring for admin panel
initializePerformanceMonitoring({
    enableReporting: true,
    budget: {
        FCP: 1800,
        LCP: 2500,
        CLS: 0.1,
        FID: 100,
        TTFB: 800
    },
    onMetric: (metric) => {
        // Log performance metrics for admin panel optimization
        console.info(`[Admin Panel] ${metric.name}: ${metric.value}ms (${metric.rating})`);
        // Report critical performance issues
        if (metric.rating === 'poor') {
            console.warn(`[Performance Alert] ${metric.name} is performing poorly: ${metric.value}ms`);
        }
    }
});
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsxs(QueryClientProvider, { client: queryClient, children: [_jsx(BrowserRouter, { children: _jsx(App, {}) }), _jsx(ReactQueryDevtools, { initialIsOpen: false })] }) }));
//# sourceMappingURL=main.js.map