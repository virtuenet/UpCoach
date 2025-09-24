import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { clsx } from 'clsx';

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, error, id, ...props }, ref) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <CheckboxPrimitive.Root
          ref={ref}
          id={checkboxId}
          className={clsx(
            'peer h-4 w-4 shrink-0 rounded-sm border border-gray-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
            'data-[state=checked]:text-white',
            error && 'border-red-300',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${checkboxId}-error` : description ? `${checkboxId}-description` : undefined}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
      </div>
      {(label || description || error) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
          {description && (
            <p id={`${checkboxId}-description`} className="text-sm text-gray-500">
              {description}
            </p>
          )}
          {error && (
            <p id={`${checkboxId}-error`} className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';