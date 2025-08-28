/**
 * UpCoach Design System - Component Exports
 * Central export point for all components
 */
// Core Components
export { Button } from './Button';
export { Card } from './Card';
export { LoadingState } from './LoadingState';
export { Navigation } from './Navigation';
// Component Groups for convenience
export const Components = {
    Button: require('./Button').Button,
    Card: require('./Card').Card,
    LoadingState: require('./LoadingState').LoadingState,
    Navigation: require('./Navigation').Navigation,
};
