import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import SessionWrapper from './components/SessionWrapper';
import theme from './theme';
import { LazyPages } from './components/LazyLoad';

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
    <ThemeProvider theme={theme}>
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
                    <Route path="/" element={<LazyPages.Dashboard />} />
                    <Route path="/dashboard" element={<LazyPages.Dashboard />} />
                    <Route path="/content" element={<LazyPages.ContentList />} />
                    <Route path="/content/categories" element={<LazyPages.Categories />} />
                    <Route path="/content/create" element={<LazyPages.CreateContent />} />
                    <Route path="/content/edit/:id" element={<LazyPages.ContentEditor />} />
                    <Route path="/courses" element={<LazyPages.CoachMarketplace />} />
                    <Route path="/courses/create" element={<LazyPages.CreateContent />} />
                    <Route path="/media" element={<LazyPages.ContentList />} />
                    <Route path="/analytics" element={<LazyPages.Analytics />} />
                    <Route path="/experience/landing" element={<LazyPages.LandingExperience />} />
                    <Route path="/settings" element={<LazyPages.Settings />} />
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
