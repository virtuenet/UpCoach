import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Removed unused imports
/**
 * Enhanced Error Boundary Component
 * Comprehensive error handling with recovery strategies
 */
import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '../../utils/logger';
import { sentryFrontend } from '../../services/monitoring/sentryInit';
export class EnhancedErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.resetTimeoutId = null;
        this.previousResetKeys = [];
        this.scheduleReset = (delay) => {
            this.resetTimeoutId = setTimeout(() => {
                this.setState({ isRecovering: true });
                setTimeout(() => this.resetErrorBoundary(), 1000);
            }, delay);
        };
        this.resetErrorBoundary = () => {
            if (this.resetTimeoutId) {
                clearTimeout(this.resetTimeoutId);
                this.resetTimeoutId = null;
            }
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                showDetails: false,
                isRecovering: false,
            });
        };
        this.toggleDetails = () => {
            this.setState(prev => ({ showDetails: !prev.showDetails }));
        };
        this.handleReport = () => {
            const { error, errorInfo } = this.state;
            if (!error)
                return;
            // Create error report
            const report = {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo?.componentStack,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
            };
            // Log report
            logger.error('Error report generated', report);
            // Send to backend
            fetch('/api/error-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report),
            }).catch(err => {
                logger.error('Failed to send error report', err);
            });
            alert('Error report has been sent. Thank you for your feedback!');
        };
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0,
            showDetails: false,
            isRecovering: false,
        };
        if (props.resetKeys) {
            this.previousResetKeys = props.resetKeys;
        }
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
            errorInfo: null,
            errorCount: 0,
            showDetails: false,
            isRecovering: false,
        };
    }
    componentDidCatch(error, errorInfo) {
        const { onError, level = 'component' } = this.props;
        // Log error
        logger.error(`Error in ${level}`, {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });
        // Report to Sentry
        sentryFrontend.captureException(error, {
            component: level,
            componentStack: errorInfo.componentStack,
        });
        // Update state with error details
        this.setState(prevState => ({
            errorInfo,
            errorCount: prevState.errorCount + 1,
        }));
        // Call custom error handler
        if (onError) {
            onError(error, errorInfo);
        }
        // Auto-recovery for transient errors
        if (this.state.errorCount < 3) {
            this.scheduleReset(5000);
        }
    }
    componentDidUpdate(prevProps) {
        const { resetKeys, resetOnPropsChange } = this.props;
        const { hasError } = this.state;
        // Reset on prop changes if enabled
        if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
            this.resetErrorBoundary();
        }
        // Reset on resetKeys change
        if (resetKeys && prevProps.resetKeys) {
            const hasResetKeyChanged = resetKeys.some((key, idx) => key !== this.previousResetKeys[idx]);
            if (hasResetKeyChanged) {
                this.resetErrorBoundary();
                this.previousResetKeys = resetKeys;
            }
        }
    }
    componentWillUnmount() {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }
    }
    renderErrorFallback() {
        const { fallback, level = 'component', isolate = false, showDetails: showDetailsProp = true, enableReport = true, } = this.props;
        const { error, errorInfo, errorCount, showDetails, isRecovering } = this.state;
        if (fallback) {
            return _jsx(_Fragment, { children: fallback });
        }
        const isPageLevel = level === 'page';
        const isSectionLevel = level === 'section';
        return (_jsx("div", { className: `
          flex flex-col items-center justify-center
          ${isPageLevel ? 'min-h-screen' : isSectionLevel ? 'min-h-[400px]' : 'min-h-[200px]'}
          ${isolate ? 'border border-destructive/20 rounded-lg' : ''}
          p-8 bg-background
        `, children: _jsxs("div", { className: "max-w-md w-full text-center space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx("div", { className: "p-3 bg-destructive/10 rounded-full", children: _jsx(AlertTriangle, { className: "h-8 w-8 text-destructive" }) }) }), _jsx("h2", { className: "text-2xl font-semibold", children: isPageLevel ? 'Page Error' : isSectionLevel ? 'Section Error' : 'Component Error' }), _jsx("p", { className: "text-muted-foreground", children: error?.message || 'An unexpected error occurred' }), isRecovering && (_jsxs("div", { className: "flex items-center justify-center space-x-2 text-sm text-muted-foreground", children: [_jsx(RefreshCw, { className: "h-4 w-4 animate-spin" }), _jsx("span", { children: "Attempting to recover..." })] })), errorCount > 1 && (_jsxs("p", { className: "text-sm text-amber-600", children: ["This error has occurred ", errorCount, " times"] })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2 justify-center", children: [_jsxs("button", { onClick: this.resetErrorBoundary, className: "inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Try Again"] }), isPageLevel && (_jsxs("button", { onClick: () => (window.location.href = '/'), className: "inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors", children: [_jsx(Home, { className: "h-4 w-4 mr-2" }), "Go Home"] })), enableReport && (_jsx("button", { onClick: this.handleReport, className: "inline-flex items-center justify-center px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors", children: "Report Issue" }))] }), showDetailsProp && error && (_jsx("button", { onClick: this.toggleDetails, className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors", children: showDetails ? (_jsxs(_Fragment, { children: [_jsx(ChevronUp, { className: "h-4 w-4 mr-1" }), "Hide Details"] })) : (_jsxs(_Fragment, { children: [_jsx(ChevronDown, { className: "h-4 w-4 mr-1" }), "Show Details"] })) })), showDetails && error && (_jsxs("div", { className: "mt-4 p-4 bg-muted rounded-lg text-left", children: [_jsx("h3", { className: "font-semibold mb-2 text-sm", children: "Error Details" }), _jsxs("div", { className: "space-y-2 text-xs font-mono", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Message:" }), _jsx("p", { className: "mt-1 break-all", children: error.message })] }), error.stack && (_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Stack Trace:" }), _jsx("pre", { className: "mt-1 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto", children: error.stack })] })), errorInfo?.componentStack && (_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Component Stack:" }), _jsx("pre", { className: "mt-1 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto", children: errorInfo.componentStack })] }))] })] }))] }) }));
    }
    render() {
        if (this.state.hasError) {
            return this.renderErrorFallback();
        }
        return this.props.children;
    }
}
/**
 * Hook for error handling
 */
