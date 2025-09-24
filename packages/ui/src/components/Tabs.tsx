/**
 * Tabs Component
 * Accessible tabs component for organizing content
 */

import React from 'react';

// Tabs Root Component
export interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ children, defaultValue, value, onValueChange, className, ...props }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || '');

    const handleValueChange = (newValue: string) => {
      if (value === undefined) {
        setSelectedValue(newValue);
      }
      onValueChange?.(newValue);
    };

    const currentValue = value !== undefined ? value : selectedValue;

    return (
      <div
        ref={ref}
        className={className}
        data-value={currentValue}
        {...props}
      >
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { value: currentValue, onValueChange: handleValueChange } as any)
            : child
        )}
      </div>
    );
  }
);
Tabs.displayName = "Tabs";

// Tabs List Component
export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className, value, onValueChange, ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className || ''}`}
      role="tablist"
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { value, onValueChange } as any)
          : child
      )}
    </div>
  )
);
TabsList.displayName = "TabsList";

// Tabs Trigger Component
export interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ children, value: triggerValue, className, disabled, onValueChange, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="tab"
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${className || ''}`}
      onClick={() => onValueChange?.(triggerValue)}
      {...props}
    >
      {children}
    </button>
  )
);
TabsTrigger.displayName = "TabsTrigger";

// Tabs Content Component
export interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  currentValue?: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ children, value: contentValue, className, ...props }, ref) => {
    const currentValue = (props as any).value; // Get from parent context
    const isActive = currentValue === contentValue;

    if (!isActive) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className || ''}`}
        role="tabpanel"
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";