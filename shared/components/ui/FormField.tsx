import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface BaseFormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

interface InputFormFieldProps extends BaseFormFieldProps, InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

interface TextareaFormFieldProps extends BaseFormFieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  type?: 'textarea';
}

type FormFieldProps = InputFormFieldProps | TextareaFormFieldProps;

const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  ({ label, error, hint, required, className, ...props }, ref) => {
    const id = props.id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const hasError = !!error;
    
    const baseInputStyles = cn(
      'block w-full rounded-md border px-3 py-2',
      'text-gray-900 placeholder-gray-400',
      'transition-colors duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'
    );
    
    const isTextarea = props.type === 'textarea';
    
    return (
      <div className={cn('space-y-1', className)}>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-label="required">
              *
            </span>
          )}
        </label>
        
        <div className="relative">
          {!isTextarea && 'leftIcon' in props && props.leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {props.leftIcon}
              </span>
            </div>
          )}
          
          {isTextarea ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={id}
              className={cn(
                baseInputStyles,
                'min-h-[80px] resize-y'
              )}
              aria-invalid={hasError}
              aria-describedby={
                hasError ? `${id}-error` : hint ? `${id}-hint` : undefined
              }
              aria-required={required}
              {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={id}
              className={cn(
                baseInputStyles,
                'leftIcon' in props && props.leftIcon && 'pl-10',
                'rightIcon' in props && props.rightIcon && 'pr-10'
              )}
              aria-invalid={hasError}
              aria-describedby={
                hasError ? `${id}-error` : hint ? `${id}-hint` : undefined
              }
              aria-required={required}
              {...(props as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
          
          {!isTextarea && 'rightIcon' in props && props.rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {props.rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {hasError && (
          <p
            id={`${id}-error`}
            className="text-sm text-red-600 flex items-center"
            role="alert"
          >
            <svg
              className="h-4 w-4 mr-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        
        {hint && !hasError && (
          <p id={`${id}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// Select field component
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFormFieldProps extends BaseFormFieldProps {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export const SelectFormField: React.FC<SelectFormFieldProps> = ({
  label,
  error,
  hint,
  required,
  options,
  placeholder = 'Select an option',
  value,
  onChange,
  disabled,
  className,
}) => {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const hasError = !!error;
  
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <select
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          'block w-full rounded-md border px-3 py-2',
          'text-gray-900 bg-white',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'
        )}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        aria-required={required}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {hasError && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600 flex items-center"
          role="alert"
        >
          <svg
            className="h-4 w-4 mr-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      
      {hint && !hasError && (
        <p id={`${id}-hint`} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
};

export default FormField;