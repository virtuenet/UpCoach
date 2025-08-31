/**
 * UpCoach Design System - Component Exports
 * Central export point for all components
 */

// Core Components
export { Button, type ButtonProps } from './Button';
export { Card, type CardProps } from './Card';
export { LoadingState, type LoadingStateProps } from './LoadingState';
export { Navigation, type NavigationProps, type NavigationItem } from './Navigation';

// Component Groups for convenience
export const Components = {
  Button: require('./Button').Button,
  Card: require('./Card').Card,
  LoadingState: require('./LoadingState').LoadingState,
  Navigation: require('./Navigation').Navigation,
} as const;
