import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuthStore } from './stores/authStore';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize secure authentication on app mount
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <SessionWrapper>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    
                    {/* User Management */}
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/users/roles" element={<UserRolesPage />} />
                    <Route path="/users/activity" element={<UserActivityPage />} />
                    
                    {/* Content Moderation */}
                    <Route path="/moderation" element={<ModerationPage />} />
                    <Route path="/moderation/pending" element={<PendingModerationPage />} />
                    <Route path="/moderation/flagged" element={<FlaggedContentPage />} />
                    <Route path="/moderation/reports" element={<UserReportsPage />} />
                    
                    {/* Analytics */}
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/analytics/users" element={<UserMetricsPage />} />
                    <Route path="/analytics/content" element={<ContentPerformancePage />} />
                    <Route path="/analytics/system" element={<SystemHealthPage />} />
                    
                    {/* Financial Management */}
                    <Route path="/financial" element={<FinancialPage />} />
                    <Route path="/financial/revenue" element={<RevenuePage />} />
                    <Route path="/financial/subscriptions" element={<SubscriptionsPage />} />
                    <Route path="/financial/transactions" element={<TransactionsPage />} />
                    
                    {/* System Configuration */}
                    <Route path="/system" element={<SystemConfigPage />} />
                    <Route path="/system/general" element={<GeneralSettingsPage />} />
                    <Route path="/system/security" element={<SecuritySettingsPage />} />
                    <Route path="/system/integrations" element={<IntegrationsPage />} />
                    <Route path="/system/backup" element={<BackupRecoveryPage />} />
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </SessionWrapper>
    </ThemeProvider>
  );
}

export default App;