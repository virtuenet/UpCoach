/**
 * Tabs component - Basic implementation for admin panel
 */
import React from 'react';
export interface TabsProps {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
    children: React.ReactNode;
    className?: string;
}
export declare const Tabs: ({ value, onValueChange, defaultValue, children, className }: TabsProps) => import("react/jsx-runtime").JSX.Element;
export interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}
export declare const TabsList: ({ children, className }: TabsListProps) => import("react/jsx-runtime").JSX.Element;
export interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}
export declare const TabsTrigger: ({ value, children, className }: TabsTriggerProps) => import("react/jsx-runtime").JSX.Element;
export interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}
export declare const TabsContent: ({ value, children, className }: TabsContentProps) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=tabs.d.ts.map