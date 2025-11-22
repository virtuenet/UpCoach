/**
 * Navigation Test Configuration
 * Centralized configuration for navigation testing across dashboard applications
 */

export interface NavigationItem {
  x: string;
  y?: string | null;
  z?: string | null; 
  w?: string | null;
  path: string;
  metadata: {
    requiresAuth: boolean;
    sidebarVisible: boolean;
    component: string;
    dynamicRoute?: boolean;
    roles?: string[];
  };
}

export interface DashboardConfig {
  name: string;
  port: number;
  baseUrl: string;
  implemented: boolean;
  navigationItems: NavigationItem[];
}

/**
 * CMS Panel Navigation Configuration
 */
export const cmsPanel: DashboardConfig = {
  name: 'CMS Panel',
  port: 8007,
  baseUrl: 'http://localhost:8007',
  implemented: true,
  navigationItems: [
    {
      x: 'CMS',
      y: 'Dashboard',
      z: null,
      w: null,
      path: '/dashboard',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'DashboardPage'
      }
    },
    {
      x: 'CMS',
      y: 'Content', 
      z: null,
      w: null,
      path: '/content',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'ContentPage'
      }
    },
    {
      x: 'CMS',
      y: 'Content',
      z: 'Create',
      w: null,
      path: '/content/create',
      metadata: {
        requiresAuth: true,
        sidebarVisible: false,
        component: 'CreateContentPage'
      }
    },
    {
      x: 'CMS',
      y: 'Content',
      z: 'Edit', 
      w: ':id',
      path: '/content/edit/:id',
      metadata: {
        requiresAuth: true,
        sidebarVisible: false,
        component: 'EditContentPage',
        dynamicRoute: true
      }
    },
    {
      x: 'CMS',
      y: 'Courses',
      z: null,
      w: null,
      path: '/courses',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'CoursesPage'
      }
    },
    {
      x: 'CMS',
      y: 'Courses',
      z: 'Create',
      w: null, 
      path: '/courses/create',
      metadata: {
        requiresAuth: true,
        sidebarVisible: false,
        component: 'CreateCoursePage'
      }
    },
    {
      x: 'CMS',
      y: 'Media',
      z: null,
      w: null,
      path: '/media',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'MediaLibraryPage'
      }
    },
    {
      x: 'CMS', 
      y: 'Analytics',
      z: null,
      w: null,
      path: '/analytics',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'AnalyticsPage'
      }
    },
    {
      x: 'CMS',
      y: 'Settings',
      z: null, 
      w: null,
      path: '/settings',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'SettingsPage'
      }
    }
  ]
};

/**
 * Admin Panel Navigation Configuration (Future Implementation)
 */
