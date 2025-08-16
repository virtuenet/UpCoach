import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import SessionWarningModal from "../../../shared/components/SessionWarningModal";
import { getSessionManager } from "../../../shared/services/sessionManager";

interface SessionWrapperProps {
  children: React.ReactNode;
}

export default function SessionWrapper({ children }: SessionWrapperProps) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const sessionManager = getSessionManager({
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      warningTime: 2 * 60 * 1000, // 2 minute warning
      onSessionExpired: () => {
        logout();
        navigate('/login');
      }
    });

    if (isAuthenticated) {
      sessionManager.startSession();
    } else {
      sessionManager.stopSession();
    }

    return () => {
      if (!isAuthenticated) {
        sessionManager.stopSession();
      }
    };
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
      <SessionWarningModal 
        onExtend={handleExtendSession}
        onExpire={handleSessionExpire}
      />
    </>
  );
}