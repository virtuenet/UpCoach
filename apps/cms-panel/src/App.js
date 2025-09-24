import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContentPage from './pages/ContentPage';
import CreateContentPage from './pages/CreateContentPage';
import EditContentPage from './pages/EditContentPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CoursesPage from './pages/CoursesPage';
import CreateCoursePage from './pages/CreateCoursePage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';
import SessionWrapper from './components/SessionWrapper';
import theme from './theme';
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
    return (_jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsx(SessionWrapper, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/*", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/content", element: _jsx(ContentPage, {}) }), _jsx(Route, { path: "/content/create", element: _jsx(CreateContentPage, {}) }), _jsx(Route, { path: "/content/edit/:id", element: _jsx(EditContentPage, {}) }), _jsx(Route, { path: "/courses", element: _jsx(CoursesPage, {}) }), _jsx(Route, { path: "/courses/create", element: _jsx(CreateCoursePage, {}) }), _jsx(Route, { path: "/media", element: _jsx(MediaLibraryPage, {}) }), _jsx(Route, { path: "/analytics", element: _jsx(AnalyticsPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }) })] }) })] }));
}
export default App;
//# sourceMappingURL=App.js.map