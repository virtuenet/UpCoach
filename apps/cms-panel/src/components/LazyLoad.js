import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Lazy Loading Components and Utilities
 * Code splitting and dynamic imports for performance
 */
import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Loader2 } from 'lucide-react';
// Loading fallback component
export function LoadingFallback({ message = 'Loading...', fullScreen = false, }) {
    const content = (_jsxs("div", { className: "flex flex-col items-center justify-center space-y-4", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }), _jsx("p", { className: "text-sm text-muted-foreground", children: message })] }));
    if (fullScreen) {
        return (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50", children: content }));
    }
    return _jsx("div", { className: "flex items-center justify-center min-h-[200px] p-4", children: content });
}
// Error fallback component
export function ErrorFallback({ error, resetErrorBoundary, }) {
    return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-[400px] p-8", children: _jsxs("div", { className: "max-w-md text-center space-y-4", children: [_jsx("div", { className: "text-6xl", children: "\u26A0\uFE0F" }), _jsx("h2", { className: "text-2xl font-semibold", children: "Something went wrong" }), _jsx("p", { className: "text-muted-foreground", children: error.message || 'An unexpected error occurred while loading this component.' }), _jsx("button", { onClick: resetErrorBoundary, className: "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors", children: "Try Again" })] }) }));
}
/**
 * Create a lazily loaded component with error boundary and loading state
 */
export function lazyLoad(importFunc, options) {
    const LazyComponent = lazy(importFunc);
    // Preload component if requested
    if (options?.preload) {
        importFunc();
    }
    const WrappedComponent = (props) => {
        return (_jsx(ErrorBoundary, { FallbackComponent: options?.errorFallback || ErrorFallback, onError: () => window.location.reload(), children: _jsx(Suspense, { fallback: options?.fallback || _jsx(LoadingFallback, {}), children: _jsx(LazyComponent, { ...props }) }) }));
    };
    // Add preload method
    WrappedComponent.preload = importFunc;
    return WrappedComponent;
}
/**
 * Lazily loaded page components
 */
export const LazyPages = {
    // Dashboard
    Dashboard: lazyLoad(() => import('../pages/DashboardPageV2'), {
        fallback: _jsx(LoadingFallback, { message: "Loading dashboard...", fullScreen: true }),
    }),
    // Content Management
    ContentList: lazyLoad(() => import('../pages/ContentPage')),
    ContentEditor: lazyLoad(() => import('../pages/EditContentPage')),
    CreateContent: lazyLoad(() => import('../pages/CreateContentPage')),
    // Analytics
    Analytics: lazyLoad(() => import('../pages/AnalyticsPage')),
    AdvancedAnalytics: lazyLoad(() => import('../pages/AnalyticsPage')),
    AIAnalytics: lazyLoad(() => import('../pages/AnalyticsPage')),
    // User Management
    Users: lazyLoad(() => import('../pages/UsersPage')),
    UserProfile: lazyLoad(() => import('../pages/UserProfilePage')),
    // Settings
    Settings: lazyLoad(() => import('../pages/SettingsPage')),
    OrganizationSettings: lazyLoad(() => import('../pages/SettingsPage')),
    // Coach
    CoachDashboard: lazyLoad(() => import('../pages/DashboardPage')),
    CoachMarketplace: lazyLoad(() => import('../pages/ContentPage')),
    CoachContentEditor: lazyLoad(() => import('../pages/EditContentPage')),
    // Reports
    Reports: lazyLoad(() => import('../pages/AnalyticsPage')),
    // Referrals
    ReferralManagement: lazyLoad(() => import('../pages/AnalyticsPage')),
    // Mood
    MoodTracking: lazyLoad(() => import('../pages/AnalyticsPage')),
};
/**
 * Lazily loaded heavy components
 */
