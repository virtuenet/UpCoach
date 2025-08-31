import { Loader2 } from 'lucide-react';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'form' | 'list' | 'spinner';
  rows?: number;
  className?: string;
}

export default function LoadingSkeleton({
  type = 'spinner',
  rows = 3,
  className = '',
}: LoadingSkeletonProps) {
  // Spinner loader
  if (type === 'spinner') {
    return (
      <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Card skeleton
  if (type === 'card') {
    return (
      <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  // Table skeleton
  if (type === 'table') {
    return (
      <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex space-x-4">
                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Form skeleton
  if (type === 'form') {
    return (
      <div className={`bg-white rounded-lg shadow p-6 space-y-6 ${className}`}>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        ))}
        <div className="flex space-x-3 pt-4">
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // List skeleton
  if (type === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded"></div>
      ))}
    </div>
  );
}

// Specialized skeleton components
export function CardSkeleton({ className = '' }: { className?: string }) {
  return <LoadingSkeleton type="card" className={className} />;
}

export function TableSkeleton({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return <LoadingSkeleton type="table" rows={rows} className={className} />;
}

export function FormSkeleton({
  fields = 4,
  className = '',
}: {
  fields?: number;
  className?: string;
}) {
  return <LoadingSkeleton type="form" rows={fields} className={className} />;
}

export function ListSkeleton({
  items = 3,
  className = '',
}: {
  items?: number;
  className?: string;
}) {
  return <LoadingSkeleton type="list" rows={items} className={className} />;
}
