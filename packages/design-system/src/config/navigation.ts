/**
 * UpCoach Navigation Configuration
 * Centralized navigation structure for all dashboard applications
 */

import React from 'react';
import type { NavigationItem } from '../components/Navigation/Navigation';

// Icon type for type safety (would normally import from icon library)
export interface IconType {
  name: string;
  component?: React.ComponentType<any>;
}

export interface NavigationConfig {
  [key: string]: {
    title: string;
    items: NavigationItem[];
    permissions?: string[];
  };
}

// CMS Panel Navigation
export const cmsNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: { name: 'Home' },
  },
  {
    id: 'content',
    label: 'Content Management',
    path: '/content',
    icon: { name: 'FileText' },
    children: [
      {
        id: 'content-list',
        label: 'All Content',
        path: '/content',
      },
      {
        id: 'content-create',
        label: 'Create New',
        path: '/content/create',
      },
      {
        id: 'content-categories',
        label: 'Categories',
        path: '/content/categories',
      },
    ],
  },
  {
    id: 'courses',
    label: 'Courses',
    path: '/courses',
    icon: { name: 'BookOpen' },
    children: [
      {
        id: 'courses-list',
        label: 'All Courses',
        path: '/courses',
      },
      {
        id: 'courses-create',
        label: 'Create Course',
        path: '/courses/create',
      },
    ],
  },
  {
    id: 'media',
    label: 'Media Library',
    path: '/media',
    icon: { name: 'Image' },
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: { name: 'BarChart3' },
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: { name: 'Settings' },
  },
];

// Admin Panel Navigation
export const adminNavigation: NavigationItem[] = [
  {
    id: 'admin-dashboard',
    label: 'System Overview',
    path: '/dashboard',
    icon: { name: 'BarChart' },
  },
  {
    id: 'user-management',
    label: 'User Management',
    path: '/users',
    icon: { name: 'Users' },
    children: [
      {
        id: 'users-list',
        label: 'All Users',
        path: '/users',
      },
      {
        id: 'users-roles',
        label: 'Roles & Permissions',
        path: '/users/roles',
      },
      {
        id: 'users-activity',
        label: 'User Activity',
        path: '/users/activity',
      },
    ],
  },
  {
    id: 'content-moderation',
    label: 'Content Moderation',
    path: '/moderation',
    icon: { name: 'Shield' },
    children: [
      {
        id: 'moderation-pending',
        label: 'Pending Review',
        path: '/moderation/pending',
        badge: 'New',
      },
      {
        id: 'moderation-flagged',
        label: 'Flagged Content',
        path: '/moderation/flagged',
      },
      {
        id: 'moderation-reports',
        label: 'User Reports',
        path: '/moderation/reports',
      },
    ],
  },
  {
    id: 'analytics-admin',
    label: 'Advanced Analytics',
    path: '/analytics',
    icon: { name: 'TrendingUp' },
    children: [
      {
        id: 'analytics-users',
        label: 'User Metrics',
        path: '/analytics/users',
      },
      {
        id: 'analytics-content',
        label: 'Content Performance',
        path: '/analytics/content',
      },
      {
        id: 'analytics-system',
        label: 'System Health',
        path: '/analytics/system',
      },
    ],
  },
  {
    id: 'financial',
    label: 'Financial Management',
    path: '/financial',
    icon: { name: 'DollarSign' },
    children: [
      {
        id: 'financial-revenue',
        label: 'Revenue Dashboard',
        path: '/financial/revenue',
      },
      {
        id: 'financial-subscriptions',
        label: 'Subscriptions',
        path: '/financial/subscriptions',
      },
      {
        id: 'financial-transactions',
        label: 'Transactions',
        path: '/financial/transactions',
      },
    ],
  },
  {
    id: 'system-config',
    label: 'System Configuration',
    path: '/system',
    icon: { name: 'Settings2' },
    children: [
      {
        id: 'system-general',
        label: 'General Settings',
        path: '/system/general',
      },
      {
        id: 'system-security',
        label: 'Security Settings',
        path: '/system/security',
      },
      {
        id: 'system-integrations',
        label: 'Integrations',
        path: '/system/integrations',
      },
      {
        id: 'system-backup',
        label: 'Backup & Recovery',
        path: '/system/backup',
      },
    ],
  },
];

// Navigation configuration object
export const navigationConfig: NavigationConfig = {
  cms: {
    title: 'UpCoach CMS',
    items: cmsNavigation,
    permissions: ['editor', 'admin'],
  },
  admin: {
    title: 'UpCoach Admin',
    items: adminNavigation,
    permissions: ['admin'],
  },
};

// Breadcrumb generation utility
export const generateBreadcrumbs = (
  currentPath: string,
  navigationItems: NavigationItem[]
): Array<{ label: string; path?: string }> => {
  const breadcrumbs: Array<{ label: string; path?: string }> = [];
  
  const findPath = (items: NavigationItem[], path: string, parents: NavigationItem[] = []): boolean => {
    for (const item of items) {
      if (item.path === path) {
        // Add all parents
        parents.forEach(parent => {
          breadcrumbs.push({ label: parent.label, path: parent.path });
        });
        // Add current item
        breadcrumbs.push({ label: item.label });
        return true;
      }
      
      if (item.children && item.children.length > 0) {
        if (findPath(item.children, path, [...parents, item])) {
          return true;
        }
      }
    }
    return false;
  };

  findPath(navigationItems, currentPath);
  return breadcrumbs;
};

// Permission checking utility
export const hasNavigationAccess = (
  item: NavigationItem,
  userPermissions: string[] = []
): boolean => {
  // For now, simple implementation - can be extended
  return true; // All users have access for now
};

// Filter navigation items based on permissions
export const filterNavigationByPermissions = (
  items: NavigationItem[],
  userPermissions: string[] = []
): NavigationItem[] => {
  return items.filter(item => hasNavigationAccess(item, userPermissions))
    .map(item => ({
      ...item,
      children: item.children 
        ? filterNavigationByPermissions(item.children, userPermissions)
        : undefined,
    }));
};

export default navigationConfig;