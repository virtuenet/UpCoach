/**
 * UpCoach Design System - Navigation Component
 * Unified navigation sidebar/header component
 */
import React from 'react';
export interface NavigationItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    path?: string;
    badge?: number | string;
    children?: NavigationItem[];
    onClick?: () => void;
}
export interface NavigationProps {
    items: NavigationItem[];
    logo?: React.ReactNode;
    title?: string;
    user?: {
        name: string;
        email?: string;
        avatar?: string;
    };
    notifications?: number;
    onNavigate?: (path: string) => void;
    onLogout?: () => void;
    variant?: 'permanent' | 'temporary' | 'persistent';
    mini?: boolean;
    position?: 'left' | 'top';
    currentPath?: string;
}
export declare const Navigation: React.FC<NavigationProps>;
export default Navigation;
//# sourceMappingURL=Navigation.d.ts.map