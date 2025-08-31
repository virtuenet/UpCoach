import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'global';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

/**
 * Global Error Boundary with enhanced error tracking and recovery
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  private retryTimeouts: Set<NodeJS.Timeout> = new Set();
  private readonly MAX_ERROR_COUNT = 3;
  private readonly ERROR_RESET_TIME = 60000; // Reset error count after 1 minute

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const { lastErrorTime, errorCount } = this.state;

    // Reset error count if enough time has passed
    const newErrorCount = now - lastErrorTime > this.ERROR_RESET_TIME ? 1 : errorCount + 1;

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary Caught:', error, errorInfo);
    }

    // Send error to monitoring service
    this.logErrorToService(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state
    this.setState({
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now,
    });

    // Auto-recover for transient errors
    if (newErrorCount < this.MAX_ERROR_COUNT) {
      this.scheduleAutoRecovery();
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'global',
    };

    // Send to backend error tracking
    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(err => {
      console.error('Failed to log error to service:', err);
    });

    // Also store in session storage for debugging
    const recentErrors = JSON.parse(sessionStorage.getItem('recentErrors') || '[]');
    recentErrors.push(errorData);
    // Keep only last 10 errors
    if (recentErrors.length > 10) {
      recentErrors.shift();
    }
    sessionStorage.setItem('recentErrors', JSON.stringify(recentErrors));
  }

  private scheduleAutoRecovery() {
    const timeout = setTimeout(() => {
      this.handleReset();
      this.retryTimeouts.delete(timeout);
    }, 5000); // Try to recover after 5 seconds

    this.retryTimeouts.add(timeout);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = encodeURIComponent(
      `Error: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`
    );

    // Open bug report form or email
    window.open(`mailto:support@upcoach.ai?subject=Bug Report&body=${errorDetails}`, '_blank');
  };

  private renderErrorFallback() {
    const { error, errorCount } = this.state;
    const { level = 'global' } = this.props;
    const isCriticalError = errorCount >= this.MAX_ERROR_COUNT;

    // Custom fallback if provided
    if (this.props.fallback) {
      return <>{this.props.fallback}</>;
    }

    // Different UI based on error level
    if (level === 'component') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-2">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">
              This component encountered an error and cannot be displayed.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      );
    }

    // Full page error for page/global level
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-center text-gray-900">
            {isCriticalError ? 'Critical Error' : 'Something went wrong'}
          </h1>

          <p className="mt-2 text-center text-gray-600">
            {isCriticalError
              ? 'The application has encountered multiple errors and may be unstable.'
              : 'We encountered an unexpected error. The issue has been logged.'}
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 p-4 bg-gray-50 rounded text-xs">
              <summary className="cursor-pointer text-gray-700 font-medium">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap text-red-600">{error.message}</pre>
              <pre className="mt-2 whitespace-pre-wrap text-gray-600">{error.stack}</pre>
            </details>
          )}

          <div className="mt-6 space-y-3">
            {!isCriticalError && (
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            )}

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </button>

            <button
              onClick={this.handleGoHome}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </button>

            <button
              onClick={this.handleReportBug}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Bug className="h-4 w-4 mr-2" />
              Report This Issue
            </button>
          </div>

          {errorCount > 1 && !isCriticalError && (
            <p className="mt-4 text-xs text-center text-gray-500">
              Error occurred {errorCount} times. Will stop auto-recovery after{' '}
              {this.MAX_ERROR_COUNT} attempts.
            </p>
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

export default GlobalErrorBoundary;
