import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right';
  onClose?: () => void;
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </>
  );
};

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = 'right', children, onClose, ...props }, ref) => {
    const sideClasses = {
      left: 'left-0 border-r',
      right: 'right-0 border-l',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'fixed top-0 z-50 h-full w-full bg-white p-6 shadow-lg transition-all duration-300 sm:max-w-sm',
          sideClasses[side],
          className
        )}
        {...props}
      >
        {onClose && (
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
        {children}
      </div>
    );
  }
);
SheetContent.displayName = 'SheetContent';

export { Sheet, SheetContent };