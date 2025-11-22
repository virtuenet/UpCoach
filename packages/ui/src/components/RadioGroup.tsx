import React from 'react';

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  className?: string;
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  className = '',
  disabled = false,
}) => {
  const handleChange = (optionValue: string) => {
    if (!disabled && onChange) {
      onChange(optionValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-center space-x-2 cursor-pointer ${
            (disabled || option.disabled) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          } p-2 rounded-md transition-colors`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            disabled={disabled || option.disabled}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
};