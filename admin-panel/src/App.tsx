import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import "./styles/layout-fixes.css";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import ChatPage from "./pages/ChatPage";
import GoalsPage from "./pages/GoalsPage";
import TasksPage from "./pages/TasksPage";
import MoodPage from "./pages/MoodPage";
import SettingsPage from "./pages/SettingsPage";
import FinancialDashboardPage from "./pages/FinancialDashboardPage";
import CostTrackingPage from "./pages/CostTrackingPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import ReportsPage from "./pages/ReportsPage";
import CMSPage from "./pages/CMSPage";
import ContentEditorPage from "./pages/ContentEditorPage";
import AIAnalytics from "./pages/AIAnalytics";
import ReferralManagement from "./pages/ReferralManagement";
import { useAuthStore } from "./stores/authStore";

function App() {
  const [isLoading, setIsLoading] = useState(true);

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
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
    </Router>
  );
}

export default App;
