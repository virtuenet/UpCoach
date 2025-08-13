import React, { forwardRef, useId, memo } from 'react';
import { Icons } from '../../icons';

// Form Field Types
interface BaseFieldProps {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  helpText?: string;
  error?: string;
  className?: string;
}

interface TextInputProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  maxLength?: number;
}

interface SelectProps extends BaseFieldProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
}

interface TextAreaProps extends BaseFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  maxLength?: number;
}

interface CheckboxProps extends Omit<BaseFieldProps, 'label'> {
  label: React.ReactNode;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface RadioGroupProps extends BaseFieldProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
}

// Accessible Text Input Component with React.memo for performance
export const AccessibleInput = memo(forwardRef<HTMLInputElement, TextInputProps>
  (
    {
      label,
      name,
      type = 'text',
      required = false,
      disabled = false,
      helpText,
      error,
      className = '',
      placeholder,
      value,
      onChange,
      autoComplete,
      maxLength,
      ...props
    },
    ref
  ) => {
    const inputId = useId();
    const errorId = useId();
    const helpTextId = useId();

    const ariaDescribedBy = [
      error && errorId,
      helpText && helpTextId,
    ].filter(Boolean).join(' ');

    return (
      <div className={`form-field ${className}`}>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={ariaDescribedBy || undefined}
            aria-required={required}
            className={`
              w-full px-4 py-3 
              border rounded-lg 
              transition-all duration-200
              focus:outline-none focus:ring-2 
              ${error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }
              ${disabled 
                ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                : 'bg-white dark:bg-gray-800'
              }
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
            `}
            {...props}
          />
          
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <Icons.AlertCircle size={20} />
            </div>
          )}
        </div>

        {helpText && !error && (
          <p id={helpTextId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helpText}
          </p>
        )}

        {error && (
          <p 
            id={errorId} 
            className="mt-1 text-sm text-red-600 dark:text-red-400" 
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

));

AccessibleInput.displayName = 'AccessibleInput';

// Accessible Select Component with React.memo
export const AccessibleSelect = memo(forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      name,
      options,
      required = false,
      disabled = false,
      helpText,
      error,
      className = '',
      placeholder,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const selectId = useId();
    const errorId = useId();
    const helpTextId = useId();

    const ariaDescribedBy = [
      error && errorId,
      helpText && helpTextId,
    ].filter(Boolean).join(' ');

    return (
      <div className={`form-field ${className}`}>
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>

        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={ariaDescribedBy || undefined}
          aria-required={required}
          className={`
            w-full px-4 py-3 
            border rounded-lg 
            transition-all duration-200
            focus:outline-none focus:ring-2 
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }
            ${disabled 
              ? 'bg-gray-100 cursor-not-allowed opacity-60' 
              : 'bg-white dark:bg-gray-800'
            }
            text-gray-900 dark:text-gray-100
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {helpText && !error && (
          <p id={helpTextId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helpText}
          </p>
        )}

        {error && (
          <p 
            id={errorId} 
            className="mt-1 text-sm text-red-600 dark:text-red-400" 
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

));

AccessibleSelect.displayName = 'AccessibleSelect';

// Accessible TextArea Component with React.memo
export const AccessibleTextArea = memo(forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      name,
      required = false,
      disabled = false,
      helpText,
      error,
      className = '',
      placeholder,
      value,
      onChange,
      rows = 4,
      maxLength,
      ...props
    },
    ref
  ) => {
    const textareaId = useId();
    const errorId = useId();
    const helpTextId = useId();

    const ariaDescribedBy = [
      error && errorId,
      helpText && helpTextId,
    ].filter(Boolean).join(' ');

    return (
      <div className={`form-field ${className}`}>
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={ariaDescribedBy || undefined}
          aria-required={required}
          className={`
            w-full px-4 py-3 
            border rounded-lg 
            transition-all duration-200
            focus:outline-none focus:ring-2 
            resize-y
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }
            ${disabled 
              ? 'bg-gray-100 cursor-not-allowed opacity-60' 
              : 'bg-white dark:bg-gray-800'
            }
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
          `}
          {...props}
        />

        <div className="flex justify-between mt-1">
          <div>
            {helpText && !error && (
              <p id={helpTextId} className="text-sm text-gray-500 dark:text-gray-400">
                {helpText}
              </p>
            )}
            {error && (
              <p 
                id={errorId} 
                className="text-sm text-red-600 dark:text-red-400" 
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
          </div>
          {maxLength && (
            <span className="text-sm text-gray-500">
              {value?.length || 0}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

));

AccessibleTextArea.displayName = 'AccessibleTextArea';

// Accessible Checkbox Component with React.memo
export const AccessibleCheckbox = memo(forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      name,
      checked,
      onChange,
      required = false,
      disabled = false,
      error,
      className = '',
      ...props
    },
    ref
  ) => {
    const checkboxId = useId();
    const errorId = useId();

    return (
      <div className={`form-field ${className}`}>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={checkboxId}
              name={name}
              type="checkbox"
              checked={checked}
              onChange={onChange}
              disabled={disabled}
              required={required}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? errorId : undefined}
              aria-required={required}
              className={`
                h-4 w-4 
                rounded 
                transition-colors
                focus:ring-2 focus:ring-offset-2
                ${error 
                  ? 'text-red-600 focus:ring-red-500' 
                  : 'text-primary-600 focus:ring-primary-500'
                }
                ${disabled 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'cursor-pointer'
                }
              `}
              {...props}
            />
          </div>
          <div className="ml-3 text-sm">
            <label 
              htmlFor={checkboxId} 
              className={`
                font-medium 
                ${disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}
                ${!disabled && 'cursor-pointer'}
              `}
            >
              {label}
              {required && (
                <span className="text-red-500 ml-1" aria-label="required">
                  *
                </span>
              )}
            </label>
          </div>
        </div>
        
        {error && (
          <p 
            id={errorId} 
            className="mt-1 text-sm text-red-600 dark:text-red-400" 
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

));

AccessibleCheckbox.displayName = 'AccessibleCheckbox';

// Accessible Radio Group Component
export const AccessibleRadioGroup: React.FC<RadioGroupProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  helpText,
  error,
  className = '',
}) => {
  const groupId = useId();
  const errorId = useId();
  const helpTextId = useId();

  const ariaDescribedBy = [
    error && errorId,
    helpText && helpTextId,
  ].filter(Boolean).join(' ');

  return (
    <fieldset 
      className={`form-field ${className}`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={ariaDescribedBy || undefined}
      aria-required={required}
    >
      <legend className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </legend>

      <div className="space-y-2" role="radiogroup">
        {options.map((option) => {
          const radioId = `${groupId}-${option.value}`;
          return (
            <div key={option.value} className="flex items-center">
              <input
                id={radioId}
                name={name}
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                className={`
                  h-4 w-4 
                  text-primary-600 
                  focus:ring-2 focus:ring-primary-500
                  ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
              />
              <label 
                htmlFor={radioId} 
                className={`
                  ml-3 text-sm font-medium
                  ${disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}
                  ${!disabled && 'cursor-pointer'}
                `}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>

      {helpText && !error && (
        <p id={helpTextId} className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {error && (
        <p 
          id={errorId} 
          className="mt-2 text-sm text-red-600 dark:text-red-400" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
};

// Form Validation Helper
export const validateForm = (formData: Record<string, any>, rules: Record<string, any>) => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const value = formData[field];
    const fieldRules = rules[field];

    if (fieldRules.required && !value) {
      errors[field] = `${field} is required`;
    }

    if (fieldRules.minLength && value?.length < fieldRules.minLength) {
      errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
    }

    if (fieldRules.maxLength && value?.length > fieldRules.maxLength) {
      errors[field] = `${field} must be no more than ${fieldRules.maxLength} characters`;
    }

    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.message || `${field} is invalid`;
    }

    if (fieldRules.custom) {
      const customError = fieldRules.custom(value, formData);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return errors;
};

export default {
  Input: AccessibleInput,
  Select: AccessibleSelect,
  TextArea: AccessibleTextArea,
  Checkbox: AccessibleCheckbox,
  RadioGroup: AccessibleRadioGroup,
};