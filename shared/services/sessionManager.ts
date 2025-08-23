import { EventEmitter } from '../utils/EventEmitter';
import * as React from 'react';

interface SessionConfig {
  sessionTimeout: number; // in milliseconds
  warningTime: number; // time before expiry to show warning (in milliseconds)
  checkInterval: number; // how often to check session (in milliseconds)
  onSessionExpired?: () => void;
  onWarningShown?: () => void;
  onSessionExtended?: () => void;
}

class SessionManager {
  private config: SessionConfig;
  private lastActivity: number;
  private checkTimer: ReturnType<typeof setTimeout> | null = null;
  private warningShown: boolean = false;
  private sessionActive: boolean = false;
  private activityListeners: Array<() => void> = [];
  private emitter: EventEmitter;

  constructor(config?: Partial<SessionConfig>) {
    this.emitter = new EventEmitter();
    
    this.config = {
      sessionTimeout: parseInt(process.env.REACT_APP_SESSION_TIMEOUT || '1800000', 10), // 30 minutes default
      warningTime: parseInt(process.env.REACT_APP_SESSION_WARNING || '120000', 10), // 2 minutes default
      checkInterval: 10000, // Check every 10 seconds
      ...config
    };
    
    this.lastActivity = Date.now();
  }

  /**
   * Start monitoring session activity
   */
  public startSession(): void {
    if (this.sessionActive) return;
    
    this.sessionActive = true;
    this.lastActivity = Date.now();
    this.warningShown = false;
    
    // Set up activity listeners
    this.setupActivityListeners();
    
    // Start checking session
    this.startChecking();
    
    // Announce to screen readers
    this.announceToScreenReader('Session monitoring started');
  }

  /**
   * Stop monitoring session
   */
  public stopSession(): void {
    if (!this.sessionActive) return;
    
    this.sessionActive = false;
    this.clearActivityListeners();
    
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    
    // Announce to screen readers
    this.announceToScreenReader('Session monitoring stopped');
  }

  /**
   * Extend the current session
   */
  public extendSession(): void {
    this.lastActivity = Date.now();
    this.warningShown = false;
    
    this.emit('sessionExtended');
    
    if (this.config.onSessionExtended) {
      this.config.onSessionExtended();
    }
    
    // Announce to screen readers
    this.announceToScreenReader('Session extended successfully');
  }

  /**
   * Get remaining session time in milliseconds
   */
  public getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivity;
    const remaining = this.config.sessionTimeout - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Get remaining time as human-readable string
   */
  public getRemainingTimeString(): string {
    const remaining = this.getRemainingTime();
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  /**
   * Check if warning should be shown
   */
  public shouldShowWarning(): boolean {
    const remaining = this.getRemainingTime();
    return remaining <= this.config.warningTime && remaining > 0 && !this.warningShown;
  }

  /**
   * Update last activity timestamp
   */
  public updateActivity(): void {
    if (!this.sessionActive) return;
    
    const wasWarningShown = this.warningShown;
    this.lastActivity = Date.now();
    
    // Hide warning if it was shown
    if (wasWarningShown) {
      this.warningShown = false;
      this.emit('warningHidden');
    }
  }

  /**
   * Set up activity listeners for user interactions
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.updateActivity();
    };
    
    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
      this.activityListeners.push(() => 
        document.removeEventListener(event, activityHandler)
      );
    });
  }

  /**
   * Clear all activity listeners
   */
  private clearActivityListeners(): void {
    this.activityListeners.forEach(cleanup => cleanup());
    this.activityListeners = [];
  }

  /**
   * Start checking session status
   */
  private startChecking(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    
    this.checkTimer = setInterval(() => {
      this.checkSession();
    }, this.config.checkInterval);
    
    // Initial check
    this.checkSession();
  }

  /**
   * Check current session status
   */
  private checkSession(): void {
    if (!this.sessionActive) return;
    
    const remaining = this.getRemainingTime();
    
    // Session expired
    if (remaining <= 0) {
      this.handleSessionExpired();
      return;
    }
    
    // Should show warning
    if (this.shouldShowWarning()) {
      this.showWarning();
    }
  }

  /**
   * Show session warning
   */
  private showWarning(): void {
    if (this.warningShown) return;
    
    this.warningShown = true;
    this.emit('warningShown', this.getRemainingTimeString());
    
    if (this.config.onWarningShown) {
      this.config.onWarningShown();
    }
    
    // Announce to screen readers with high priority
    this.announceToScreenReader(
      `Warning: Your session will expire in ${this.getRemainingTimeString()}. Press Enter to extend your session.`,
      'assertive'
    );
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpired(): void {
    this.stopSession();
    this.emit('sessionExpired');
    
    if (this.config.onSessionExpired) {
      this.config.onSessionExpired();
    }
    
    // Announce to screen readers with high priority
    this.announceToScreenReader(
      'Your session has expired. You will be redirected to the login page.',
      'assertive'
    );
  }

  /**
   * Announce message to screen readers
   */
  private announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Get session status for debugging
   */
  public getStatus(): {
    active: boolean;
    remaining: number;
    remainingString: string;
    warningShown: boolean;
    lastActivity: Date;
  } {
    return {
      active: this.sessionActive,
      remaining: this.getRemainingTime(),
      remainingString: this.getRemainingTimeString(),
      warningShown: this.warningShown,
      lastActivity: new Date(this.lastActivity)
    };
  }

  // EventEmitter delegation methods
  on(event: string, listener: Function) {
    return this.emitter.on(event, listener);
  }

  off(event: string, listener: Function) {
    return this.emitter.off(event, listener);
  }

  emit(event: string, ...args: any[]) {
    return this.emitter.emit(event, ...args);
  }
}

// Create singleton instance
let sessionManagerInstance: SessionManager | null = null;

/**
 * Get or create session manager instance
 */
export function getSessionManager(config?: Partial<SessionConfig>): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(config);
  }
  return sessionManagerInstance;
}

/**
 * React hook for using session manager
 */
export function useSessionManager() {
  const [sessionStatus, setSessionStatus] = React.useState(() => {
    const manager = getSessionManager();
    return manager.getStatus();
  });
  
  React.useEffect(() => {
    const manager = getSessionManager();
    
    const updateStatus = () => {
      setSessionStatus(manager.getStatus());
    };
    
    // Listen to session events
    manager.on('warningShown', updateStatus);
    manager.on('warningHidden', updateStatus);
    manager.on('sessionExtended', updateStatus);
    manager.on('sessionExpired', updateStatus);
    
    // Update status periodically
    const interval = setInterval(updateStatus, 1000);
    
    return () => {
      manager.off('warningShown', updateStatus);
      manager.off('warningHidden', updateStatus);
      manager.off('sessionExtended', updateStatus);
      manager.off('sessionExpired', updateStatus);
      clearInterval(interval);
    };
  }, []);
  
  return {
    ...sessionStatus,
    extendSession: () => getSessionManager().extendSession(),
    startSession: () => getSessionManager().startSession(),
    stopSession: () => getSessionManager().stopSession()
  };
}

// React is already imported at the top

export default SessionManager;