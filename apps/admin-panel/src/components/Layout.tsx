import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { 
  Navigation, 
  adminNavigation,
  generateBreadcrumbs,
  NavigationItem
} from '@upcoach/design-system';
import { useAuthStore } from '../stores/authStore';
import Breadcrumbs from './Breadcrumbs';
import * as Icons from '@mui/icons-material';

// Icon mapping to convert string names to actual icon components
const iconMap: Record<string, React.ComponentType<any>> = {
  BarChart: Icons.BarChart,
  Users: Icons.People,
  Shield: Icons.Shield,
  TrendingUp: Icons.TrendingUp,
  DollarSign: Icons.AttachMoney,
  Settings2: Icons.Settings,
};

// Transform navigation items to include actual icon components
const transformNavigationWithIcons = (items: NavigationItem[]): NavigationItem[] => {
  return items.map(item => ({
    ...item,
    icon: item.icon && typeof item.icon === 'object' && 'name' in item.icon 
      ? React.createElement(iconMap[item.icon.name as string] || Icons.Circle)
      : item.icon,
    children: item.children ? transformNavigationWithIcons(item.children) : undefined,
  }));
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  
  const [navigationVariant, setNavigationVariant] = useState<'permanent' | 'temporary' | 'mini'>('permanent');

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Transform navigation items to include actual icon components
  const navigationItems = transformNavigationWithIcons(adminNavigation);
  
  // Generate breadcrumbs for current path
  const breadcrumbs = generateBreadcrumbs(location.pathname, navigationItems);

  const logoComponent = (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1,
        backgroundColor: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.875rem',
      }}
    >
      UA
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navigation
        items={navigationItems}
        logo={logoComponent}
        title="UpCoach Admin"
        user={user ? {
          name: user.name || 'Admin User',
          email: user.email,
          avatar: user.avatar,
        } : undefined}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        variant={navigationVariant}
        currentPath={location.pathname}
        notifications={5} // Mock notification count
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          ml: { md: navigationVariant === 'mini' ? '72px' : '260px' },
          mt: '64px', // AppBar height
        }}
      >
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Breadcrumbs items={breadcrumbs} />
          </Box>
        )}
        
        {/* Main content */}
        <Box sx={{ flex: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}