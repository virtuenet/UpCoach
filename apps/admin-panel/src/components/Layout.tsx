import React, { useState, ErrorInfo, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import {
  Navigation,
  adminNavigation,
  generateBreadcrumbs,
  NavigationItem
} from '@upcoach/design-system';
import { useAuthStore } from '../stores/authStore';
import Breadcrumbs from './Breadcrumbs';
import * as Icons from '@mui/icons-material';

// Enhanced monitoring service for error tracking
class MonitoringService {
  private static instance: MonitoringService;
  private isInitialized = false;

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public initialize() {
    if (this.isInitialized) return;

    // Initialize monitoring based on environment
    if (process.env.NODE_ENV === 'production') {
      // In production, we would initialize Sentry, DataDog, or other monitoring services
      // For now, we'll set up enhanced console logging with structured data
      this.initializeProductionLogging();
    }

    this.isInitialized = true;
  }

  private initializeProductionLogging() {
    // Enhanced console logging for production environments
    // This could be replaced with actual monitoring service initialization
    console.info('Monitoring service initialized for production environment');
  }

  public captureError(error: Error, context?: {
    component?: string;
    errorInfo?: ErrorInfo;
    user?: any;
    additionalData?: Record<string, any>;
  }) {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        component: context?.component || 'Unknown',
        user: context?.user ? {
          id: context.user.id,
          email: context.user.email,
          // Don't log sensitive user data
        } : null,
        react: context?.errorInfo ? {
          componentStack: context.errorInfo.componentStack,
        } : null,
        ...context?.additionalData,
      },
      severity: 'error',
      environment: process.env.NODE_ENV,
    };

    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
      this.sendToMonitoringService(errorData);
    } else {
      // Enhanced development logging
      console.group('🚨 Error Captured by Monitoring Service');
      console.error('Error:', error);
      console.log('Context:', errorData.context);
      console.groupEnd();
    }
  }

  private async sendToMonitoringService(errorData: any) {
    try {
      // In a real implementation, this would send to:
      // - Sentry: Sentry.captureException(error, { contexts: { ...context } });
      // - DataDog: ddTrace.tracer.recordError(error, context);
      // - Custom API endpoint for internal monitoring

      // For now, we'll use a structured console log that monitoring tools can pick up
      console.error('MONITORING_ERROR', JSON.stringify(errorData));

      // Optionally send to a custom monitoring endpoint
      if (process.env.REACT_APP_MONITORING_ENDPOINT) {
        await fetch(process.env.REACT_APP_MONITORING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData),
        }).catch(err => {
          console.warn('Failed to send error to monitoring endpoint:', err);
        });
      }
    } catch (monitoringError) {
      console.warn('Failed to send error to monitoring service:', monitoringError);
    }
  }

  public captureEvent(eventName: string, data?: Record<string, any>) {
    const eventData = {
      timestamp: new Date().toISOString(),
      event: eventName,
      data: data || {},
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      environment: process.env.NODE_ENV,
    };

    if (process.env.NODE_ENV === 'production') {
      console.log('MONITORING_EVENT', JSON.stringify(eventData));
    }
  }
}

// Initialize monitoring service
const monitoring = MonitoringService.getInstance();
monitoring.initialize();

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

// Type definitions must come before usage
type NavigationVariant = 'permanent' | 'temporary' | 'persistent' | undefined;
type ExtendedNavigationVariant = NavigationVariant | 'mini';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Send error to monitoring service with full context
    monitoring.captureError(error, {
      component: 'ErrorBoundary',
      errorInfo,
      additionalData: {
        errorBoundaryState: this.state,
        props: this.props,
      },
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              maxWidth: 600,
              mx: 2
            }}
          >
            <Typography variant="h4" color="error" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Paper 
                sx={{ 
                  p: 2, 
                  mt: 2, 
                  bgcolor: 'grey.50', 
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem'
                }}
              >
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Error Details (Development Mode):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </Typography>
              </Paper>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  
  const [navigationVariant, setNavigationVariant] = useState<ExtendedNavigationVariant>('permanent');

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
    <ErrorBoundary>
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
        variant={navigationVariant === 'mini' ? 'permanent' : navigationVariant}
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
          ml: { md: navigationVariant === 'mini' ? '72px' : navigationVariant === 'permanent' ? '260px' : '0' },
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
    </ErrorBoundary>
  );
}