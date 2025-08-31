import { GlobalErrorBoundary } from './GlobalErrorBoundary';
import { AsyncErrorBoundary } from './AsyncErrorBoundary';
import { useNavigate, useParams, useLocation, useRouteError, Link } from 'react-router-dom';
import { ArrowLeft, Home, AlertTriangle } from 'lucide-react';

/**
 * Error Boundary for React Router routes
 */
export function RouteErrorBoundary() {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  const isNotFound = error?.status === 404;
  const isUnauthorized = error?.status === 401 || error?.status === 403;
  const isServerError = error?.status >= 500;

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // 404 Not Found
  if (isNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full text-center">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">Page Not Found</h2>
          <p className="mt-2 text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-6 space-x-4">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
            <button
              onClick={handleGoHome}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 401/403 Unauthorized
  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-yellow-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-center text-gray-900">Access Denied</h1>
          <p className="mt-2 text-center text-gray-600">
            {error?.status === 401
              ? 'You need to be logged in to access this page.'
              : "You don't have permission to access this resource."}
          </p>
          <div className="mt-6 space-y-3">
            {error?.status === 401 ? (
              <button
                onClick={handleLogin}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
            ) : (
              <button
                onClick={handleGoHome}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            )}
            <button
              onClick={handleGoBack}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 500+ Server Error
  if (isServerError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-center text-gray-900">Server Error</h1>
          <p className="mt-2 text-center text-gray-600">
            Something went wrong on our end. Please try again later.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-gray-50 rounded text-xs">
              <summary className="cursor-pointer text-gray-700 font-medium">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap text-red-600">
                {error?.statusText || error?.message}
              </pre>
            </details>
          )}
          <div className="mt-6 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
            <button
              onClick={handleGoHome}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generic Error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-center text-gray-900">
          Oops! Something went wrong
        </h1>
        <p className="mt-2 text-center text-gray-600">
          An unexpected error occurred. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-4 bg-gray-50 rounded text-xs">
            <summary className="cursor-pointer text-gray-700 font-medium">Error Details</summary>
            <pre className="mt-2 whitespace-pre-wrap text-red-600">
              {error.statusText || error.message || JSON.stringify(error)}
            </pre>
          </details>
        )}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go Back
          </button>
          <button
            onClick={handleGoHome}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
