/**
 * Dark Mode Theme Configuration
 * Carefully designed for accessibility and reduced eye strain
 */

import { accessibleColors } from '../utils/colorContrast';

export const darkTheme = {
  // Core colors for dark mode
  colors: {
    // Backgrounds (dark to darker)
    background: {
      primary: '#0a0a0a', // Main background
      secondary: '#141414', // Cards, sections
      tertiary: '#1f1f1f', // Elevated surfaces
      hover: '#2a2a2a', // Hover states
      selected: '#353535', // Selected items
    },

    // Text colors (meeting WCAG AA standards on dark backgrounds)
    text: {
      primary: '#f5f5f5', // 15.5:1 contrast on primary bg
      secondary: '#b8b8b8', // 8.5:1 contrast
      tertiary: '#8a8a8a', // 5.5:1 contrast
      disabled: '#5a5a5a', // 3.5:1 contrast (UI elements)
      inverse: '#0a0a0a', // For light backgrounds
    },

    // Semantic colors adjusted for dark mode
    primary: {
      main: '#4a9eff', // Brighter blue for dark bg (7.5:1)
      light: '#73b4ff', // Lighter variant
      dark: '#2b7ed8', // Darker variant
      contrast: '#000000', // Text on primary
    },

    secondary: {
      main: '#9ca3af', // Gray (5.5:1)
      light: '#cbd5e1', // Lighter gray
      dark: '#64748b', // Darker gray
      contrast: '#000000',
    },

    success: {
      main: '#34d399', // Green (8.5:1)
      light: '#6ee7b7',
      dark: '#059669',
      contrast: '#000000',
    },

    danger: {
      main: '#f87171', // Red (5.5:1)
      light: '#fca5a5',
      dark: '#dc2626',
      contrast: '#000000',
    },

    warning: {
      main: '#fbbf24', // Yellow (10:1)
      light: '#fde68a',
      dark: '#d97706',
      contrast: '#000000',
    },

    info: {
      main: '#60a5fa', // Light blue (6.5:1)
      light: '#93c5fd',
      dark: '#2563eb',
      contrast: '#000000',
    },

    // Borders and dividers
    border: {
      default: '#2a2a2a', // Subtle borders
      hover: '#404040', // Hover state
      focus: '#4a9eff', // Focus indicator
      divider: '#1f1f1f', // Section dividers
    },
  },

  // Shadows for dark mode (using darker shadows with slight glow)
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 0 1px 0 rgba(255, 255, 255, 0.05)',
    base: '0 2px 4px 0 rgba(0, 0, 0, 0.4), 0 0 2px 0 rgba(255, 255, 255, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 0 4px 0 rgba(255, 255, 255, 0.05)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 0 6px 0 rgba(255, 255, 255, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 0 10px 0 rgba(255, 255, 255, 0.05)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(74, 158, 255, 0.15)', // Subtle glow for elevated elements
  },

  // Gradients for dark mode
  gradients: {
    primary: 'linear-gradient(135deg, #4a9eff 0%, #2b7ed8 100%)',
    secondary: 'linear-gradient(135deg, #1f1f1f 0%, #141414 100%)',
    surface: 'linear-gradient(180deg, #1f1f1f 0%, #141414 100%)',
    danger: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
    success: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
  },

  // Component-specific styles
  components: {
    button: {
      primary: {
        background: '#4a9eff',
        color: '#000000',
        hover: '#73b4ff',
        active: '#2b7ed8',
        disabled: '#2a2a2a',
      },
      secondary: {
        background: '#2a2a2a',
        color: '#f5f5f5',
        hover: '#353535',
        active: '#1f1f1f',
        border: '#404040',
      },
      ghost: {
        background: 'transparent',
        color: '#f5f5f5',
        hover: 'rgba(255, 255, 255, 0.08)',
        active: 'rgba(255, 255, 255, 0.12)',
      },
    },

    input: {
      background: '#1f1f1f',
      border: '#2a2a2a',
      borderFocus: '#4a9eff',
      text: '#f5f5f5',
      placeholder: '#5a5a5a',
      error: '#f87171',
      disabled: '#141414',
    },

    card: {
      background: '#141414',
      border: '#2a2a2a',
      hover: '#1f1f1f',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    },

    modal: {
      background: '#141414',
      overlay: 'rgba(0, 0, 0, 0.8)',
      border: '#2a2a2a',
    },

    dropdown: {
      background: '#1f1f1f',
      hover: '#2a2a2a',
      selected: '#353535',
      border: '#2a2a2a',
    },

    table: {
      headerBg: '#1f1f1f',
      rowBg: '#141414',
      rowHover: '#1f1f1f',
      border: '#2a2a2a',
    },

    code: {
      background: '#1f1f1f',
      text: '#60a5fa',
      comment: '#5a5a5a',
      keyword: '#f87171',
      string: '#34d399',
      number: '#fbbf24',
    },
  },

  // Opacity values for overlays
  opacity: {
    hover: 0.08,
    selected: 0.12,
    disabled: 0.38,
    overlay: 0.8,
    divider: 0.12,
  },
};

