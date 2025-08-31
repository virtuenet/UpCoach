/**
 * UpCoach Design System - Card Component
 * Unified card component for content containers
 */
import React from 'react';
import { CardProps as MuiCardProps } from '@mui/material';
export interface CardProps extends Omit<MuiCardProps, 'title'> {
  title?: React.ReactNode;
  subtitle?: string;
  headerAction?: React.ReactNode;
  media?: {
    src: string;
    alt?: string;
    height?: number;
  };
  actions?: React.ReactNode;
  loading?: boolean;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
}
export declare const Card: React.FC<CardProps>;
export default Card;
//# sourceMappingURL=Card.d.ts.map
