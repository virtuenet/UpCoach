import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { SessionWarningModal } from '@upcoach/shared/components';
export default function SessionWrapper({ children }) {
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuthStore();
    useEffect(() => {
        // Session management will be implemented when sessionManager service is available
        // For now, just handle authentication state changes
        if (!isAuthenticated) {
            // User is not authenticated, no session to manage
            return;
        }
    }, [isAuthenticated, logout, navigate]);
    const handleExtendSession = () => {
        console.log('Session extended by user');
    };
    const handleSessionExpire = () => {
        logout();
        navigate('/login');
    };
    return (_jsxs(_Fragment, { children: [children, _jsx(SessionWarningModal, { onExtend: handleExtendSession, onExpire: handleSessionExpire })] }));
}
//# sourceMappingURL=SessionWrapper.js.map