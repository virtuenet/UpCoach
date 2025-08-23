import React, { useState, useCallback, useRef, FormEvent } from 'react';
import { z, ZodSchema, ZodError } from 'zod';
import { cn } from '../../utils/cn';

interface FormField {
  name: string;
  value: any;
  error: string | null;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
}

interface ValidatedFormProps {
  schema: ZodSchema;
  onSubmit: (data: any) => void | Promise<void>;
  onError?: (errors: Record<string, string>) => void;
  children: React.ReactNode;
  className?: string;
  validateOnSubmit?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showGlobalError?: boolean;
  submitOnEnter?: boolean;
  resetOnSubmit?: boolean;
}

interface FormContextValue {
  fields: Record<string, FormField>;
  registerField: (name: string, initialValue?: any) => void;
  updateField: (name: string, value: any) => void;
  setFieldError: (name: string, error: string | null) => void;
  setFieldTouched: (name: string) => void;
  validateField: (name: string) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  isSubmitting: boolean;
  formError: string | null;
}

const FormContext = React.createContext<FormContextValue | null>(null);

export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within ValidatedForm');
  }
  return context;
};

export const ValidatedForm: React.FC<ValidatedFormProps> = ({
  schema,
  onSubmit,
  onError,
  children,
  className,
  validateOnSubmit = true,
  validateOnChange = false,
  validateOnBlur = true,
  showGlobalError = true,
  submitOnEnter = false,
  resetOnSubmit = false,
}) => {
  const [fields, setFields] = useState<Record<string, FormField>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const registerField = useCallback((name: string, initialValue: any = '') => {
    setFields(prev => ({
      ...prev,
      [name]: {
        name,
        value: initialValue,
        error: null,
        isValid: false,
        isDirty: false,
        isTouched: false,
      },
    }));
  }, []);

  const updateField = useCallback((name: string, value: any) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        isDirty: true,
      },
    }));

    if (validateOnChange) {
      validateField(name);
    }
  }, [validateOnChange]);

  const setFieldError = useCallback((name: string, error: string | null) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
        isValid: !error,
      },
    }));
  }, []);

  const setFieldTouched = useCallback((name: string) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        isTouched: true,
      },
    }));

    if (validateOnBlur) {
      validateField(name);
    }
  }, [validateOnBlur]);

  const validateField = useCallback(async (name: string): Promise<boolean> => {
    const field = fields[name];
    if (!field) return false;

    try {
      // Get the specific field schema if it exists
      const fieldSchema = schema.shape?.[name] || schema;
      await fieldSchema.parseAsync(field.value);
      
      setFieldError(name, null);
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        setFieldError(name, error.errors[0]?.message || 'Invalid input');
      }
      return false;
    }
  }, [fields, schema]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    const formData = Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.value])
    );

    try {
      await schema.parseAsync(formData);
      setFormError(null);
      
      // Clear all field errors
      Object.keys(fields).forEach(name => {
        setFieldError(name, null);
      });
      
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (path && !errors[path]) {
            errors[path] = err.message;
            setFieldError(path, err.message);
          }
        });

        if (error.errors.length > 0 && !error.errors[0].path.length) {
          setFormError(error.errors[0].message);
        }

        onError?.(errors);
      }
      return false;
    }
  }, [fields, schema, onError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    // Mark all fields as touched
    Object.keys(fields).forEach(name => {
      setFieldTouched(name);
    });

    let isValid = true;
    if (validateOnSubmit) {
      isValid = await validateForm();
    }

    if (isValid) {
      const formData = Object.fromEntries(
        Object.entries(fields).map(([key, field]) => [key, field.value])
      );

      try {
        await onSubmit(formData);
        
        if (resetOnSubmit) {
          // Reset form
          Object.keys(fields).forEach(name => {
            updateField(name, '');
            setFieldError(name, null);
            setFieldTouched(name);
          });
        }
      } catch (error) {
        setFormError('An error occurred while submitting the form');
      }
    }

    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (submitOnEnter && e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
  };

  const contextValue: FormContextValue = {
    fields,
    registerField,
    updateField,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    isSubmitting,
    formError,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className={cn('space-y-4', className)}
        noValidate
      >
        {showGlobalError && formError && (
          <div
            className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md animate-shake"
            role="alert"
          >
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  There was an error with your submission
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {formError}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {children}
      </form>
    </FormContext.Provider>
  );
};

// Form field wrapper component
export const FormField: React.FC<{
  name: string;
  children: (field: FormField) => React.ReactNode;
}> = ({ name, children }) => {
  const { fields } = useFormContext();
  const field = fields[name] || {
    name,
    value: '',
    error: null,
    isValid: false,
    isDirty: false,
    isTouched: false,
  };
  
  return <>{children(field)}</>;
};

// Submit button with loading state
export const SubmitButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
}> = ({ children, className, loadingText = 'Submitting...' }) => {
  const { isSubmitting } = useFormContext();
  
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={cn(
        'px-4 py-2 bg-blue-600 text-white rounded-md font-medium',
        'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        className
      )}
    >
      {isSubmitting ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
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
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default ValidatedForm;