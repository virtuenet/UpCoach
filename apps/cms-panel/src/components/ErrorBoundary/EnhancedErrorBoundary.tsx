// Removed unused imports
/**
 * Enhanced Error Boundary Component
 * Comprehensive error handling with recovery strategies
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '../../utils/logger';
import { sentryFrontend } from '../../services/monitoring/sentryInit';

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

export class EnhancedErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);

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

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
      isRecovering: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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

  componentDidUpdate(prevProps: Props) {
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

  scheduleReset = (delay: number) => {
    this.resetTimeoutId = setTimeout(() => {
      this.setState({ isRecovering: true });
      setTimeout(() => this.resetErrorBoundary(), 1000);
    }, delay);
  };

  resetErrorBoundary = () => {
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

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  handleReport = () => {
    const { error, errorInfo } = this.state;

    if (!error) return;

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

  renderErrorFallback() {
    const {
      fallback,
      level = 'component',
      isolate = false,
      showDetails: showDetailsProp = true,
      enableReport = true,
    } = this.props;

    const { error, errorInfo, errorCount, showDetails, isRecovering } = this.state;

    if (fallback) {
      return <>{fallback}</>;
    }

    const isPageLevel = level === 'page';
    const isSectionLevel = level === 'section';

    return (
      <div
        className={`
          flex flex-col items-center justify-center
          ${isPageLevel ? 'min-h-screen' : isSectionLevel ? 'min-h-[400px]' : 'min-h-[200px]'}
          ${isolate ? 'border border-destructive/20 rounded-lg' : ''}
          p-8 bg-background
        `}
      >
        <div className="max-w-md w-full text-center space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold">
            {isPageLevel ? 'Page Error' : isSectionLevel ? 'Section Error' : 'Component Error'}
          </h2>

          {/* Message */}
          <p className="text-muted-foreground">
            {error?.message || 'An unexpected error occurred'}
          </p>

          {/* Recovery status */}
          {isRecovering && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Attempting to recover...</span>
            </div>
          )}

          {/* Error count warning */}
          {errorCount > 1 && (
            <p className="text-sm text-amber-600">This error has occurred {errorCount} times</p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.resetErrorBoundary}
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>

            {isPageLevel && (
              <button
                onClick={() => (window.location.href = '/')}
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </button>
            )}

            {enableReport && (
              <button
                onClick={this.handleReport}
                className="inline-flex items-center justify-center px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
              >
                Report Issue
              </button>
            )}
          </div>

          {/* Error details toggle */}
          {showDetailsProp && error && (
            <button
              onClick={this.toggleDetails}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show Details
                </>
              )}
            </button>
          )}

          {/* Error details */}
          {showDetails && error && (
            <div className="mt-4 p-4 bg-muted rounded-lg text-left">
              <h3 className="font-semibold mb-2 text-sm">Error Details</h3>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground">Message:</span>
                  <p className="mt-1 break-all">{error.message}</p>
                </div>

                {error.stack && (
                  <div>
                    <span className="text-muted-foreground">Stack Trace:</span>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {errorInfo?.componentStack && (
                  <div>
                    <span className="text-muted-foreground">Component Stack:</span>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
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
  return (error: Error, errorInfo?: ErrorInfo) => {
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
export function AsyncErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (error) {
    return (
      <EnhancedErrorBoundary fallback={fallback} onError={() => setError(null)}>
        {children}
      </EnhancedErrorBoundary>
    );
  }

  return <>{children}</>;
}

/**
 * Network Error Boundary for handling fetch failures
 */
export function NetworkErrorBoundary({
  children,
  onRetry,
}: {
  children: ReactNode;
  onRetry?: () => void;
}) {
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <div className="text-center space-y-4">
          <div className="text-6xl">📡</div>
          <h2 className="text-2xl font-semibold">You're Offline</h2>
          <p className="text-muted-foreground">
            Please check your internet connection and try again.
          </p>
          <button
            onClick={() => {
              setIsOffline(!navigator.onLine);
              onRetry?.();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Suspense Error Boundary wrapper
 */
export function SuspenseErrorBoundary({
  children,
  fallback,
  errorFallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}) {
  return (
    <EnhancedErrorBoundary fallback={errorFallback}>
      <React.Suspense fallback={fallback || <div>Loading...</div>}>{children}</React.Suspense>
    </EnhancedErrorBoundary>
  );
}
