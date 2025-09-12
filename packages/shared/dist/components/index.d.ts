import React from 'react';

interface SessionWarningModalProps {
    onExtend?: () => void;
    onExpire?: () => void;
    className?: string;
}
/**
 * Accessible session timeout warning modal
 * Provides a 2-minute warning before session expires
 */
declare const SessionWarningModal: React.FC<SessionWarningModalProps>;
/**
 * Hook for integrating session warning modal
 */
declare function useSessionWarning(): boolean;

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    className?: string;
}
declare const LoadingSpinner: React.FC<LoadingSpinnerProps>;

export { LoadingSpinner, type LoadingSpinnerProps, SessionWarningModal, useSessionWarning };
