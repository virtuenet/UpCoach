import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { initializePerformanceMonitoring, Metric } from '@upcoach/shared';
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
  onMetric: (metric: Metric) => {
    // Log performance metrics for admin panel optimization
    console.info(`[Admin Panel] ${metric.name}: ${metric.value}ms (${metric.rating})`);
    
    // Report critical performance issues
    if (metric.rating === 'poor') {
      console.warn(`[Performance Alert] ${metric.name} is performing poorly: ${metric.value}ms`);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);