export function useErrorHandler() {
    return (error, errorInfo) => {
        logger.error('Error caught by hook', {
            error: error.message,
            stack: error.stack,
            errorInfo,
        });
        sentryFrontend.captureException(error, {
            context: 'useErrorHandler',
            errorInfo,
        });
    };
}
/**
 * Async Error Boundary for handling promise rejections
 */
export function AsyncErrorBoundary({ children, fallback, }) {
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        const handleUnhandledRejection = (event) => {
            setError(new Error(event.reason));
        };
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);
    if (error) {
        return (_jsx(EnhancedErrorBoundary, { fallback: fallback, onError: () => setError(null), children: children }));
    }
    return _jsx(_Fragment, { children: children });
}
/**
 * Network Error Boundary for handling fetch failures
 */
export function NetworkErrorBoundary({ children, onRetry, }) {
    const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
    React.useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    if (isOffline) {
        return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-[200px] p-8", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "text-6xl", children: "\uD83D\uDCE1" }), _jsx("h2", { className: "text-2xl font-semibold", children: "You're Offline" }), _jsx("p", { className: "text-muted-foreground", children: "Please check your internet connection and try again." }), _jsx("button", { onClick: () => {
                            setIsOffline(!navigator.onLine);
                            onRetry?.();
                        }, className: "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90", children: "Retry" })] }) }));
    }
    return _jsx(_Fragment, { children: children });
}
/**
 * Suspense Error Boundary wrapper
 */
export function SuspenseErrorBoundary({ children, fallback, errorFallback, }) {
    return (_jsx(EnhancedErrorBoundary, { fallback: errorFallback, children: _jsx(React.Suspense, { fallback: fallback || _jsx("div", { children: "Loading..." }), children: children }) }));
}
//# sourceMappingURL=EnhancedErrorBoundary.js.map