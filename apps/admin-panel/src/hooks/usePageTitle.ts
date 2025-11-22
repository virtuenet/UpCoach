import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTitleConfig {
  title?: string;
  description?: string;
  keywords?: string[];
}

const PAGE_TITLES: Record<string, PageTitleConfig> = {
  '/': {
    title: 'Dashboard',
    description: 'UpCoach Admin Dashboard - Overview of system metrics and analytics',
    keywords: ['dashboard', 'admin', 'upcoach', 'analytics']
  },
  '/dashboard': {
    title: 'Dashboard',
    description: 'UpCoach Admin Dashboard - Overview of system metrics and analytics',
    keywords: ['dashboard', 'admin', 'upcoach', 'analytics']
  },
  '/users': {
    title: 'User Management',
    description: 'Manage users, roles, and permissions',
    keywords: ['users', 'management', 'admin', 'roles', 'permissions']
  },
  '/users/roles': {
    title: 'User Roles & Permissions',
    description: 'Configure user roles and permission settings',
    keywords: ['roles', 'permissions', 'user management', 'admin']
  },
  '/users/activity': {
    title: 'User Activity',
    description: 'Monitor user activity and engagement metrics',
    keywords: ['user activity', 'engagement', 'analytics', 'monitoring']
  },
  '/moderation': {
    title: 'Content Moderation',
    description: 'Moderate content and manage community standards',
    keywords: ['moderation', 'content', 'community', 'safety']
  },
  '/moderation/pending': {
    title: 'Pending Content Review',
    description: 'Review content awaiting moderation approval',
    keywords: ['pending', 'review', 'moderation', 'approval']
  },
  '/moderation/flagged': {
    title: 'Flagged Content',
    description: 'Review content flagged by users or automated systems',
    keywords: ['flagged', 'content', 'moderation', 'reports']
  },
  '/moderation/reports': {
    title: 'User Reports',
    description: 'Handle user reports and community violations',
    keywords: ['reports', 'violations', 'community', 'moderation']
  },
  '/analytics': {
    title: 'Analytics',
    description: 'Advanced analytics and reporting dashboard',
    keywords: ['analytics', 'reporting', 'metrics', 'insights']
  },
  '/analytics/users': {
    title: 'User Analytics',
    description: 'Detailed user metrics and behavioral analytics',
    keywords: ['user analytics', 'metrics', 'behavior', 'insights']
  },
  '/analytics/content': {
    title: 'Content Analytics',
    description: 'Content performance and engagement analytics',
    keywords: ['content analytics', 'performance', 'engagement', 'metrics']
  },
  '/analytics/system': {
    title: 'System Health',
    description: 'System performance and health monitoring',
    keywords: ['system health', 'performance', 'monitoring', 'metrics']
  },
  '/financial': {
    title: 'Financial Management',
    description: 'Revenue tracking and financial analytics',
    keywords: ['financial', 'revenue', 'billing', 'analytics']
  },
  '/financial/revenue': {
    title: 'Revenue Dashboard',
    description: 'Track revenue streams and financial performance',
    keywords: ['revenue', 'financial', 'performance', 'analytics']
  },
  '/financial/subscriptions': {
    title: 'Subscription Management',
    description: 'Manage user subscriptions and billing',
    keywords: ['subscriptions', 'billing', 'management', 'revenue']
  },
  '/financial/transactions': {
    title: 'Transaction History',
    description: 'View and manage transaction records',
    keywords: ['transactions', 'history', 'financial', 'records']
  },
  '/system': {
    title: 'System Configuration',
    description: 'Configure system settings and preferences',
    keywords: ['system', 'configuration', 'settings', 'admin']
  },
  '/system/security': {
    title: 'Security Settings',
    description: 'Manage system security and authentication settings',
    keywords: ['security', 'settings', 'authentication', 'admin']
  },
  '/system/integrations': {
    title: 'Integrations',
    description: 'Manage third-party integrations and API connections',
    keywords: ['integrations', 'API', 'third-party', 'connections']
  },
  '/system/backup': {
    title: 'Backup & Recovery',
    description: 'Manage data backups and recovery procedures',
    keywords: ['backup', 'recovery', 'data', 'management']
  }
};

export const usePageTitle = (customTitle?: string, customDescription?: string) => {
  const location = useLocation();

  useEffect(() => {
    const pageConfig = PAGE_TITLES[location.pathname] || {
      title: 'Admin Panel',
      description: 'UpCoach Admin Panel'
    };

    const title = customTitle || pageConfig.title || 'Admin Panel';
    const description = customDescription || pageConfig.description || 'UpCoach Admin Panel';

    // Update document title
    document.title = `${title} | UpCoach Admin`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update meta keywords if available
    if (pageConfig.keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      const keywordsContent = pageConfig.keywords.join(', ');

      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywordsContent);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'keywords';
        meta.content = keywordsContent;
        document.head.appendChild(meta);
      }
    }

    // Announce page change to screen readers
    const announcement = document.getElementById('page-announcement');
    if (announcement) {
      announcement.textContent = `Navigated to ${title}`;
    } else {
      const announcer = document.createElement('div');
      announcer.id = 'page-announcement';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      announcer.textContent = `Navigated to ${title}`;
      document.body.appendChild(announcer);
    }

  }, [location.pathname, customTitle, customDescription]);

  // Return page config for components that might need it
  return PAGE_TITLES[location.pathname] || {
    title: customTitle || 'Admin Panel',
    description: customDescription || 'UpCoach Admin Panel'
  };
};

// Hook for setting focus on page change for accessibility
export const useFocusManagement = () => {
  const location = useLocation();

  useEffect(() => {
    // Focus management for single-page applications
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      // Set focus to main content on route change
      mainContent.focus();
      // Ensure it's scrolled into view
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.pathname]);
};

// Hook for managing reduced motion preferences
export const useReducedMotion = () => {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMotionPreferenceChange = (e: MediaQueryListEvent) => {
      // Add/remove class to body for CSS-based reduced motion
      if (e.matches) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    };

    // Set initial state
    if (mediaQuery.matches) {
      document.body.classList.add('reduced-motion');
    }

    // Listen for changes
    mediaQuery.addEventListener('change', handleMotionPreferenceChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
    };
  }, []);
};

// Combined hook that handles all accessibility concerns
export const useAccessibility = (customTitle?: string, customDescription?: string) => {
  const pageConfig = usePageTitle(customTitle, customDescription);
  useFocusManagement();
  useReducedMotion();

  return pageConfig;
};