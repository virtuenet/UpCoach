/**
 * Enhanced Error Boundary Component
 * Comprehensive error handling with recovery strategies
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    level?: 'page' | 'section' | 'component';
    resetKeys?: Array<string | number>;
    resetOnPropsChange?: boolean;
    isolate?: boolean;
    showDetails?: boolean;
    enableReport?: boolean;
}
interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCount: number;
    showDetails: boolean;
    isRecovering: boolean;
}
export declare class EnhancedErrorBoundary extends Component<Props, State> {
    private resetTimeoutId;
    private previousResetKeys;
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    componentDidUpdate(prevProps: Props): void;
    componentWillUnmount(): void;
    scheduleReset: (delay: number) => void;
    resetErrorBoundary: () => void;
    toggleDetails: () => void;
    handleReport: () => void;
    renderErrorFallback(): import("react/jsx-runtime").JSX.Element;
    render(): string | number | boolean | Iterable<React.ReactNode> | import("react/jsx-runtime").JSX.Element | null | undefined;
}
/**
 * Hook for error handling
 */
export declare function useErrorHandler(): (error: Error, errorInfo?: ErrorInfo) => void;
/**
 * Async Error Boundary for handling promise rejections
 */
export declare function AsyncErrorBoundary({ children, fallback, }: {
    children: ReactNode;
    fallback?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Network Error Boundary for handling fetch failures
 */
export declare function NetworkErrorBoundary({ children, onRetry, }: {
    children: ReactNode;
    onRetry?: () => void;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Suspense Error Boundary wrapper
 */
export declare function SuspenseErrorBoundary({ children, fallback, errorFallback, }: {
    children: ReactNode;
    fallback?: ReactNode;
    errorFallback?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=EnhancedErrorBoundary.d.ts.map