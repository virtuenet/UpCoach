import { Suspense, ReactNode } from 'react';
import RouteErrorBoundary from './RouteErrorBoundary';
import LoadingSkeleton from '../LoadingSkeleton';

interface AsyncBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Combines Suspense and Error Boundary for async components
 */
export default function AsyncBoundary({
  children,
  loadingFallback,
  errorFallback,
  onError,
}: AsyncBoundaryProps) {
  return (
    <RouteErrorBoundary fallback={errorFallback} onError={onError} isolate={true}>
      <Suspense fallback={loadingFallback || <LoadingSkeleton />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}
