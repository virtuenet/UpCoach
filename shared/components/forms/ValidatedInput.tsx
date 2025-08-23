import React, { useState, useEffect, useCallback, useRef } from 'react';
import { z, ZodSchema, ZodError } from 'zod';
import { cn } from '../../utils/cn';
import debounce from 'lodash/debounce';

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  name: string;
  label?: string;
  schema?: ZodSchema;
  onChange?: (value: string, isValid: boolean) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  validateOn?: 'change' | 'blur' | 'both';
  debounceMs?: number;
  showSuccessIcon?: boolean;
  helpText?: string;
  asyncValidator?: (value: string) => Promise<{ valid: boolean; message?: string }>;
  transformValue?: (value: string) => string;
  errorClassName?: string;
  successClassName?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  name,
  label,
  schema,
  onChange,
  onBlur,
  validateOn = 'both',
  debounceMs = 300,
  showSuccessIcon = true,
  helpText,
  asyncValidator,
  transformValue,
  className,
  errorClassName,
  successClassName,
  required,
  disabled,
  ...props
}) => {
  const [value, setValue] = useState(props.value as string || props.defaultValue as string || '');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced validation function
  const debouncedValidate = useRef(
    debounce(async (val: string) => {
      if (!schema && !asyncValidator) return;

      setIsValidating(true);
      let hasError = false;
      
      try {
        // Zod validation
        if (schema) {
          await schema.parseAsync(val);
        }

        // Async validation
        if (asyncValidator && val) {
          const result = await asyncValidator(val);
          if (!result.valid) {
            setError(result.message || 'Validation failed');
            hasError = true;
          }
        }

        if (!hasError) {
          setError(null);
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (err) {
        if (err instanceof ZodError) {
          setError(err.errors[0]?.message || 'Invalid input');
        } else {
          setError('Validation error');
        }
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    }, debounceMs)
  ).current;

  // Cancel debounced validation on unmount
  useEffect(() => {
    return () => {
      debouncedValidate.cancel();
    };
  }, [debouncedValidate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Apply transformation if provided
    if (transformValue) {
      newValue = transformValue(newValue);
    }
    
    setValue(newValue);
    setIsDirty(true);

    // Clear error immediately for better UX
    if (error && newValue !== value) {
      setError(null);
    }

    // Validate on change if configured
    if ((validateOn === 'change' || validateOn === 'both') && (isDirty || isTouched)) {
      debouncedValidate(newValue);
    }

    // Call parent onChange
    onChange?.(newValue, false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsTouched(true);
    
    // Validate on blur if configured
    if (validateOn === 'blur' || validateOn === 'both') {
      debouncedValidate.cancel();
      debouncedValidate(value);
    }

    onBlur?.(e);
  };

  // Determine visual state
  const showError = error && (isDirty || isTouched) && !isValidating;
  const showSuccess = isValid && showSuccessIcon && (isDirty || isTouched) && !isValidating && !error;

  // Animation classes for smooth transitions
  const inputClasses = cn(
    'w-full px-3 py-2 rounded-md transition-all duration-200',
    'border focus:outline-none focus:ring-2 focus:ring-offset-1',
    {
      'border-gray-300 focus:border-blue-500 focus:ring-blue-500': !showError && !showSuccess,
      'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-950': showError,
      'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50 dark:bg-green-950': showSuccess,
      'opacity-50 cursor-not-allowed': disabled,
      'pr-10': showError || showSuccess || isValidating,
    },
    className
  );

  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={name}
          className={cn(
            'block text-sm font-medium mb-1 transition-colors duration-200',
            {
              'text-gray-700 dark:text-gray-300': !showError,
              'text-red-600 dark:text-red-400': showError,
              'text-green-600 dark:text-green-400': showSuccess,
            }
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={showError}
          aria-describedby={`${name}-error ${name}-help`}
          {...props}
        />

        {/* Status icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          {isValidating && (
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}

          {showError && (
            <svg
              className="h-5 w-5 text-red-500 animate-shake"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}

          {showSuccess && (
            <svg
              className="h-5 w-5 text-green-500 animate-scale-in"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Error message with animation */}
      {showError && (
        <p
          id={`${name}-error`}
          className={cn(
            'mt-1 text-sm text-red-600 dark:text-red-400 animate-slide-down',
            errorClassName
          )}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Success message */}
      {showSuccess && !error && successClassName && (
        <p
          className={cn(
            'mt-1 text-sm text-green-600 dark:text-green-400 animate-slide-down',
            successClassName
          )}
        >
          Looks good!
        </p>
      )}

      {/* Help text */}
      {helpText && !showError && (
        <p
          id={`${name}-help`}
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

// Password strength indicator component
export const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const getStrength = useCallback((pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  }, []);

  const strength = getStrength(password);
  const percentage = (strength / 5) * 100;

  const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][Math.max(0, strength - 1)];
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'][Math.max(0, strength - 1)];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">Password strength</span>
        <span className={cn('text-xs font-medium', {
          'text-red-600': strength <= 1,
          'text-orange-600': strength === 2,
          'text-yellow-600': strength === 3,
          'text-lime-600': strength === 4,
          'text-green-600': strength === 5,
        })}>
          {strengthText}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300 ease-out', strengthColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ValidatedInput;