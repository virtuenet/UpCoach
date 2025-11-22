// Global type declarations for temporary TypeScript fixes

declare module '@upcoach/ui' {
  import { ButtonHTMLAttributes, ReactNode } from 'react';

  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
  }

  interface CardProps {
    children: ReactNode;
    className?: string;
  }

  interface InputProps {
    type?: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    required?: boolean;
  }

  interface TextareaProps {
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    className?: string;
    rows?: number;
  }

  interface LabelProps {
    children: ReactNode;
    htmlFor?: string;
    className?: string;
  }

  interface ProgressProps {
    value: number;
    max?: number;
    className?: string;
  }

  interface BadgeProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string;
  }

  export const Button: React.FC<ButtonProps>;
  export const Card: React.FC<CardProps>;
  export const CardHeader: React.FC<CardProps>;
  export const CardTitle: React.FC<CardProps>;
  export const CardContent: React.FC<CardProps>;
  export const CardFooter: React.FC<CardProps>;
  export const Input: React.FC<InputProps>;
  export const Textarea: React.FC<TextareaProps>;
  export const Label: React.FC<LabelProps>;
  export const Progress: React.FC<ProgressProps>;
  export const Badge: React.FC<BadgeProps>;
}

// Jest global declarations
declare global {
  var jest: any;
  var describe: any;
  var it: any;
  var test: any;
  var expect: any;
  var beforeAll: any;
  var afterAll: any;
  var beforeEach: any;
  var afterEach: any;
}

export {};