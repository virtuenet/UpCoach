import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ContentPage from './pages/ContentPage'
import CreateContentPage from './pages/CreateContentPage'
import EditContentPage from './pages/EditContentPage'
import MediaLibraryPage from './pages/MediaLibraryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import CoursesPage from './pages/CoursesPage'
import CreateCoursePage from './pages/CreateCoursePage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'
import SessionWrapper from './components/SessionWrapper'
import theme from './theme'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    // Initialize secure authentication on app mount
    initializeAuth()
  }, [initializeAuth])

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
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/content" element={<ContentPage />} />
                    <Route path="/content/create" element={<CreateContentPage />} />
                    <Route path="/content/edit/:id" element={<EditContentPage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/courses/create" element={<CreateCoursePage />} />
                    <Route path="/media" element={<MediaLibraryPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </SessionWrapper>
    </ThemeProvider>
  )
}

export default App 