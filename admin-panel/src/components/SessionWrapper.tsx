import { useEffect, useRef } from "react";
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
  const sessionManagerRef = useRef<ReturnType<typeof getSessionManager> | null>(null);

  useEffect(() => {
    // Create session manager only once
    if (!sessionManagerRef.current) {
      sessionManagerRef.current = getSessionManager({
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        warningTime: 2 * 60 * 1000, // 2 minute warning
        onSessionExpired: () => {
          logout();
          navigate('/login');
        }
      });
    }

    const sessionManager = sessionManagerRef.current;

    if (isAuthenticated) {
      sessionManager.startSession();
    } else {
      sessionManager.stopSession();
    }

    // Cleanup function - always stop session on unmount
    return () => {
      sessionManager.stopSession();
    };
  }, [isAuthenticated, logout, navigate]);

  // Cleanup session manager on component unmount
  useEffect(() => {
    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.stopSession();
        sessionManagerRef.current = null;
      }
    };
  }, []);

  const handleExtendSession = () => {
    if (sessionManagerRef.current) {
      sessionManagerRef.current.extendSession();
    }
    console.log('Session extended by user');
  };

  const handleSessionExpire = () => {
    if (sessionManagerRef.current) {
      sessionManagerRef.current.stopSession();
    }
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