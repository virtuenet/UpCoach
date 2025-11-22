/**
 * Lazy Loading Components and Utilities
 * Code splitting and dynamic imports for performance
 */
import React, { ComponentType, ReactNode } from 'react';
export declare function LoadingFallback({ message, fullScreen, }: {
    message?: string;
    fullScreen?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export declare function ErrorFallback({ error, resetErrorBoundary, }: {
    error: Error;
    resetErrorBoundary: () => void;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Create a lazily loaded component with error boundary and loading state
 */
export declare function lazyLoad<T extends ComponentType<any>>(importFunc: () => Promise<{
    default: T;
}>, options?: {
    fallback?: ReactNode;
    errorFallback?: ComponentType<any>;
    preload?: boolean;
}): (props: any) => import("react/jsx-runtime").JSX.Element;
/**
 * Lazily loaded page components
 */
export declare const LazyPages: {
    Dashboard: (props: any) => import("react/jsx-runtime").JSX.Element;
    ContentList: (props: any) => import("react/jsx-runtime").JSX.Element;
    ContentEditor: (props: any) => import("react/jsx-runtime").JSX.Element;
    CreateContent: (props: any) => import("react/jsx-runtime").JSX.Element;
    Analytics: (props: any) => import("react/jsx-runtime").JSX.Element;
    AdvancedAnalytics: (props: any) => import("react/jsx-runtime").JSX.Element;
    AIAnalytics: (props: any) => import("react/jsx-runtime").JSX.Element;
    Users: (props: any) => import("react/jsx-runtime").JSX.Element;
    UserProfile: (props: any) => import("react/jsx-runtime").JSX.Element;
    Settings: (props: any) => import("react/jsx-runtime").JSX.Element;
    OrganizationSettings: (props: any) => import("react/jsx-runtime").JSX.Element;
    CoachDashboard: (props: any) => import("react/jsx-runtime").JSX.Element;
    CoachMarketplace: (props: any) => import("react/jsx-runtime").JSX.Element;
    CoachContentEditor: (props: any) => import("react/jsx-runtime").JSX.Element;
    Reports: (props: any) => import("react/jsx-runtime").JSX.Element;
    ReferralManagement: (props: any) => import("react/jsx-runtime").JSX.Element;
    MoodTracking: (props: any) => import("react/jsx-runtime").JSX.Element;
};
/**
 * Lazily loaded heavy components
 */
export declare const LazyComponents: {
    AreaChart: (props: any) => import("react/jsx-runtime").JSX.Element;
    BarChart: (props: any) => import("react/jsx-runtime").JSX.Element;
    LineChart: (props: any) => import("react/jsx-runtime").JSX.Element;
    PieChart: (props: any) => import("react/jsx-runtime").JSX.Element;
    RichTextEditor: (props: any) => import("react/jsx-runtime").JSX.Element;
    FileUploader: (props: any) => import("react/jsx-runtime").JSX.Element;
    DataGrid: (props: any) => import("react/jsx-runtime").JSX.Element;
    ColorPicker: (props: any) => import("react/jsx-runtime").JSX.Element;
};
/**
 * Route-based code splitting configuration
 */
export declare const lazyRoutes: ({
    path: string;
    component: (props: any) => import("react/jsx-runtime").JSX.Element;
    preload: boolean;
} | {
    path: string;
    component: (props: any) => import("react/jsx-runtime").JSX.Element;
    preload?: undefined;
})[];
/**
 * Preload critical routes
 */
export declare function preloadCriticalRoutes(): void;
/**
 * Intersection Observer for lazy loading components when visible
 */
export declare function useLazyLoadOnVisible(ref: React.RefObject<HTMLElement>, callback: () => void, options?: IntersectionObserverInit): void;
/**
 * Progressive image loading component
 */
export declare function LazyImage({ src, placeholder, alt, className, ...props }: {
    src: string;
    placeholder?: string;
    alt: string;
    className?: string;
    [key: string]: any;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Lazy load external scripts
 */
export declare function lazyLoadScript(src: string): Promise<void>;
/**
 * Lazy load CSS
 */
export declare function lazyLoadCSS(href: string): Promise<void>;
//# sourceMappingURL=LazyLoad.d.ts.map