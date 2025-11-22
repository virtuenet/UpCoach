import React, { FormEvent, useEffect, useState, useRef } from 'react';

interface AccessibleFormProps {
  children: React.ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  className?: string;
  csrfToken?: string;
  isSubmitting?: boolean;
  errors?: string[];
  successMessage?: string;
  formId?: string;
  ariaLabel?: string;
}

/**
 * Accessible form component with built-in CSRF handling and ARIA support
 */
export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  children,
  onSubmit,
  className = '',
  csrfToken,
  isSubmitting = false,
  errors = [],
  successMessage,
  formId,
  ariaLabel,
}) => {
  const [announcement, setAnnouncement] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Announce form status changes to screen readers
  useEffect(() => {
    if (errors.length > 0) {
      const errorCount = errors.length;
      const message = `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please review and correct.`;
      setAnnouncement(message);

      // Focus error summary for keyboard users
      if (errorSummaryRef.current) {
        errorSummaryRef.current.focus();
      }
    } else if (successMessage) {
      setAnnouncement(successMessage);
    } else if (isSubmitting) {
      setAnnouncement('Form is being submitted. Please wait.');
    }
  }, [errors, successMessage, isSubmitting]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous announcements
    setAnnouncement('');

    // Call parent submit handler
    await onSubmit(e);
  };

  return (
    <form
      ref={formRef}
      id={formId}
      onSubmit={handleSubmit}
      className={className}
      aria-label={ariaLabel}
      aria-busy={isSubmitting}
      aria-invalid={errors.length > 0}
      noValidate // Use custom validation for better accessibility
    >
      {/* Hidden CSRF token input */}
      {csrfToken && <input type="hidden" name="_csrf" value={csrfToken} />}

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        aria-relevant="additions"
      >
        {announcement}
      </div>

      {/* Error summary for keyboard navigation */}
      {errors.length > 0 && (
        <div
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          aria-labelledby="error-summary-title"
        >
          <h2 id="error-summary-title" className="text-lg font-semibold text-red-900 mb-2">
            Please correct the following errors:
          </h2>
          <ul className="list-disc list-inside text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div
          role="status"
          className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg"
          aria-live="polite"
        >
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Form content */}
      {children}

      {/* Loading overlay for screen readers */}
      {isSubmitting && (
        <div className="sr-only" aria-live="assertive">
          Processing your request. Please wait.
        </div>
      )}
    </form>
  );
};

interface AccessibleFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * Accessible form field with proper labeling and error handling
 */
export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  helpText,
  autoComplete,
  className = '',
  inputClassName = '',
}) => {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const ariaDescribedBy = [error && errorId, helpText && helpId].filter(Boolean).join(' ');

  return (
    <div className={`mb-4 ${className}`}>
      <label
        htmlFor={fieldId}
        className={`block text-sm font-medium mb-1 ${error ? 'text-red-700' : 'text-gray-700'}`}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      <input
        id={fieldId}
        name={name}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy || undefined}
        aria-required={required}
        className={`
          w-full px-3 py-2 border rounded-md
          ${
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          }
          ${inputClassName}
        `}
      />

      {/* Help text */}
      {helpText && !error && (
        <p id={helpId} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600" aria-live="polite">
          <span className="sr-only">Error:</span> {error}
        </p>
      )}
    </div>
  );
};

interface AccessibleButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
}

/**
 * Accessible button with loading state
 */
export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
  ariaLabel,
  ariaPressed,
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-busy={loading}
      className={`
        relative px-4 py-2 font-medium rounded-md
        ${
          isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2'
        }
        ${className}
      `}
    >
      {/* Loading spinner */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
      )}

      {/* Button content */}
      <span className={loading ? 'invisible' : ''}>{children}</span>

      {/* Screen reader text for loading state */}
      {loading && <span className="sr-only">Loading, please wait</span>}
    </button>
  );
};

export default AccessibleForm;
