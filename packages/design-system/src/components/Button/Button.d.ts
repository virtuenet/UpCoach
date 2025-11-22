/**
 * UpCoach Design System - Button Component
 * Unified button component with consistent styling and behavior
 */
import React from 'react';
import { ButtonProps as MuiButtonProps } from '@mui/material';
export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
    variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'link';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}
export declare const Button: React.FC<ButtonProps>;
export default Button;
//# sourceMappingURL=Button.d.ts.map