import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Navigation, adminNavigation, generateBreadcrumbs } from '@upcoach/design-system';
import { useAuthStore } from '../stores/authStore';
import Breadcrumbs from './Breadcrumbs';
import * as Icons from '@mui/icons-material';
// Enhanced monitoring service for error tracking
class MonitoringService {
    constructor() {
        this.isInitialized = false;
    }
    static getInstance() {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }
    initialize() {
        if (this.isInitialized)
            return;
        // Initialize monitoring based on environment
        if (process.env.NODE_ENV === 'production') {
            // In production, we would initialize Sentry, DataDog, or other monitoring services
            // For now, we'll set up enhanced console logging with structured data
            this.initializeProductionLogging();
        }
        this.isInitialized = true;
    }
    initializeProductionLogging() {
        // Enhanced console logging for production environments
        // This could be replaced with actual monitoring service initialization
        console.info('Monitoring service initialized for production environment');
    }
    captureError(error, context) {
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
        }
        else {
            // Enhanced development logging
            console.group('🚨 Error Captured by Monitoring Service');
            console.error('Error:', error);
            console.log('Context:', errorData.context);
            console.groupEnd();
        }
    }
    async sendToMonitoringService(errorData) {
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
        }
        catch (monitoringError) {
            console.warn('Failed to send error to monitoring service:', monitoringError);
        }
    }
    captureEvent(eventName, data) {
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
const iconMap = {
    BarChart: Icons.BarChart,
    Users: Icons.People,
    Shield: Icons.Shield,
    TrendingUp: Icons.TrendingUp,
    DollarSign: Icons.AttachMoney,
    Settings2: Icons.Settings,
};
// Transform navigation items to include actual icon components
const transformNavigationWithIcons = (items) => {
    return items.map(item => ({
        ...item,
        icon: item.icon && typeof item.icon === 'object' && 'name' in item.icon
            ? React.createElement(iconMap[item.icon.name] || Icons.Circle)
            : item.icon,
        children: item.children ? transformNavigationWithIcons(item.children) : undefined,
    }));
};
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.handleRetry = () => {
            this.setState({ hasError: false, error: undefined, errorInfo: undefined });
        };
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
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
    render() {
        if (this.state.hasError) {
            return this.props.fallback || (_jsx(Box, { sx: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    bgcolor: 'background.default'
                }, children: _jsxs(Paper, { elevation: 3, sx: {
                        p: 4,
                        textAlign: 'center',
                        maxWidth: 600,
                        mx: 2
                    }, children: [_jsx(Typography, { variant: "h4", color: "error", gutterBottom: true, children: "Oops! Something went wrong" }), _jsx(Typography, { variant: "body1", color: "text.secondary", sx: { mb: 3 }, children: "We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue." }), process.env.NODE_ENV === 'development' && this.state.error && (_jsxs(Paper, { sx: {
                                p: 2,
                                mt: 2,
                                bgcolor: 'grey.50',
                                textAlign: 'left',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem'
                            }, children: [_jsx(Typography, { variant: "subtitle2", color: "error", gutterBottom: true, children: "Error Details (Development Mode):" }), _jsxs(Typography, { variant: "body2", component: "pre", sx: { whiteSpace: 'pre-wrap' }, children: [this.state.error.message, '\n\n', this.state.error.stack] })] })), _jsxs(Box, { sx: { mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }, children: [_jsx(Button, { variant: "contained", color: "primary", onClick: this.handleRetry, children: "Try Again" }), _jsx(Button, { variant: "outlined", onClick: () => window.location.reload(), children: "Refresh Page" })] })] }) }));
        }
        return this.props.children;
    }
}
export default function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [navigationVariant, setNavigationVariant] = useState('permanent');
    const handleNavigate = (path) => {
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
    const logoComponent = (_jsx(Box, { sx: {
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
        }, children: "UA" }));
    return (_jsxs(ErrorBoundary, { children: [_jsx(Box, { component: "a", href: "#main-content", sx: {
                    position: 'absolute',
                    left: '-10000px',
                    top: 'auto',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    '&:focus': {
                        position: 'static',
                        width: 'auto',
                        height: 'auto',
                        padding: 1,
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        textDecoration: 'none',
                        borderRadius: 1,
                        zIndex: 1000,
                    },
                }, children: "Skip to main content" }), _jsxs(Box, { sx: { display: 'flex', minHeight: '100vh' }, role: "application", "aria-label": "UpCoach Admin Panel", children: [_jsx(Box, { component: "nav", role: "navigation", "aria-label": "Main navigation", children: _jsx(Navigation, { items: navigationItems, logo: logoComponent, title: "UpCoach Admin", user: user ? {
                                name: user.name || 'Admin User',
                                email: user.email,
                                avatar: user.avatar,
                            } : undefined, onNavigate: handleNavigate, onLogout: handleLogout, variant: navigationVariant === 'mini' ? 'permanent' : navigationVariant, currentPath: location.pathname, notifications: 5 }) }), _jsxs(Box, { component: "main", id: "main-content", role: "main", "aria-label": "Main content area", sx: {
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '100vh',
                            ml: { md: navigationVariant === 'mini' ? '72px' : navigationVariant === 'permanent' ? '260px' : '0' },
                            mt: '64px', // AppBar height
                        }, children: [breadcrumbs.length > 0 && (_jsx(Box, { sx: { px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }, role: "navigation", "aria-label": "Breadcrumb navigation", children: _jsx(Breadcrumbs, { items: breadcrumbs }) })), _jsx(Box, { sx: { flex: 1, p: 3 }, role: "region", "aria-label": "Page content", children: children })] })] })] }));
}
//# sourceMappingURL=Layout.js.map