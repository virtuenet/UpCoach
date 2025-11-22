import React, { useMemo, useEffect, useRef } from 'react';

interface PasswordStrengthProps {
  password: string;
  onStrengthChange?: (strength: PasswordStrength) => void;
  showRequirements?: boolean;
  className?: string;
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

export interface PasswordStrength {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  requirements: PasswordRequirement[];
  isValid: boolean;
}

interface PasswordRequirement {
  label: string;
  met: boolean;
  description: string;
}

/**
 * Accessible password strength indicator with real-time feedback
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthProps> = ({
  password,
  onStrengthChange,
  showRequirements = true,
  className = '',
  minLength = 8,
  requireUppercase = true,
  requireLowercase = true,
  requireNumbers = true,
  requireSpecialChars = true,
}) => {
  const announcementRef = useRef<HTMLDivElement>(null);
  const lastAnnouncedLevel = useRef<string>('');

  const strength = useMemo(() => {
    const requirements: PasswordRequirement[] = [];
    const feedback: string[] = [];
    let score = 0;

    // Check minimum length
    const hasMinLength = password.length >= minLength;
    requirements.push({
      label: `At least ${minLength} characters`,
      met: hasMinLength,
      description: `Password must be at least ${minLength} characters long`,
    });
    if (hasMinLength) score += 20;
    else feedback.push(`Use at least ${minLength} characters`);

    // Check uppercase
    if (requireUppercase) {
      const hasUppercase = /[A-Z]/.test(password);
      requirements.push({
        label: 'One uppercase letter',
        met: hasUppercase,
        description: 'Include at least one uppercase letter (A-Z)',
      });
      if (hasUppercase) score += 20;
      else feedback.push('Add an uppercase letter');
    }

    // Check lowercase
    if (requireLowercase) {
      const hasLowercase = /[a-z]/.test(password);
      requirements.push({
        label: 'One lowercase letter',
        met: hasLowercase,
        description: 'Include at least one lowercase letter (a-z)',
      });
      if (hasLowercase) score += 20;
      else feedback.push('Add a lowercase letter');
    }

    // Check numbers
    if (requireNumbers) {
      const hasNumbers = /\d/.test(password);
      requirements.push({
        label: 'One number',
        met: hasNumbers,
        description: 'Include at least one number (0-9)',
      });
      if (hasNumbers) score += 20;
      else feedback.push('Add a number');
    }

    // Check special characters
    if (requireSpecialChars) {
      const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      requirements.push({
        label: 'One special character',
        met: hasSpecialChars,
        description: 'Include at least one special character (!@#$%^&*)',
      });
      if (hasSpecialChars) score += 20;
      else feedback.push('Add a special character');
    }

    // Bonus points for extra length
    if (password.length > 12) score += 10;
    if (password.length > 16) score += 10;

    // Check for common patterns (penalties)
    if (password.length > 0) {
      // Repeated characters
      if (/(.)\1{2,}/.test(password)) {
        score -= 10;
        feedback.push('Avoid repeated characters');
      }

      // Sequential characters
      if (
        /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
          password
        )
      ) {
        score -= 10;
        feedback.push('Avoid sequential characters');
      }

      // Common passwords
      const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
      if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        score -= 20;
        feedback.push('Avoid common passwords');
      }
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine level
    let level: PasswordStrength['level'];
    if (score < 40) level = 'weak';
    else if (score < 60) level = 'fair';
    else if (score < 80) level = 'good';
    else level = 'strong';

    // Check if all requirements are met
    const isValid = requirements.every(req => req.met);

    return {
      score,
      level,
      feedback,
      requirements,
      isValid,
    };
  }, [
    password,
    minLength,
    requireUppercase,
    requireLowercase,
    requireNumbers,
    requireSpecialChars,
  ]);

  // Notify parent of strength changes
  useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(strength);
    }
  }, [strength, onStrengthChange]);

  // Announce strength changes to screen readers
  useEffect(() => {
    if (strength.level !== lastAnnouncedLevel.current && password.length > 0) {
      lastAnnouncedLevel.current = strength.level;

      const announcement = `Password strength: ${strength.level}. ${
        strength.isValid
          ? 'All requirements met.'
          : `${strength.requirements.filter(r => !r.met).length} requirements remaining.`
      }`;

      // Create announcement for screen readers
      const announceElement = document.createElement('div');
      announceElement.setAttribute('role', 'status');
      announceElement.setAttribute('aria-live', 'polite');
      announceElement.className = 'sr-only';
      announceElement.textContent = announcement;
      document.body.appendChild(announceElement);

      setTimeout(() => {
        document.body.removeChild(announceElement);
      }, 1000);
    }
  }, [strength, password]);

  const getStrengthColor = () => {
    switch (strength.level) {
      case 'weak':
        return 'bg-red-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'good':
        return 'bg-blue-500';
      case 'strong':
        return 'bg-green-500';
    }
  };

  const getStrengthTextColor = () => {
    switch (strength.level) {
      case 'weak':
        return 'text-red-700';
      case 'fair':
        return 'text-yellow-700';
      case 'good':
        return 'text-blue-700';
      case 'strong':
        return 'text-green-700';
    }
  };

  const getStrengthLabel = () => {
    switch (strength.level) {
      case 'weak':
        return 'Weak';
      case 'fair':
        return 'Fair';
      case 'good':
        return 'Good';
      case 'strong':
        return 'Strong';
    }
  };

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={`text-sm font-medium ${getStrengthTextColor()}`} aria-live="polite">
            {getStrengthLabel()}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${getStrengthLabel()}, ${strength.score}%`}
        >
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      {/* Requirements list */}
      {showRequirements && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Requirements:</p>
          <ul className="space-y-1" role="list">
            {strength.requirements.map((req, index) => (
              <li key={index} className="flex items-center text-sm" role="listitem">
                {/* Icon */}
                <span className="mr-2" aria-hidden="true">
                  {req.met ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>

                {/* Label */}
                <span
                  className={req.met ? 'text-green-700' : 'text-gray-600'}
                  title={req.description}
                >
                  {req.label}
                  <span className="sr-only">
                    {req.met ? ' - Requirement met' : ' - Requirement not met'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback for improvements */}
      {strength.feedback.length > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded" role="alert">
          <p className="font-medium mb-1">Suggestions:</p>
          <ul className="list-disc list-inside">
            {strength.feedback.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hidden announcement for screen readers */}
      <div
        ref={announcementRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
};

/**
 * Hook for password strength validation
 */
export function usePasswordStrength(password: string, options?: Partial<PasswordStrengthProps>) {
  const [strength, setStrength] = React.useState<PasswordStrength>({
    score: 0,
    level: 'weak',
    feedback: [],
    requirements: [],
    isValid: false,
  });

  const handleStrengthChange = React.useCallback((newStrength: PasswordStrength) => {
    setStrength(newStrength);
  }, []);

  return {
    strength,
    PasswordStrengthComponent: (
      <PasswordStrengthIndicator
        password={password}
        onStrengthChange={handleStrengthChange}
        {...options}
      />
    ),
  };
}

export default PasswordStrengthIndicator;
