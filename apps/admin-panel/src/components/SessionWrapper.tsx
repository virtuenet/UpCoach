import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface SessionWrapperProps {
  children: React.ReactNode;
}

export default function SessionWrapper({ children }: SessionWrapperProps) {
  const { refreshAuth } = useAuthStore();

  useEffect(() => {
    // Set up automatic token refresh
    const interval = setInterval(() => {
      refreshAuth();
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(interval);
  }, [refreshAuth]);

  // Set up session timeout warning
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);

      // Show warning after 25 minutes of inactivity
      warningTimer = setTimeout(() => {
        // In a real app, show a modal warning about session expiration
        console.warn('Session will expire in 5 minutes due to inactivity');
      }, 25 * 60 * 1000);

      // Auto-logout after 30 minutes of inactivity
      inactivityTimer = setTimeout(() => {
        useAuthStore.getState().logout();
      }, 30 * 60 * 1000);
    };

    const handleActivity = () => {
      resetTimers();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timers
    resetTimers();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  return <>{children}</>;
}