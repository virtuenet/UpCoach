import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ 
    className, 
    children, 
    value, 
    onValueChange, 
    ...props 
  }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) {
        onValueChange(event.target.value);
      }
    };

    return (
      <div 
        ref={ref}
        role="radiogroup" 
        className={cn("space-y-2", className)} 
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              checked: child.props.value === value,
              onChange: handleChange,
            });
          }
          return child;
        })}
      </div>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ children, value, className, ...props }, ref) => {
    return (
      <label 
        className={cn(
          "flex items-center space-x-2 cursor-pointer",
          "data-[state=checked]:text-primary",
          className
        )}
      >
        <input
          type="radio"
          value={value}
          ref={ref}
          className="form-radio text-primary focus:ring-primary"
          {...props}
        />
        {children}
      </label>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";