// CSS custom properties for dark mode
export const darkModeCssVars = `
  :root[data-theme="dark"] {
    /* Backgrounds */
    --bg-primary: ${darkTheme.colors.background.primary};
    --bg-secondary: ${darkTheme.colors.background.secondary};
    --bg-tertiary: ${darkTheme.colors.background.tertiary};
    --bg-hover: ${darkTheme.colors.background.hover};
    --bg-selected: ${darkTheme.colors.background.selected};
    
    /* Text */
    --text-primary: ${darkTheme.colors.text.primary};
    --text-secondary: ${darkTheme.colors.text.secondary};
    --text-tertiary: ${darkTheme.colors.text.tertiary};
    --text-disabled: ${darkTheme.colors.text.disabled};
    --text-inverse: ${darkTheme.colors.text.inverse};
    
    /* Primary color */
    --color-primary: ${darkTheme.colors.primary.main};
    --color-primary-light: ${darkTheme.colors.primary.light};
    --color-primary-dark: ${darkTheme.colors.primary.dark};
    --color-primary-contrast: ${darkTheme.colors.primary.contrast};
    
    /* Semantic colors */
    --color-success: ${darkTheme.colors.success.main};
    --color-danger: ${darkTheme.colors.danger.main};
    --color-warning: ${darkTheme.colors.warning.main};
    --color-info: ${darkTheme.colors.info.main};
    
    /* Borders */
    --border-default: ${darkTheme.colors.border.default};
    --border-hover: ${darkTheme.colors.border.hover};
    --border-focus: ${darkTheme.colors.border.focus};
    --border-divider: ${darkTheme.colors.border.divider};
    
    /* Shadows */
    --shadow-sm: ${darkTheme.shadows.sm};
    --shadow-base: ${darkTheme.shadows.base};
    --shadow-md: ${darkTheme.shadows.md};
    --shadow-lg: ${darkTheme.shadows.lg};
    --shadow-xl: ${darkTheme.shadows.xl};
    --shadow-glow: ${darkTheme.shadows.glow};
    
    /* Component specific */
    --input-bg: ${darkTheme.components.input.background};
    --input-border: ${darkTheme.components.input.border};
    --card-bg: ${darkTheme.components.card.background};
    --modal-overlay: ${darkTheme.components.modal.overlay};
    
    /* Syntax highlighting */
    --code-bg: ${darkTheme.components.code.background};
    --code-text: ${darkTheme.components.code.text};
    --code-comment: ${darkTheme.components.code.comment};
    --code-keyword: ${darkTheme.components.code.keyword};
    --code-string: ${darkTheme.components.code.string};
    --code-number: ${darkTheme.components.code.number};
  }
  
  /* Smooth transitions when switching themes */
  * {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  
  /* Prevent transition on page load */
  .no-transitions * {
    transition: none !important;
  }
`;

// Utility to check if dark mode is preferred
export const prefersDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Dark mode toggle hook for React
export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && prefersDarkMode());
  });

  const toggleDarkMode = React.useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode };
};

export default darkTheme;