export const LazyComponents = {
    // Charts
    AreaChart: lazyLoad(() => import('recharts').then(m => ({ default: m.AreaChart }))),
    BarChart: lazyLoad(() => import('recharts').then(m => ({ default: m.BarChart }))),
    LineChart: lazyLoad(() => import('recharts').then(m => ({ default: m.LineChart }))),
    PieChart: lazyLoad(() => import('recharts').then(m => ({ default: m.PieChart }))),
    // Rich Text Editor
    RichTextEditor: lazyLoad(() => import('../components/RichTextEditor')),
    // File Upload
    FileUploader: lazyLoad(() => import('../components/FileUploader')),
    // Data Grid
    DataGrid: lazyLoad(() => import('../components/DataGrid')),
    // Calendar - TODO: Create calendar component
    // Calendar: lazyLoad(() => import('../components/ui/calendar')),
    // Date Picker - TODO: Create date-picker component
    // DatePicker: lazyLoad(() => import('../components/ui/date-picker')),
    // Color Picker
    ColorPicker: lazyLoad(() => import('../components/ColorPicker')),
};
/**
 * Route-based code splitting configuration
 */
export const lazyRoutes = [
    {
        path: '/dashboard',
        component: LazyPages.Dashboard,
        preload: true, // Preload dashboard as it's likely to be visited
    },
    {
        path: '/content',
        component: LazyPages.ContentList,
    },
    {
        path: '/content/new',
        component: LazyPages.CreateContent,
    },
    {
        path: '/content/:id/edit',
        component: LazyPages.ContentEditor,
    },
    {
        path: '/analytics',
        component: LazyPages.Analytics,
    },
    {
        path: '/analytics/advanced',
        component: LazyPages.AdvancedAnalytics,
    },
    {
        path: '/ai-analytics',
        component: LazyPages.AIAnalytics,
    },
    {
        path: '/users',
        component: LazyPages.Users,
    },
    {
        path: '/users/:id',
        component: LazyPages.UserProfile,
    },
    {
        path: '/settings',
        component: LazyPages.Settings,
    },
    {
        path: '/settings/organization',
        component: LazyPages.OrganizationSettings,
    },
    {
        path: '/coach',
        component: LazyPages.CoachDashboard,
    },
    {
        path: '/coach/marketplace',
        component: LazyPages.CoachMarketplace,
    },
    {
        path: '/coach/content',
        component: LazyPages.CoachContentEditor,
    },
    {
        path: '/reports',
        component: LazyPages.Reports,
    },
    {
        path: '/referrals',
        component: LazyPages.ReferralManagement,
    },
    {
        path: '/mood',
        component: LazyPages.MoodTracking,
    },
];
/**
 * Preload critical routes
 */
export function preloadCriticalRoutes() {
    // Preload dashboard and content list as they're commonly accessed
    LazyPages.Dashboard.preload?.();
    LazyPages.ContentList.preload?.();
}
/**
 * Intersection Observer for lazy loading components when visible
 */
export function useLazyLoadOnVisible(ref, callback, options) {
    React.useEffect(() => {
        const element = ref.current;
        if (!element)
            return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback();
                    observer.unobserve(element);
                }
            });
        }, options);
        observer.observe(element);
        return () => {
            observer.unobserve(element);
        };
    }, [ref, callback, options]);
}
/**
 * Progressive image loading component
 */
export function LazyImage({ src, placeholder, alt, className, ...props }) {
    const [imageSrc, setImageSrc] = React.useState(placeholder || '');
    const [imageRef, setImageRef] = React.useState(null);
    const [isLoaded, setIsLoaded] = React.useState(false);
    React.useEffect(() => {
        if (!imageRef)
            return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = new Image();
                    img.src = src;
                    img.onload = () => {
                        setImageSrc(src);
                        setIsLoaded(true);
                    };
                    observer.unobserve(imageRef);
                }
            });
        });
        observer.observe(imageRef);
        return () => {
            if (imageRef) {
                observer.unobserve(imageRef);
            }
        };
    }, [imageRef, src]);
    return (_jsx("img", { ref: setImageRef, src: imageSrc, alt: alt, className: `${className} ${!isLoaded ? 'blur-sm' : 'blur-0'} transition-all duration-300`, ...props }));
}
/**
 * Lazy load external scripts
 */
export function lazyLoadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}
/**
 * Lazy load CSS
 */
export function lazyLoadCSS(href) {
    return new Promise((resolve, reject) => {
        // Check if stylesheet already exists
        if (document.querySelector(`link[href="${href}"]`)) {
            resolve();
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
        document.head.appendChild(link);
    });
}
//# sourceMappingURL=LazyLoad.js.map