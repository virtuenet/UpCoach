import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GlobalErrorBoundary } from "./components/ErrorBoundary/GlobalErrorBoundary";
import { AsyncErrorBoundary } from "./components/ErrorBoundary/AsyncErrorBoundary";
import { useState, useEffect, lazy, Suspense } from "react";
import SessionWrapper from "./components/SessionWrapper";
import { useAuthStore } from "./stores/authStore";
import { useKeyboardNavigation, useSkipLinks } from "./hooks/useAccessibility";
import "./styles/layout-fixes.css";
import "./styles/accessibility.css";

// Loading component for Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy load all components for code splitting
const Layout = lazy(() => import("./components/Layout"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const MoodPage = lazy(() => import("./pages/MoodPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Financial pages - lazy loaded
const FinancialDashboardPage = lazy(() => import("./pages/FinancialDashboardPage"));
const CostTrackingPage = lazy(() => import("./pages/CostTrackingPage"));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));

// CMS pages - lazy loaded
const CMSPage = lazy(() => import("./pages/CMSPage"));
const ContentEditorPage = lazy(() => import("./pages/ContentEditorPage"));

// AI and Referral pages - lazy loaded
const AIAnalytics = lazy(() => import("./pages/AIAnalytics"));
const ReferralManagement = lazy(() => import("./pages/ReferralManagement"));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Enable accessibility features
  useKeyboardNavigation();
  useSkipLinks();

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuth = async () => {
      try {
        await useAuthStore.getState().checkAuth();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <GlobalErrorBoundary level="global">
      <Router>
        <SessionWrapper>
          <AsyncErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/moods" element={<MoodPage />} />

                {/* Financial pages */}
                <Route path="/financial" element={<FinancialDashboardPage />} />
                <Route path="/financial/costs" element={<CostTrackingPage />} />
                <Route
                  path="/financial/subscriptions"
                  element={<SubscriptionsPage />}
                />
                <Route path="/financial/reports" element={<ReportsPage />} />

                {/* CMS pages */}
                <Route path="/cms" element={<CMSPage />} />
                <Route path="/cms/content/new" element={<ContentEditorPage />} />
                <Route path="/cms/content/:id" element={<ContentEditorPage />} />
                <Route path="/cms/content/:id/edit" element={<ContentEditorPage />} />

                {/* AI Analytics */}
                <Route path="/ai-analytics" element={<AIAnalytics />} />

                {/* Referral Management */}
                <Route path="/referrals" element={<ReferralManagement />} />

                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
          </AsyncErrorBoundary>
        </SessionWrapper>
      </Router>
    </GlobalErrorBoundary>
  );
}

export default App;