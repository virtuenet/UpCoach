import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

const alertVariants = {
  default: 'bg-white text-gray-950 border-gray-200',
  destructive: 'border-red-500/50 text-red-600 bg-red-50',
  success: 'border-green-500/50 text-green-600 bg-green-50',
  warning: 'border-yellow-500/50 text-yellow-600 bg-yellow-50',
};

const iconMap = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle,
  warning: AlertCircle,
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof alertVariants;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const Icon = iconMap[variant];
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4 flex items-start gap-3',
          alertVariants[variant],
          className
        )}
        {...props}
      >
        <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1">{children}</div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };