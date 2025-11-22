import React, { useEffect, useRef } from 'react';

interface ErrorDetails {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
  suggestions?: string[];
  retryable?: boolean;
  retryAfter?: number;
}

interface AccessibleErrorProps {
  error?: ErrorDetails | string | null;
  onRetry?: () => void;
  className?: string;
  focusOnMount?: boolean;
  variant?: 'inline' | 'toast' | 'modal';
}

/**
 * Accessible error display component with screen reader support
 */
export const AccessibleError: React.FC<AccessibleErrorProps> = ({
  error,
  onRetry,
  className = '',
  focusOnMount = true,
  variant = 'inline',
}) => {
  const errorRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = React.useState<number>(0);

  // Parse error into structured format
  const errorDetails: ErrorDetails = React.useMemo(() => {
    if (!error) return { message: '' };

    if (typeof error === 'string') {
      return { message: error };
    }

    return error;
  }, [error]);

  // Focus error on mount for keyboard users
  useEffect(() => {
    if (focusOnMount && error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error, focusOnMount]);

  // Handle retry countdown
  useEffect(() => {
    if (errorDetails.retryAfter) {
      setTimeLeft(errorDetails.retryAfter);

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [errorDetails.retryAfter]);

  if (!error) return null;

  // Get user-friendly message based on error code
  const getUserFriendlyMessage = (code?: string): string | null => {
    const messages: Record<string, string> = {
      CSRF_TOKEN_MISSING: 'Your session has expired. Please refresh the page and try again.',
      CSRF_TOKEN_INVALID: 'Security validation failed. Please refresh the page and try again.',
      RATE_LIMIT_EXCEEDED: `You've made too many requests. Please wait ${timeLeft || errorDetails.retryAfter} seconds and try again.`,
      UNAUTHORIZED: 'You need to log in to perform this action.',
      FORBIDDEN: "You don't have permission to access this resource.",
      NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
      VALIDATION_ERROR: 'Please check your input and try again.',
      SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    };

    return code ? messages[code] || null : null;
  };

  const displayMessage = getUserFriendlyMessage(errorDetails.code) || errorDetails.message;

  // Render based on variant
  if (variant === 'toast') {
    return (
      <div
        ref={errorRef}
        role="alert"
        aria-live="assertive"
        tabIndex={-1}
        className={`fixed bottom-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg ${className}`}
      >
        <ErrorContent
          errorDetails={errorDetails}
          displayMessage={displayMessage}
          onRetry={onRetry}
          timeLeft={timeLeft}
        />
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div
        role="alertdialog"
        aria-labelledby="error-title"
        aria-describedby="error-description"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      >
        <div
          ref={errorRef}
          tabIndex={-1}
          className={`max-w-md w-full p-6 bg-white rounded-lg shadow-xl ${className}`}
        >
          <h2 id="error-title" className="text-lg font-semibold text-red-900 mb-2">
            Error
          </h2>
          <div id="error-description">
            <ErrorContent
              errorDetails={errorDetails}
              displayMessage={displayMessage}
              onRetry={onRetry}
              timeLeft={timeLeft}
            />
          </div>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div
      ref={errorRef}
      role="alert"
      aria-live="polite"
      tabIndex={-1}
      className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}
    >
      <ErrorContent
        errorDetails={errorDetails}
        displayMessage={displayMessage}
        onRetry={onRetry}
        timeLeft={timeLeft}
      />
    </div>
  );
};

interface ErrorContentProps {
  errorDetails: ErrorDetails;
  displayMessage: string;
  onRetry?: () => void;
  timeLeft: number;
}

const ErrorContent: React.FC<ErrorContentProps> = ({
  errorDetails,
  displayMessage,
  onRetry,
  timeLeft,
}) => {
  return (
    <>
      {/* Main error message */}
      <p className="text-red-800 font-medium">
        <span className="sr-only">Error:</span>
        {displayMessage}
      </p>

      {/* Field-specific errors */}
      {errorDetails.fieldErrors && Object.keys(errorDetails.fieldErrors).length > 0 && (
        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
          {Object.entries(errorDetails.fieldErrors).map(([field, error]) => (
            <li key={field}>
              <strong>{field}:</strong> {error}
            </li>
          ))}
        </ul>
      )}

      {/* Suggestions */}
      {errorDetails.suggestions && errorDetails.suggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700">Try the following:</p>
          <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
            {errorDetails.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Retry countdown */}
      {timeLeft > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          You can retry in {timeLeft} second{timeLeft !== 1 ? 's' : ''}.
        </p>
      )}

      {/* Retry button */}
      {errorDetails.retryable && onRetry && (
        <button
          onClick={onRetry}
          disabled={timeLeft > 0}
          className={`
            mt-3 px-4 py-2 text-sm font-medium rounded-md
            ${
              timeLeft > 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
            }
          `}
          aria-label={timeLeft > 0 ? `Retry available in ${timeLeft} seconds` : 'Retry'}
        >
          {timeLeft > 0 ? `Wait ${timeLeft}s` : 'Try Again'}
        </button>
      )}

      {/* Error code for support */}
      {errorDetails.code && (
        <p className="mt-3 text-xs text-gray-500">Error code: {errorDetails.code}</p>
      )}
    </>
  );
};

/**
 * Hook for managing error state with accessibility
 */
export function useAccessibleError() {
  const [error, setError] = React.useState<ErrorDetails | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = (err: any) => {
    // Parse different error formats
    let errorDetails: ErrorDetails;

    if (err.response?.data) {
      // Axios error
      const data = err.response.data;
      errorDetails = {
        message: data.error || data.message || 'An error occurred',
        code: data.code,
        fieldErrors: data.errors,
        suggestions: data.suggestions,
        retryable: data.retryable !== false,
        retryAfter: data.retryAfter,
      };
    } else if (err.name === 'CSRFError') {
      errorDetails = {
        message: err.message,
        code: 'CSRF_TOKEN_INVALID',
        suggestions: ['Refresh the page', 'Clear your browser cache'],
        retryable: true,
      };
    } else if (err.name === 'RateLimitError') {
      errorDetails = {
        message: err.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryable: true,
        retryAfter: err.retryAfter,
      };
    } else {
      errorDetails = {
        message: err.message || 'An unexpected error occurred',
        code: err.code,
        retryable: true,
      };
    }

    setError(errorDetails);
    setIsRetrying(false);

    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'alert');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.className = 'sr-only';
    announcement.textContent = `Error: ${errorDetails.message}`;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const clearError = () => {
    setError(null);
    setIsRetrying(false);
  };

  const retry = async (retryFn: () => Promise<any>) => {
    setIsRetrying(true);
    try {
      const result = await retryFn();
      clearError();
      return result;
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry,
  };
}

export default AccessibleError;
