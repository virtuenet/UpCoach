import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { sentryFrontend } from '../services/monitoring/sentryInit';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send to Sentry monitoring
    sentryFrontend.captureException(error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });
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
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <div className="mt-4 text-left">
                  <details className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-300">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </div>
              )}
              <div className="mt-6 flex justify-center gap-4">
                <Button
                  onClick={this.resetError}
                  variant="outline"
                  className="inline-flex items-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="default"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}