import React, { useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

// Icons - using inline SVGs for portability
const Icons = {
  Dashboard: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Content: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  PageBuilder: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  Analytics: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Workflow: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Media: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Settings: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Menu: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Logout: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

// Navigation configuration with roles
export interface NavItem {
  label: string;
  path: string;
  icon: React.FC;
  badge?: string | number;
  roles: string[];
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: Icons.Dashboard,
    roles: ['admin', 'editor', 'viewer'],
  },
  {
    label: 'Users',
    path: '/users',
    icon: Icons.Users,
    roles: ['admin'],
    children: [
      { label: 'All Users', path: '/users/all', icon: Icons.Users, roles: ['admin'] },
      { label: 'Roles & Permissions', path: '/users/roles', icon: Icons.Settings, roles: ['admin'] },
      { label: 'User Activity', path: '/users/activity', icon: Icons.Analytics, roles: ['admin'] },
    ],
  },
  {
    label: 'Content Management',
    path: '/content',
    icon: Icons.Content,
    roles: ['admin', 'editor'],
    badge: 'New',
    children: [
      { label: 'Pages', path: '/content/pages', icon: Icons.Content, roles: ['admin', 'editor'] },
      { label: 'Blog Posts', path: '/content/blog', icon: Icons.Content, roles: ['admin', 'editor'] },
      { label: 'Components', path: '/content/components', icon: Icons.PageBuilder, roles: ['admin', 'editor'] },
      { label: 'Templates', path: '/content/templates', icon: Icons.PageBuilder, roles: ['admin', 'editor'] },
    ],
  },
  {
    label: 'Page Builder',
    path: '/page-builder',
    icon: Icons.PageBuilder,
    roles: ['admin', 'editor'],
    badge: 'Pro',
  },
  {
    label: 'Media Library',
    path: '/media',
    icon: Icons.Media,
    roles: ['admin', 'editor'],
  },
  {
    label: 'Workflow',
    path: '/workflow',
    icon: Icons.Workflow,
    roles: ['admin', 'editor'],
    badge: 3,
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: Icons.Analytics,
    roles: ['admin', 'viewer'],
    children: [
      { label: 'Overview', path: '/analytics/overview', icon: Icons.Analytics, roles: ['admin', 'viewer'] },
      { label: 'Real-time', path: '/analytics/realtime', icon: Icons.Analytics, roles: ['admin'] },
      { label: 'Reports', path: '/analytics/reports', icon: Icons.Analytics, roles: ['admin', 'viewer'] },
      { label: 'Custom Dashboards', path: '/analytics/dashboards', icon: Icons.Dashboard, roles: ['admin'] },
    ],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Icons.Settings,
    roles: ['admin'],
  },
];

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface UnifiedAdminLayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  notifications?: number;
}

export const UnifiedAdminLayout: React.FC<UnifiedAdminLayoutProps> = ({
  children,
  user,
  onLogout,
  notifications = 0,
}) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle expanded state for navigation items with children
  const toggleExpanded = useCallback((path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(item => item !== path)
        : [...prev, path]
    );
  }, []);

  // Filter navigation items based on user role
  const filteredNavigation = useMemo(() => {
    if (!user) return [];
    return navigationItems.filter(item =>
      item.roles.includes(user.role)
    );
  }, [user]);

  // Check if current path matches navigation item
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Render navigation item
  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);
    const active = isActive(item.path);

    return (
      <div key={item.path}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.path);
            } else {
              // Navigate to path (handled by parent component)
            }
          }}
          className={clsx(
            'w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            active && 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
            !active && 'text-gray-700 dark:text-gray-300',
            depth > 0 && 'ml-8'
          )}
        >
          <item.icon />
          <span className="ml-3 flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className={clsx(
              'ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full',
              typeof item.badge === 'number'
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
            )}>
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <Icons.ChevronDown
              className={clsx(
                'ml-2 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
          'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">UC</span>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">UpCoach</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin & CMS</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 pb-4 overflow-y-auto">
          <div className="space-y-1">
            {filteredNavigation.map(item => renderNavItem(item))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {user?.avatar ? (
                <img
                  className="w-10 h-10 rounded-full"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Logout"
            >
              <Icons.Logout />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icons.Menu />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden lg:flex items-center space-x-2 text-sm">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Home
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 dark:text-white">Current Page</span>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Quick Actions */}
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                New Page
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UnifiedAdminLayout;