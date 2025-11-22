import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Menu, X, Search, Bell, ChevronRight } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

interface NavigationSection {
  title?: string;
  items: NavigationItem[];
}

interface UnifiedLayoutProps {
  navigation: NavigationSection[];
  userMenu?: {
    user: { name: string; email: string; avatar?: string };
    onLogout: () => void;
  };
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  logo?: React.ReactNode;
  variant?: 'admin' | 'cms';
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  navigation,
  userMenu,
  searchPlaceholder = 'Search...',
  onSearch,
  logo,
  variant = 'admin',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isActiveRoute = (href: string) => {
    if (href === '/') return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="skip-nav sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white px-4 py-2 rounded-br-md"
      >
        Skip to main content
      </a>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200',
          'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo area */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            {logo || (
              <span className="text-xl font-bold text-gray-900">
                {variant === 'admin' ? 'Admin Panel' : 'CMS Panel'}
              </span>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
            {navigation.map((section, sectionIdx) => (
              <div key={sectionIdx} className={cn(sectionIdx > 0 && 'mt-6')}>
                {section.title && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <ul className={cn('space-y-1', section.title && 'mt-2')} role="list">
                  {section.items.map(item => {
                    const isActive = isActiveRoute(item.href);
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          className={cn(
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-l-3 border-blue-600'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon
                            className={cn(
                              'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                              isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                            )}
                            aria-hidden="true"
                          />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && item.badge > 0 && (
                            <span
                              className={cn(
                                'ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* User menu (optional) */}
          {userMenu && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {userMenu.user.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={userMenu.user.avatar}
                      alt={userMenu.user.name}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {userMenu.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{userMenu.user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{userMenu.user.email}</p>
                </div>
                <button
                  onClick={userMenu.onLogout}
                  className="ml-2 p-1 rounded-md text-gray-500 hover:bg-gray-100"
                  aria-label="Sign out"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              <button
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UnifiedLayout;
