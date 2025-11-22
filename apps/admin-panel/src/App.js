import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import UserRolesPage from './pages/UserRolesPage';
import UserActivityPage from './pages/UserActivityPage';
import ModerationPage from './pages/ModerationPage';
import PendingModerationPage from './pages/PendingModerationPage';
import FlaggedContentPage from './pages/FlaggedContentPage';
import UserReportsPage from './pages/UserReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { useAuthStore } from './stores/authStore';
import UserMetricsPage from './pages/UserMetricsPage';
import ContentPerformancePage from './pages/ContentPerformancePage';
import SystemHealthPage from './pages/SystemHealthPage';
import FinancialPage from './pages/FinancialPage';
import RevenuePage from './pages/RevenuePage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import TransactionsPage from './pages/TransactionsPage';
import SystemConfigPage from './pages/SystemConfigPage';
import GeneralSettingsPage from './pages/GeneralSettingsPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import BackupRecoveryPage from './pages/BackupRecoveryPage';
import Layout from './components/Layout';
import SessionWrapper from './components/SessionWrapper';
import { lightTheme } from '@upcoach/design-system';
function ProtectedRoute({ children }) {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    return isAuthenticated ? _jsx(_Fragment, { children: children }) : _jsx(Navigate, { to: "/login", replace: true });
}
function App() {
    const { initializeAuth } = useAuthStore();
    useEffect(() => {
        // Initialize secure authentication on app mount
        initializeAuth();
    }, [initializeAuth]);
    return (_jsxs(ThemeProvider, { theme: lightTheme, children: [_jsx(CssBaseline, {}), _jsx(SessionWrapper, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/*", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/users", element: _jsx(UsersPage, {}) }), _jsx(Route, { path: "/users/roles", element: _jsx(UserRolesPage, {}) }), _jsx(Route, { path: "/users/activity", element: _jsx(UserActivityPage, {}) }), _jsx(Route, { path: "/moderation", element: _jsx(ModerationPage, {}) }), _jsx(Route, { path: "/moderation/pending", element: _jsx(PendingModerationPage, {}) }), _jsx(Route, { path: "/moderation/flagged", element: _jsx(FlaggedContentPage, {}) }), _jsx(Route, { path: "/moderation/reports", element: _jsx(UserReportsPage, {}) }), _jsx(Route, { path: "/analytics", element: _jsx(AnalyticsPage, {}) }), _jsx(Route, { path: "/analytics/users", element: _jsx(UserMetricsPage, {}) }), _jsx(Route, { path: "/analytics/content", element: _jsx(ContentPerformancePage, {}) }), _jsx(Route, { path: "/analytics/system", element: _jsx(SystemHealthPage, {}) }), _jsx(Route, { path: "/financial", element: _jsx(FinancialPage, {}) }), _jsx(Route, { path: "/financial/revenue", element: _jsx(RevenuePage, {}) }), _jsx(Route, { path: "/financial/subscriptions", element: _jsx(SubscriptionsPage, {}) }), _jsx(Route, { path: "/financial/transactions", element: _jsx(TransactionsPage, {}) }), _jsx(Route, { path: "/system", element: _jsx(SystemConfigPage, {}) }), _jsx(Route, { path: "/system/general", element: _jsx(GeneralSettingsPage, {}) }), _jsx(Route, { path: "/system/security", element: _jsx(SecuritySettingsPage, {}) }), _jsx(Route, { path: "/system/integrations", element: _jsx(IntegrationsPage, {}) }), _jsx(Route, { path: "/system/backup", element: _jsx(BackupRecoveryPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }) })] }) })] }));
}
export default App;
//# sourceMappingURL=App.js.map