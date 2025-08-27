/**
 * Skeleton Loading Components
 * Provides loading placeholders for better perceived performance
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-muted',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1em' : height),
      }}
      {...props}
    />
  );
}

/**
 * Card Skeleton
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 border rounded-lg', className)}>
      <Skeleton variant="rectangular" height={200} className="mb-4" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" width="60%" />
    </div>
  );
}

/**
 * List Item Skeleton
 */
export function ListItemSkeleton({ 
  showAvatar = true,
  lines = 2 
}: { 
  showAvatar?: boolean;
  lines?: number;
}) {
  return (
    <div className="flex items-start space-x-4 p-4">
      {showAvatar && (
        <Skeleton variant="circular" width={40} height={40} />
      )}
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="40%" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <Skeleton key={i} variant="text" width="100%" />
        ))}
      </div>
    </div>
  );
}

/**
 * Table Skeleton
 */
export function TableSkeleton({ 
  rows = 5,
  columns = 4 
}: { 
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex border-b p-4 bg-muted/50">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 px-2">
            <Skeleton variant="text" width="80%" />
          </div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex border-b p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 px-2">
              <Skeleton 
                variant="text" 
                width={`${Math.random() * 40 + 60}%`} 
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Chart Skeleton
 */
export function ChartSkeleton({ 
  height = 300 
}: { 
  height?: number;
}) {
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full space-x-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            className="flex-1"
            height={`${Math.random() * 60 + 40}%`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Form Skeleton
 */
export function FormSkeleton({ 
  fields = 4 
}: { 
  fields?: number;
}) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="rounded" height={40} />
        </div>
      ))}
      <div className="flex space-x-4">
        <Skeleton variant="rounded" width={100} height={40} />
        <Skeleton variant="rounded" width={100} height={40} />
      </div>
    </div>
  );
}

/**
 * Dashboard Skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="40%" height={32} />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg">
          <Skeleton variant="text" width="40%" className="mb-4" />
          <ChartSkeleton height={250} />
        </div>
        <div className="p-6 border rounded-lg">
          <Skeleton variant="text" width="40%" className="mb-4" />
          <ChartSkeleton height={250} />
        </div>
      </div>
      
      {/* Table */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <Skeleton variant="text" width="30%" />
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}

/**
 * Content Editor Skeleton
 */
export function ContentEditorSkeleton() {
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center space-x-2 p-4 border rounded-lg">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={32} height={32} />
        ))}
      </div>
      
      {/* Editor */}
      <div className="p-4 border rounded-lg min-h-[400px]">
        <Skeleton variant="text" width="80%" className="mb-4" />
        <Skeleton variant="text" width="100%" className="mb-2" />
        <Skeleton variant="text" width="100%" className="mb-2" />
        <Skeleton variant="text" width="70%" className="mb-4" />
        <Skeleton variant="text" width="90%" className="mb-2" />
        <Skeleton variant="text" width="100%" />
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Skeleton variant="rounded" width={100} height={40} />
        <Skeleton variant="rounded" width={100} height={40} />
      </div>
    </div>
  );
}

/**
 * Profile Skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="space-y-2">
          <Skeleton variant="text" width={200} height={24} />
          <Skeleton variant="text" width={150} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="80%" height={20} />
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        <Skeleton variant="text" width="30%" height={24} />
        <Skeleton variant="rectangular" height={100} />
      </div>
    </div>
  );
}

/**
 * Media Gallery Skeleton
 */
export function MediaGallerySkeleton({ 
  items = 12 
}: { 
  items?: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="aspect-square">
          <Skeleton variant="rounded" className="w-full h-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Navigation Skeleton
 */
export function NavigationSkeleton({ 
  items = 5 
}: { 
  items?: number;
}) {
  return (
    <nav className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={`${Math.random() * 40 + 60}%`} />
        </div>
      ))}
    </nav>
  );
}

/**
 * Comment Skeleton
 */
export function CommentSkeleton() {
  return (
    <div className="flex space-x-3 p-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton variant="text" width={120} />
          <Skeleton variant="text" width={80} height={14} />
        </div>
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  );
}

/**
 * Skeleton Container with loading state management
 */
export function SkeletonContainer({
  isLoading,
  skeleton,
  children,
  fallback,
}: {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  if (!children && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Add shimmer animation to global styles
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .animate-shimmer {
    background: linear-gradient(
      90deg,
      hsl(var(--muted)) 0px,
      hsl(var(--muted-foreground) / 0.1) 20px,
      hsl(var(--muted)) 40px
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite linear;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerStyles;
  document.head.appendChild(style);
}