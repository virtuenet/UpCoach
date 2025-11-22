import React, { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { TenantSwitcher } from './TenantSwitcher';

interface LayoutProps {
  children: ReactNode;
}

// Simple navigation items
const navigationItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Users', path: '/users' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Financial', path: '/financial' },
  { label: 'Settings', path: '/settings' },
];

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="nav-header">
          <h2>Admin Panel</h2>
        </div>
        <ul className="nav-list">
          {navigationItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="nav-footer">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        <header className="content-header">
          <h1>Admin Dashboard</h1>
          <TenantSwitcher />
        </header>
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}

export { Layout };
export default Layout;