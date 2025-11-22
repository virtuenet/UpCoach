import React, { useEffect, useRef, useState } from 'react';
import { getSessionManager } from '../services/sessionManager';

interface SessionWarningModalProps {
  onExtend?: () => void;
  onExpire?: () => void;
  className?: string;
}

/**
 * Accessible session timeout warning modal
 * Provides a 2-minute warning before session expires
 */
export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  onExtend,
  onExpire,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);
  const extendButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sessionManager = getSessionManager();

    const handleWarningShown = (remainingTime: string) => {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      setIsVisible(true);
      setTimeRemaining(remainingTime);

      // Focus the extend button when modal opens
      setTimeout(() => {
        extendButtonRef.current?.focus();
      }, 100);

      // Start countdown update
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      countdownIntervalRef.current = setInterval(() => {
        const remaining = sessionManager.getRemainingTimeString();
        setTimeRemaining(remaining);

        // Update ARIA live region
        const liveRegion = document.getElementById('session-countdown');
        if (liveRegion) {
          liveRegion.textContent = `Time remaining: ${remaining}`;
        }
      }, 1000);
    };

    const handleWarningHidden = () => {
      setIsVisible(false);

      // Clear countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };

    const handleSessionExpired = () => {
      setIsVisible(false);

      // Clear countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      if (onExpire) {
        onExpire();
      }
    };

    const handleSessionExtended = () => {
      handleWarningHidden();

      if (onExtend) {
        onExtend();
      }
    };

    // Subscribe to events
    sessionManager.on('warningShown', handleWarningShown);
    sessionManager.on('warningHidden', handleWarningHidden);
    sessionManager.on('sessionExpired', handleSessionExpired);
    sessionManager.on('sessionExtended', handleSessionExtended);

    return () => {
      // Cleanup
      sessionManager.off('warningShown', handleWarningShown);
      sessionManager.off('warningHidden', handleWarningHidden);
      sessionManager.off('sessionExpired', handleSessionExpired);
      sessionManager.off('sessionExtended', handleSessionExtended);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [onExtend, onExpire]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Don't allow closing with Escape - user must make a choice
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Extend session on Enter or Space
        if (document.activeElement === extendButtonRef.current) {
          e.preventDefault();
          handleExtendSession();
        }
      }
    };

    const handleFocusTrap = (e: FocusEvent) => {
      if (!modalRef.current || !isVisible) return;

      // Keep focus within modal
      if (!modalRef.current.contains(e.target as Node)) {
        e.preventDefault();
        extendButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusTrap);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusTrap);
    };
  }, [isVisible]);

  const handleExtendSession = () => {
    const sessionManager = getSessionManager();
    sessionManager.extendSession();
  };

  const handleLogout = () => {
    setIsVisible(false);

    if (onExpire) {
      onExpire();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-warning-title"
        aria-describedby="session-warning-description"
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
      >
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2
            id="session-warning-title"
            className="text-xl font-bold text-center text-gray-900 mb-2"
          >
            Session Expiring Soon
          </h2>

          {/* Description */}
          <div id="session-warning-description" className="text-center mb-6">
            <p className="text-gray-600 mb-2">Your session will expire due to inactivity.</p>
            <p className="text-lg font-semibold text-gray-900">Time remaining: {timeRemaining}</p>
          </div>

          {/* Live region for countdown updates */}
          <div
            id="session-countdown"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            Time remaining: {timeRemaining}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              ref={extendButtonRef}
              onClick={handleExtendSession}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Extend session and continue working"
            >
              Continue Working
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Log out now"
            >
              Log Out
            </button>
          </div>

          {/* Help text */}
          <p className="mt-4 text-xs text-center text-gray-500">
            For your security, sessions expire after{' '}
            {process.env.REACT_APP_SESSION_TIMEOUT
              ? `${parseInt(process.env.REACT_APP_SESSION_TIMEOUT) / 60000} minutes`
              : '30 minutes'}{' '}
            of inactivity.
          </p>
        </div>
      </div>

      {/* Screen reader announcement for critical moments */}
      <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
        {parseInt(timeRemaining) <= 30 &&
          `Warning: Only ${timeRemaining} remaining. Please choose to continue working or log out.`}
      </div>
    </>
  );
};

/**
 * Hook for integrating session warning modal
 */
export function useSessionWarning() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const sessionManager = getSessionManager();

    const handleWarning = () => setShowModal(true);
    const handleHidden = () => setShowModal(false);
    const handleExpired = () => setShowModal(false);

    sessionManager.on('warningShown', handleWarning);
    sessionManager.on('warningHidden', handleHidden);
    sessionManager.on('sessionExpired', handleExpired);

    return () => {
      sessionManager.off('warningShown', handleWarning);
      sessionManager.off('warningHidden', handleHidden);
      sessionManager.off('sessionExpired', handleExpired);
    };
  }, []);

  return showModal;
}

export default SessionWarningModal;
