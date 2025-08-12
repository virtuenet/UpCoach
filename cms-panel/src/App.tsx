import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
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
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
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
          </div>
        </Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App 