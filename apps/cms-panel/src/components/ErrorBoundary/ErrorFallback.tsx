import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

export default function ErrorFallback({ error, resetError, errorInfo }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  const handleReportError = () => {
    // In production, this would send error to monitoring service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // For now, just log it
    console.error('Error Report:', errorReport);

    // In production, send to monitoring service
    if (!isDevelopment) {
      // Example: sendToMonitoring(errorReport);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
          Oops! Something went wrong
        </h1>

        <p className="mt-2 text-sm text-center text-gray-600">
          We're sorry for the inconvenience. The application encountered an unexpected error.
        </p>

        {isDevelopment && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-mono text-red-600 break-all">{error.message}</p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Stack trace
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
            {errorInfo?.componentStack && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Component stack
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={resetError}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </button>

          {!isDevelopment && (
            <button
              onClick={handleReportError}
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              <Bug className="w-4 h-4 mr-2" />
              Report Issue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
