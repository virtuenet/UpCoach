import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className,
  ...props
}) => {
  const baseStyles = 'bg-gray-200';

  const animations = {
    pulse: 'animate-pulse',
    wave: 'skeleton', // Uses CSS animation defined in layout-fixes.css
    none: '',
  };

  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const getSize = () => {
    const style: React.CSSProperties = {};

    if (width) {
      style.width = typeof width === 'number' ? `${width}px` : width;
    }

    if (height) {
      style.height = typeof height === 'number' ? `${height}px` : height;
    } else {
      // Default heights based on variant
      if (variant === 'text') style.height = '1rem';
      if (variant === 'circular') {
        style.height = style.width || '40px';
        style.width = style.width || '40px';
      }
      if (variant === 'rectangular') style.height = '120px';
    }

    return style;
  };

  return (
    <div
      className={cn(baseStyles, animations[animation], variants[variant], className)}
      style={getSize()}
      aria-busy="true"
      aria-label="Loading..."
      role="status"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Composite skeleton components for common patterns
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
    ))}
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" className="mt-2" />
      </div>
    </div>
    <Skeleton variant="rectangular" height={100} />
    <div className="mt-4 space-y-2">
      <Skeleton variant="text" />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="bg-white rounded-lg border border-gray-200">
    <div className="border-b border-gray-200 p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width="60%" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" width="80%" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