export const adminPanel: DashboardConfig = {
  name: 'Admin Panel',
  port: 8006, 
  baseUrl: 'http://localhost:8006',
  implemented: false,
  navigationItems: [
    {
      x: 'Admin',
      y: 'Dashboard',
      z: null,
      w: null,
      path: '/admin/dashboard',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'AdminDashboardPage',
        roles: ['admin', 'super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'Users',
      z: null,
      w: null,
      path: '/admin/users',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'UsersPage', 
        roles: ['admin', 'super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'Users',
      z: 'Management',
      w: null,
      path: '/admin/users/manage',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'UserManagementPage',
        roles: ['admin', 'super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'Users', 
      z: 'Management',
      w: ':id',
      path: '/admin/users/manage/:id',
      metadata: {
        requiresAuth: true,
        sidebarVisible: false,
        component: 'UserDetailPage',
        dynamicRoute: true,
        roles: ['admin', 'super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'Users',
      z: 'Permissions',
      w: null,
      path: '/admin/users/permissions',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'PermissionsPage',
        roles: ['super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'System',
      z: null,
      w: null,
      path: '/admin/system',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true, 
        component: 'SystemPage',
        roles: ['super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'System',
      z: 'Settings',
      w: null,
      path: '/admin/system/settings',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'SystemSettingsPage',
        roles: ['super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'System',
      z: 'Monitoring',
      w: null,
      path: '/admin/system/monitoring',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'MonitoringPage',
        roles: ['super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'System',
      z: 'Monitoring', 
      w: 'Logs',
      path: '/admin/system/monitoring/logs',
      metadata: {
        requiresAuth: true,
        sidebarVisible: false,
        component: 'LogsPage',
        roles: ['super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'Analytics',
      z: null,
      w: null,
      path: '/admin/analytics',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'AdminAnalyticsPage',
        roles: ['admin', 'super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'Analytics',
      z: 'Reports',
      w: null,
      path: '/admin/analytics/reports',
      metadata: {
        requiresAuth: true,
        sidebarVisible: true,
        component: 'ReportsPage',
        roles: ['admin', 'super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'Analytics',
      z: 'Reports',
      w: 'Monthly',
      path: '/admin/analytics/reports/monthly',
      metadata: {
        requiresAuth: true,
        sidebarVisible: false,
        component: 'MonthlyReportsPage',
        roles: ['admin', 'super_admin']
      }
    },
    {
      x: 'Admin',
      y: 'Analytics', 
      z: 'Reports',
      w: 'Weekly',
      path: '/admin/analytics/reports/weekly',
      metadata: {
        requiresAuth: true,
        sidebarVisible: false,
        component: 'WeeklyReportsPage',
        roles: ['admin', 'super_admin']
      }
    }
  ]
};

/**
 * All Dashboard Configurations
 */
export const dashboards: DashboardConfig[] = [cmsPanel, adminPanel];

/**
 * Test Data Selectors
 */
export const selectors = {
  // Sidebar selectors
  sidebar: '[data-testid="sidebar"]',
  mobileSidebar: '[data-testid="mobile-sidebar"]',
  mobileMenuToggle: '[data-testid="mobile-menu-toggle"]',
  mobileMenuClose: '[data-testid="mobile-menu-close"]',
  
  // Navigation selectors
  navItem: (name: string) => `[data-testid="nav-${name.toLowerCase().replace(/\s+/g, '-')}"]`,
  navXLevel: '[data-testid="nav-x-level"]',
  navYLevel: '[data-testid="nav-y-level"]', 
  navZLevel: '[data-testid="nav-z-level"]',
  navXItem: '[data-testid="nav-x-item"]',
  navYItem: '[data-testid="nav-y-item"]',
  navZItem: '[data-testid="nav-z-item"]',
  
  // Breadcrumb selectors
  breadcrumbs: '[data-testid="breadcrumbs"]',
  breadcrumbItem: '[data-testid="breadcrumb-item"]',
  breadcrumbSegment: '[data-testid="breadcrumb-segment"]',
  
  // Auth selectors
  loginForm: '[data-testid="login-form"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  loginButton: '[data-testid="login-button"]',
  userSection: '[data-testid="user-section"]',
  logoutButton: '[data-testid="logout-button"]',
  
  // State selectors
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  underConstruction: '[data-testid="under-construction"]',
  
  // Action selectors
  createArticleButton: '[data-testid="create-article-button"]',
  editArticle: '[data-testid="edit-article"]',
};

/**
 * Test Users for Authentication
 */
export const testUsers = {
  admin: {
    email: 'admin@upcoach.ai',
    password: 'testpass123',
    role: 'admin'
  },
  superAdmin: {
    email: 'superadmin@upcoach.ai', 
    password: 'testpass123',
    role: 'super_admin'
  },
  moderator: {
    email: 'moderator@upcoach.ai',
    password: 'testpass123', 
    role: 'moderator'
  }
};

/**
 * Utility functions for navigation testing
 */
export class NavigationTestUtils {
  /**
   * Get navigation items by level
   */
  static getItemsByLevel(dashboard: DashboardConfig, level: 'x' | 'y' | 'z' | 'w') {
    return dashboard.navigationItems.filter(item => {
      switch (level) {
        case 'x': return item.y === null;
        case 'y': return item.y !== null && item.z === null;
        case 'z': return item.z !== null && item.w === null;
        case 'w': return item.w !== null;
        default: return false;
      }
    });
  }

  /**
   * Get sidebar visible items
   */
  static getSidebarItems(dashboard: DashboardConfig) {
    return dashboard.navigationItems.filter(item => item.metadata.sidebarVisible);
  }

  /**
   * Get dynamic routes
   */
  static getDynamicRoutes(dashboard: DashboardConfig) {
    return dashboard.navigationItems.filter(item => item.metadata.dynamicRoute);
  }

  /**
   * Get routes by role
   */
  static getRoutesByRole(dashboard: DashboardConfig, role: string) {
    return dashboard.navigationItems.filter(item => 
      !item.metadata.roles || item.metadata.roles.includes(role)
    );
  }

  /**
   * Generate test ID from navigation item
   */
  static getNavTestId(item: NavigationItem): string {
    const parts = [item.y, item.z, item.w].filter(Boolean);
    return parts.join('-').toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Generate breadcrumb path
   */
  static getBreadcrumbPath(item: NavigationItem): string[] {
    const path = [item.x];
    if (item.y) path.push(item.y);
    if (item.z) path.push(item.z);
    if (item.w && !item.w.startsWith(':')) path.push(item.w);
    return path;
  }
}

export default { dashboards, selectors, testUsers, NavigationTestUtils };