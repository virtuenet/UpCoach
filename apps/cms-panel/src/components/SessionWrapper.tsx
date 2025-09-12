import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { SessionWarningModal } from '@upcoach/shared/components';
// import { getSessionManager } from '@upcoach/shared/services'; // Temporarily commented until sessionManager is available

interface SessionWrapperProps {
  children: React.ReactNode;
}

export default function SessionWrapper({ children }: SessionWrapperProps) {
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

  return (
    <>
      {children}
      <SessionWarningModal onExtend={handleExtendSession} onExpire={handleSessionExpire} />
    </>
  );
}
