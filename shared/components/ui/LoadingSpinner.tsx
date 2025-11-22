interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'gray';
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  color = 'primary',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'border-t-primary-600',
    secondary: 'border-t-secondary-600',
    gray: 'border-t-gray-600',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 ${colorClasses[color]} ${sizeClasses[size]} ${className}`}
    />
  );
}
