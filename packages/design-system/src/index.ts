/**
 * UpCoach Design System
 * Unified design system for all UpCoach applications
 */

// Export all components
export * from './components';

// Export all tokens
export * from './tokens';
export { default as tokens } from './tokens';

// Export theme configurations
export { lightTheme, darkTheme, createCustomTheme } from './theme/mui-theme';
export { default as theme } from './theme/mui-theme';

// Type exports
export type { ThemeOptions } from '@mui/material/styles';

// Utility exports
export { 
  withOpacity,
  responsiveTypography,
  getSpacing,
  createSpacing,
  isBreakpoint,
  getCurrentBreakpoint,
  responsiveValue
} from './tokens';