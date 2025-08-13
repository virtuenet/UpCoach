import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from '../icons';

// Constants for error boundary behavior
const ERROR_AUTO_RESET_TIMEOUT = 10000; // 10 seconds
const MAX_ERROR_COUNT_BEFORE_DISABLE = 3;
const ERROR_LOG_ENDPOINT = '/api/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidMount() {
    // Initialize reset keys on mount
    if (this.props.resetKeys) {
      this.previousResetKeys = this.props.resetKeys;
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to error reporting service
    this.logErrorToService(error, errorInfo);

    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Auto-reset after timeout if error count is low
    if (this.state.errorCount < MAX_ERROR_COUNT_BEFORE_DISABLE) {
      this.resetTimeoutId = setTimeout(() => {
        this.resetErrorBoundary();
      }, ERROR_AUTO_RESET_TIMEOUT);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    
    // Reset error boundary when resetKeys change
    if (resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index]
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
        this.previousResetKeys = resetKeys;
      }
    }

    // Reset on any props change if enabled
    if (resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  // Sanitize error message to prevent XSS
  sanitizeErrorMessage = (message: string): string => {
    return message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Send error to logging service
    // This is where you'd integrate with Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Example: Send to backend
    if (process.env.NODE_ENV === 'production') {
      fetch(ERROR_LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(err => {
        console.error('Failed to log error:', err);
      });
    }
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
      errorCount: 0,
    });
  };

  render() {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback, isolate, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI based on level
      return (
        <ErrorFallback
          error={error}
          resetError={this.resetErrorBoundary}
          level={level}
          errorCount={errorCount}
          isolate={isolate}
        />
      );
    }

    return children;
  }
}

/**
 * Error Fallback Component
 * Default UI shown when an error is caught
 */
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  level?: 'page' | 'section' | 'component';
  errorCount?: number;
  isolate?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  level = 'component',
  errorCount = 1,
  isolate = false,
}) => {
  // Sanitize error message to prevent XSS
  const sanitizeErrorMessage = (message: string): string => {
    return message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };
  const getLevelStyles = () => {
    switch (level) {
      case 'page':
        return 'min-h-screen flex items-center justify-center p-4';
      case 'section':
        return 'py-12 px-4';
      case 'component':
      default:
        return 'py-8 px-4';
    }
  };

  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div className={`${getLevelStyles()} ${isolate ? 'bg-gray-50 dark:bg-gray-900 rounded-lg' : ''}`}>
      <div className="text-center max-w-md mx-auto">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 text-red-500 mb-4">
            <Icons.AlertTriangle className="w-full h-full" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {level === 'page' 
              ? 'Oops! Something went wrong' 
              : 'Error loading content'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {level === 'page'
              ? "We're sorry, but something unexpected happened. Please try refreshing the page."
              : "This component couldn't load properly. The rest of the page should still work."}
          </p>

          {errorCount > (MAX_ERROR_COUNT_BEFORE_DISABLE - 1) && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Multiple errors detected. Consider refreshing the page.
              </p>
            </div>
          )}

          {showDetails && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Error details (Development only)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto">
                <p className="text-red-600 dark:text-red-400 mb-2">
                  <span dangerouslySetInnerHTML={{ __html: sanitizeErrorMessage(error.message) }} />
                </p>
                <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  <span dangerouslySetInnerHTML={{ __html: sanitizeErrorMessage(error.stack || '') }} />
                </pre>
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetError}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Try again
            </button>
            
            {level === 'page' && (
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Go to homepage
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * withErrorBoundary HOC
 * Wraps a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Props
): React.ComponentType<P> {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WithErrorBoundaryComponent;
}

/**
 * useErrorHandler Hook
 * Allows functional components to handle errors
 */
export function useErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    throw error; // This will be caught by the nearest error boundary
  };
}

export default ErrorBoundary;