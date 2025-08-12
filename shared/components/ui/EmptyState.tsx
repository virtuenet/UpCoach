import React from 'react';
import { cn } from '../../utils/cn';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'card';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
  ...props
}) => {
  const baseStyles = 'flex flex-col items-center justify-center text-center';
  
  const variants = {
    default: 'py-12 px-4',
    minimal: 'py-8 px-4',
    card: 'py-12 px-4 bg-white rounded-lg border border-gray-200',
  };
  
  // Default icon if none provided
  const defaultIcon = (
    <svg
      className="h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );
  
  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {(icon || defaultIcon) && (
        <div className="mb-4" aria-hidden="true">
          {icon || defaultIcon}
        </div>
      )}
      
      <h3 className="text-sm font-medium text-gray-900 mb-1">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

// Pre-configured empty states for common use cases
export const NoDataEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    title="No data available"
    description="There's no data to display at the moment. Try adjusting your filters or check back later."
    action={
      onAction && (
        <button
          onClick={onAction}
          className="text-sm text-blue-600 hover:text-blue-500 font-medium"
        >
          Refresh data
        </button>
      )
    }
  />
);

export const NoSearchResultsEmptyState: React.FC<{ searchTerm?: string; onClear?: () => void }> = ({
  searchTerm,
  onClear,
}) => (
  <EmptyState
    icon={
      <svg
        className="h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    }
    title="No results found"
    description={
      searchTerm
        ? `No results found for "${searchTerm}". Try adjusting your search.`
        : 'No results match your search criteria.'
    }
    action={
      onClear && (
        <button
          onClick={onClear}
          className="text-sm text-blue-600 hover:text-blue-500 font-medium"
        >
          Clear search
        </button>
      )
    }
  />
);

export const ErrorEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon={
      <svg
        className="h-12 w-12 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    }
    title="Something went wrong"
    description="We couldn't load the data. Please try again."
    action={
      onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Try again
        </button>
      )
    }
    variant="card"
  />
);

export default EmptyState;