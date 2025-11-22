import { jsx as _jsx } from "react/jsx-runtime";
import { Component } from 'react';
import ErrorFallback from './ErrorBoundary/ErrorFallback';
import { logger } from '../utils/logger';
import { sentryFrontend } from '../services/monitoring/sentryInit';
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.resetTimeoutId = null;
        this.resetError = () => {
            if (this.resetTimeoutId) {
                clearTimeout(this.resetTimeoutId);
                this.resetTimeoutId = null;
            }
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                errorCount: 0,
            });
        };
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0,
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
        };
    }
    componentDidCatch(error, errorInfo) {
        const { level = 'component', onError } = this.props;
        // Log error with appropriate level
        logger.error(`[${level.toUpperCase()} Error Boundary]`, error, {
            componentStack: errorInfo.componentStack,
            level,
            errorCount: this.state.errorCount + 1,
        });
        // Call custom error handler
        if (onError) {
            onError(error, errorInfo);
        }
        // Update state
        this.setState(prevState => ({
            errorInfo,
            errorCount: prevState.errorCount + 1,
        }));
        // Send to monitoring in production
        if (!import.meta.env.DEV) {
            this.reportError(error, errorInfo);
        }
        // Auto-reset after multiple errors (circuit breaker pattern)
        if (this.state.errorCount >= 3) {
            this.scheduleReset(30000); // Reset after 30 seconds
        }
    }
    componentWillUnmount() {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }
    }
    reportError(error, errorInfo) {
        const errorReport = {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            level: this.props.level || 'component',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            errorCount: this.state.errorCount,
        };
        // Send to Sentry monitoring service
        sentryFrontend.captureException(error, {
            component: 'ErrorBoundary',
            level: this.props.level,
            componentStack: errorInfo.componentStack,
            errorCount: this.state.errorCount,
        });
        // Store in session storage for debugging
        try {
            const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
            errors.push(errorReport);
            // Keep only last 20 errors
            if (errors.length > 20) {
                errors.shift();
            }
            sessionStorage.setItem('app_errors', JSON.stringify(errors));
        }
        catch (e) {
            // Ignore storage errors
        }
    }
    scheduleReset(delay) {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }
        this.resetTimeoutId = setTimeout(() => {
            this.resetError();
            logger.info('Error boundary auto-reset after multiple errors');
        }, delay);
    }
    render() {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.resetError, this.state.errorInfo || undefined);
            }
            // Use default error fallback
            return (_jsx(ErrorFallback, { error: this.state.error, resetError: this.resetError, errorInfo: this.state.errorInfo || undefined }));
        }
        return this.props.children;
    }
}
// Export additional error boundary types
export { default as RouteErrorBoundary } from './ErrorBoundary/RouteErrorBoundary';
export { default as AsyncBoundary } from './ErrorBoundary/AsyncBoundary';
//# sourceMappingURL=ErrorBoundary.js.map