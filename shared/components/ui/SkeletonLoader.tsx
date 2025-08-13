import React from 'react';

export type SkeletonVariant = 'text' | 'card' | 'table' | 'chart' | 'avatar' | 'button';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  animate?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  animate = true,
}) => {
  const baseClasses = `skeleton-base bg-gray-200 dark:bg-gray-700 ${
    animate ? 'skeleton-shimmer' : ''
  } ${className}`;

  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div
            className={`${baseClasses} rounded`}
            style={{
              width: width || '100%',
              height: height || '1rem',
            }}
          />
        );

      case 'card':
        return (
          <div className={`${baseClasses} rounded-lg p-4`}>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 skeleton-shimmer skeleton-stagger-1" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded skeleton-shimmer skeleton-stagger-2" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 skeleton-shimmer skeleton-stagger-3" />
            </div>
          </div>
        );

      case 'table':
        return (
          <div className={`${baseClasses} rounded-lg`}>
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'chart':
        return (
          <div
            className={`${baseClasses} rounded-lg`}
            style={{
              width: width || '100%',
              height: height || '300px',
            }}
          >
            <div className="p-4 h-full flex items-end justify-between">
              {[...Array(7)].map((_, i) => {
                // Generate stable heights based on index
                const heights = [45, 70, 55, 80, 60, 40, 65];
                return (
                  <div
                    key={i}
                    className="bg-gray-300 dark:bg-gray-600 rounded-t transition-all"
                    style={{
                      width: '12%',
                      height: `${heights[i % heights.length]}%`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );

      case 'avatar':
        return (
          <div
            className={`${baseClasses} rounded-full`}
            style={{
              width: width || '48px',
              height: height || '48px',
            }}
          />
        );

      case 'button':
        return (
          <div
            className={`${baseClasses} rounded-md`}
            style={{
              width: width || '120px',
              height: height || '40px',
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div 
          key={index} 
          className={`${count > 1 ? 'mb-3' : ''} skeleton-stagger-${Math.min(index + 1, 5)}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

// Specialized skeleton components for common use cases
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <SkeletonLoader variant="card" count={count} />
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <SkeletonLoader width="200px" height="24px" />
    </div>
    <div className="p-6">
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <SkeletonLoader width="40px" height="40px" variant="avatar" />
            <div className="flex-1 space-y-2">
              <SkeletonLoader width="60%" height="16px" />
              <SkeletonLoader width="40%" height="14px" />
            </div>
            <SkeletonLoader width="80px" height="32px" variant="button" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '300px' }) => (
  <SkeletonLoader variant="chart" height={height} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
    
    {/* Table */}
    <TableSkeleton />
  </div>
);

// CSS for shimmer effect (add to global styles or CSS-in-JS)
export const skeletonStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .skeleton-base {
    position: relative;
    overflow: hidden;
  }

  .skeleton-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 20%,
      rgba(255, 255, 255, 0.5) 50%,
      rgba(255, 255, 255, 0.2) 80%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .dark .skeleton-shimmer::after {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.05) 20%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 80%,
      rgba(255, 255, 255, 0) 100%
    );
  }

  /* Staggered animation for multiple skeletons */
  .skeleton-stagger-1 { animation-delay: 0.1s; }
  .skeleton-stagger-2 { animation-delay: 0.2s; }
  .skeleton-stagger-3 { animation-delay: 0.3s; }
  .skeleton-stagger-4 { animation-delay: 0.4s; }
  .skeleton-stagger-5 { animation-delay: 0.5s; }
`;

export default SkeletonLoader;