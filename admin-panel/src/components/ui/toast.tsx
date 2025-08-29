import React from 'react';

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'destructive';
}

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'progress';
  onClose?: () => void;
  actions?: ToastAction[];
  progress?: number;
  persistent?: boolean;
}

const toastVariants = {
  default: 'bg-white border-gray-200 text-gray-900',
  destructive: 'bg-red-600 text-white border-red-600',
  success: 'bg-green-600 text-white border-green-600',
  warning: 'bg-yellow-500 text-white border-yellow-500',
  info: 'bg-blue-600 text-white border-blue-600',
  progress: 'bg-white border-gray-200 text-gray-900',
};

const iconVariants = {
  default: null,
  destructive: <AlertCircle className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  progress: <Loader2 className="h-5 w-5 animate-spin" />,
};

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ 
    className, 
    title, 
    description, 
    variant = 'default', 
    onClose, 
    actions,
    progress,
    persistent,
    ...props 
  }, ref) => {
    const icon = iconVariants[variant];
    
    return (
      <div
        ref={ref}
        role="alert"
        aria-live={variant === 'destructive' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={cn(
          'pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-md border p-4 shadow-lg transition-all',
          toastVariants[variant],
          className
        )}
        {...props}
      >
        {icon && (
          <div className="flex-shrink-0" aria-hidden="true">
            {icon}
          </div>
        )}
        
        <div className="flex-1 space-y-2">
          <div className="space-y-1">
            {title && (
              <div className="text-sm font-semibold leading-none">{title}</div>
            )}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
          </div>
          
          {/* Progress bar for progress variant */}
          {variant === 'progress' && progress !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          {actions && actions.length > 0 && (
            <div className="flex items-center space-x-2 pt-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    action.variant === 'primary' 
                      ? 'bg-white/20 hover:bg-white/30'
                      : action.variant === 'destructive'
                      ? 'bg-red-700 hover:bg-red-800 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Close button - only show if not persistent */}
        {onClose && !persistent && (
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = 'Toast';

export { Toast };