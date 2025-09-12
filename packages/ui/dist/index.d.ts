import React from 'react';
import { ClassValue } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'bordered' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}
declare const CardHeader: React.ForwardRefExoticComponent<CardHeaderProps & React.RefAttributes<HTMLDivElement>>;
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
}
declare const CardTitle: React.ForwardRefExoticComponent<CardTitleProps & React.RefAttributes<HTMLHeadingElement>>;
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}
declare const CardContent: React.ForwardRefExoticComponent<CardContentProps & React.RefAttributes<HTMLDivElement>>;
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}
declare const CardFooter: React.ForwardRefExoticComponent<CardFooterProps & React.RefAttributes<HTMLDivElement>>;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
}
declare const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLSelectElement>>;

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    children: React.ReactNode;
}
declare const Modal: React.FC<ModalProps>;

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}
declare const Badge: React.FC<BadgeProps>;

interface RadioOption {
    value: string;
    label: string;
    disabled?: boolean;
}
interface RadioGroupProps {
    name: string;
    value?: string;
    onChange?: (value: string) => void;
    options: RadioOption[];
    className?: string;
    disabled?: boolean;
}
declare const RadioGroup: React.FC<RadioGroupProps>;

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    children: React.ReactNode;
    required?: boolean;
    className?: string;
}
declare const Label: React.FC<LabelProps>;

interface ProgressProps {
    value: number;
    max?: number;
    className?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'green' | 'yellow' | 'red';
}
declare const Progress: React.FC<ProgressProps>;

type Theme = 'light' | 'dark';
interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}
declare const ThemeProvider: React.FC<{
    children: React.ReactNode;
}>;
declare const useTheme: () => ThemeContextType;

declare function cn(...inputs: ClassValue[]): string;

export { Badge, Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Input, Label, Modal, Progress, RadioGroup, Select, Textarea, ThemeProvider, cn, useTheme };
