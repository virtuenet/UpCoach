import React from 'react';
import { cn } from '../../utils/cn';

interface DarkModeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  position?: 'fixed' | 'relative';
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  className,
  size = 'md',
  showLabel = false,
  position = 'relative',
}) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Initialize theme on mount
  React.useEffect(() => {
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme === 'dark' || (!savedTheme && systemPreference);

    setIsDarkMode(initialDarkMode);
    applyTheme(initialDarkMode);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
        applyTheme(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (dark: boolean) => {
    const root = document.documentElement;

    // Add no-transitions class to prevent flash
    root.classList.add('no-transitions');

    // Apply theme
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.classList.toggle('dark', dark);

    // Store preference
    localStorage.setItem('theme', dark ? 'dark' : 'light');

    // Remove no-transitions after a frame
    requestAnimationFrame(() => {
      root.classList.remove('no-transitions');
    });
  };

  const toggleDarkMode = () => {
    setIsAnimating(true);
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    applyTheme(newMode);

    // Reset animation state
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizes = {
    sm: { toggle: 'w-10 h-6', circle: 'w-4 h-4', translate: 'translate-x-4' },
    md: { toggle: 'w-14 h-7', circle: 'w-5 h-5', translate: 'translate-x-7' },
    lg: { toggle: 'w-16 h-8', circle: 'w-6 h-6', translate: 'translate-x-8' },
  };

  const positionStyles = position === 'fixed' ? 'fixed top-4 right-4 z-50' : '';

  return (
    <div className={cn('flex items-center gap-3', positionStyles, className)}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDarkMode ? 'Dark' : 'Light'}
        </span>
      )}

      <button
        onClick={toggleDarkMode}
        className={cn(
          'relative inline-flex items-center rounded-full p-1 transition-colors duration-200',
          'bg-gray-200 dark:bg-gray-700',
          'hover:bg-gray-300 dark:hover:bg-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'dark:focus:ring-offset-gray-900',
          sizes[size].toggle
        )}
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        aria-pressed={isDarkMode}
      >
        {/* Sun icon (light mode) */}
        <svg
          className={cn(
            'absolute left-1 transition-opacity duration-200',
            isDarkMode ? 'opacity-0' : 'opacity-100',
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>

        {/* Moon icon (dark mode) */}
        <svg
          className={cn(
            'absolute right-1 transition-opacity duration-200',
            isDarkMode ? 'opacity-100' : 'opacity-0',
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>

        {/* Toggle circle */}
        <span
          className={cn(
            'block rounded-full bg-white shadow-md',
            'transform transition-transform duration-200',
            sizes[size].circle,
            isDarkMode ? sizes[size].translate : 'translate-x-0',
            isAnimating && 'scale-110'
          )}
        />
      </button>
    </div>
  );
};

// Hook for using dark mode in components
export const useDarkModeContext = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme === 'dark');
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return isDarkMode;
};

export default DarkModeToggle;
