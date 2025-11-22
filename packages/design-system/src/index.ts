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

// Export navigation configuration
export * from './config/navigation';
export { default as navigationConfig } from './config/navigation';

// Export security configuration
export * from './config/security';
export { default as securityConfig } from './config/security';

// Export security services
export * from './services/csrf';
export { default as csrfService } from './services/csrf';

// Export accessibility services
export * from './services/accessibility';
export { default as accessibilityService } from './services/accessibility';

// Type exports
export type { ThemeOptions } from '@mui/material/styles';
export type { NavigationItem, NavigationProps } from './components/Navigation/Navigation';

// Utility exports
export {
  withOpacity,
  responsiveTypography,
  getSpacing,
  createSpacing,
  isBreakpoint,
  getCurrentBreakpoint,
  responsiveValue,
} from './tokens';
