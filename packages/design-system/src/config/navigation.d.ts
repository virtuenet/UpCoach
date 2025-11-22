/**
 * UpCoach Navigation Configuration
 * Centralized navigation structure for all dashboard applications
 */
import type { NavigationItem } from '../components/Navigation/Navigation';
export interface NavigationConfig {
    [key: string]: {
        title: string;
        items: NavigationItem[];
        permissions?: string[];
    };
}
export declare const cmsNavigation: NavigationItem[];
export declare const adminNavigation: NavigationItem[];
export declare const navigationConfig: NavigationConfig;
export declare const generateBreadcrumbs: (currentPath: string, navigationItems: NavigationItem[]) => Array<{
    label: string;
    path?: string;
}>;
export declare const hasNavigationAccess: (item: NavigationItem, userPermissions?: string[]) => boolean;
export declare const filterNavigationByPermissions: (items: NavigationItem[], userPermissions?: string[]) => NavigationItem[];
export default navigationConfig;
//# sourceMappingURL=navigation.d.ts.map