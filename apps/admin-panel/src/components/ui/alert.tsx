/**
 * Alert component - re-exported from @upcoach/ui
 */
import React from 'react';

// Basic Alert implementation - can be enhanced with @upcoach/ui when available
export interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border px-4 py-3 text-sm ${className} ${
        variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-900' : 'border-blue-200 bg-blue-50 text-blue-900'
      }`}
      {...props}
    >
      {children}
    </div>
  )
);
Alert.displayName = 'Alert';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`text-sm [&_p]:leading-relaxed ${className}`} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';

export const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h5
      ref={ref}
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';