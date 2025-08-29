import React from 'react';

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Popover = ({ trigger, children, open, onOpenChange }: PopoverProps) => {
  const [isOpen, setIsOpen] = React.useState(open || false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onOpenChange]);

  const handleTriggerClick = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <div onClick={handleTriggerClick}>{trigger}</div>
      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 rounded-md border bg-white p-4 shadow-md">
          {children}
        </div>
      )}
    </div>
  );
};

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('grid gap-4', className)} {...props} />
));
PopoverContent.displayName = 'PopoverContent';

// Export PopoverTrigger as a compatibility alias (not actually needed in this implementation)
export const PopoverTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export { Popover, PopoverContent, type PopoverProps };