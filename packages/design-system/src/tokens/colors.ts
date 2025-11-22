/**
 * UpCoach Design System - Color Tokens
 * Unified color palette for consistent visual language across all platforms
 */

export const colors = {
  // Brand Colors
  brand: {
    primary: '#3b82f6', // Bright blue - main brand color
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    secondary: '#8b5cf6', // Purple accent
    secondaryLight: '#a78bfa',
    secondaryDark: '#7c3aed',
    tertiary: '#06b6d4', // Cyan for highlights
  },

  // Semantic Colors
  semantic: {
    success: '#10b981',
    successLight: '#34d399',
    successDark: '#059669',
    successBackground: '#ecfdf5',

    warning: '#f59e0b',
    warningLight: '#fbbf24',
    warningDark: '#d97706',
    warningBackground: '#fffbeb',

    error: '#ef4444',
    errorLight: '#f87171',
    errorDark: '#dc2626',
    errorBackground: '#fef2f2',

    info: '#3b82f6',
    infoLight: '#60a5fa',
    infoDark: '#2563eb',
    infoBackground: '#eff6ff',
  },

  // Neutral Colors
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    1000: '#000000',
  },

  // Text Colors
  text: {
    primary: '#111827', // Main text
    secondary: '#6b7280', // Secondary text
    tertiary: '#9ca3af', // Muted text
    disabled: '#d1d5db', // Disabled state
    inverse: '#ffffff', // Text on dark backgrounds
    link: '#3b82f6', // Link color
    linkHover: '#2563eb', // Link hover state
  },

  // Background Colors
  background: {
    primary: '#ffffff', // Main background
    secondary: '#f9fafb', // Subtle background
    tertiary: '#f3f4f6', // Card backgrounds
    elevated: '#ffffff', // Elevated surfaces
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
    hover: '#f3f4f6', // Hover states
    pressed: '#e5e7eb', // Pressed states
  },

  // Border Colors
  border: {
    default: '#e5e7eb', // Default borders
    light: '#f3f4f6', // Light borders
    dark: '#d1d5db', // Strong borders
    focus: '#3b82f6', // Focus ring color
    error: '#ef4444', // Error state borders
  },

  // Chart Colors (for data visualization)
  chart: {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6',
    orange: '#fb923c',
  },

  // Alpha variations (for transparency)
  alpha: {
    black5: 'rgba(0, 0, 0, 0.05)',
    black10: 'rgba(0, 0, 0, 0.10)',
    black20: 'rgba(0, 0, 0, 0.20)',
    black30: 'rgba(0, 0, 0, 0.30)',
    black50: 'rgba(0, 0, 0, 0.50)',
    white10: 'rgba(255, 255, 255, 0.10)',
    white20: 'rgba(255, 255, 255, 0.20)',
    white50: 'rgba(255, 255, 255, 0.50)',
    white80: 'rgba(255, 255, 255, 0.80)',
  },
} as const;

// Helper function to get color with opacity
export const withOpacity = (hexColor: string, opacity: number): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Dark mode color mappings
export const darkColors = {
  text: {
    primary: '#f9fafb',
    secondary: '#d1d5db',
    tertiary: '#9ca3af',
    disabled: '#6b7280',
    inverse: '#111827',
    link: '#60a5fa',
    linkHover: '#93c5fd',
  },
  background: {
    primary: '#111827',
    secondary: '#1f2937',
    tertiary: '#374151',
    elevated: '#1f2937',
    overlay: 'rgba(0, 0, 0, 0.7)',
    hover: '#374151',
    pressed: '#4b5563',
  },
  border: {
    default: '#374151',
    light: '#1f2937',
    dark: '#4b5563',
    focus: '#60a5fa',
    error: '#f87171',
  },
} as const;

export default colors;
