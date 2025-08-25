import { Component, ReactNode } from "react";
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  _error: Error | null;
}

/**
 * Error Boundary specifically for async components and data fetching
 */
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      _error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      _error: error,
    };
  }

  componentDidCatch(error: Error) {
    // Log async-specific errors
    console.error('Async Error:', error);
    
    // Check if it's a network error
    if (this.isNetworkError(error)) {
      this.handleNetworkError(error);
    }
    
    // Check if it's a chunk loading error
    if (this.isChunkLoadError(error)) {
      this.handleChunkLoadError(error);
    }

    this.props.onError?.(error);
  }

  private isNetworkError(error: Error): boolean {
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch');
  }

  private isChunkLoadError(error: Error): boolean {
    return error.message.toLowerCase().includes('loading chunk') ||
           error.message.toLowerCase().includes('loading css chunk');
  }

  private handleNetworkError(error: Error) {
    // Store network _error state
    sessionStorage.setItem('lastNetworkError', JSON.stringify({
      message: error.message,
      timestamp: Date.now(),
    }));
  }

  private handleChunkLoadError(error: Error) {
    // For chunk loading errors, try to reload the page once
    const hasReloaded = sessionStorage.getItem('chunkErrorReload');
    if (!hasReloaded) {
      sessionStorage.setItem('chunkErrorReload', 'true');
      window.location.reload();
    } else {
      // Already tried reloading, show error
      sessionStorage.removeItem('chunkErrorReload');
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      _error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state._error) {
      if (this.props.fallback) {
        return <>{this.props.fallback(this.state._error, this.handleRetry)}</>;
      }

      // Default async error UI
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Error
          </h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            {this.isNetworkError(this.state._error)
              ? 'Network connection issue. Please check your internet.'
              : 'Failed to load this section. Please try again.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}