/**
 * UpCoach Design System - Component Exports
 * Central export point for all components
 */

// Core Components
export { Button, type ButtonProps } from './Button';
export { Card, type CardProps } from './Card';
export { LoadingState, type LoadingStateProps } from './LoadingState';
export { Navigation, type NavigationProps, type NavigationItem } from './Navigation';

// Import for convenience object
import { Button } from './Button';
import { Card } from './Card';
import { LoadingState } from './LoadingState';
import { Navigation } from './Navigation';

// Component Groups for convenience
export const Components = {
  Button,
  Card,
  LoadingState,
  Navigation,
} as const;
