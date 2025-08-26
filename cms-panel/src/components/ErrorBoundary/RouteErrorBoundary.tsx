import { Component, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void, errorInfo?: React.ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean; // If true, only this route is affected
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Route Error Boundary caught:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // In production, send to monitoring
    if (!import.meta.env.DEV) {
      this.reportError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary when route changes
    if (this.props.children !== prevProps.children && this.state.hasError) {
      this.resetError();
    }
  }

  reportError(error: Error, errorInfo: React.ErrorInfo) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      route: window.location.pathname,
      userAgent: navigator.userAgent,
    };

    // Send to monitoring service
    // Example: sendToMonitoring(errorReport);
    
    // Store in session storage for debugging
    try {
      const errors = JSON.parse(sessionStorage.getItem('route_errors') || '[]');
      errors.push(errorReport);
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.shift();
      }
      sessionStorage.setItem('route_errors', JSON.stringify(errors));
    } catch (e) {
      // Ignore storage errors
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.resetError,
          this.state.errorInfo || undefined
        );
      }

      // Use default error fallback
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo || undefined}
        />
      );
    }

    return this.props.children;
  }
}