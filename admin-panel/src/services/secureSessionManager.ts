import { logger } from '../utils/logger';
import { csrfManager } from './csrfManager';

interface SessionConfig {
  timeout: number;
  warningTime: number;
  checkInterval: number;
}

interface SessionState {
  isActive: boolean;
  lastActivity: number;
  sessionId: string | null;
  userId: string | null;
}

class SecureSessionManager {
  private config: SessionConfig = {
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // 5 minutes warning
    checkInterval: 60 * 1000, // Check every minute
  };

  private state: SessionState = {
    isActive: false,
    lastActivity: Date.now(),
    sessionId: null,
    userId: null,
  };

  private warningCallback?: () => void;
  private timeoutCallback?: () => void;
  private checkTimer?: NodeJS.Timeout;
  private readonly storageKey = 'upcoach_secure_session';
  private readonly activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  constructor() {
    this.loadSession();
    this.setupEventListeners();
    this.startSessionCheck();
  }

  private loadSession(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Validate session data
        if (this.isValidSession(data)) {
          this.state = {
            ...this.state,
            ...data,
            isActive: true,
          };
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      logger.error('Failed to load session', { error });
      this.clearSession();
    }
  }

  private isValidSession(data: any): boolean {
    if (!data.sessionId || !data.lastActivity) {
      return false;
    }

    // Check if session has expired
    const elapsed = Date.now() - data.lastActivity;
    if (elapsed > this.config.timeout) {
      return false;
    }

    // Validate session structure
    if (typeof data.sessionId !== 'string' || (data.userId && typeof data.userId !== 'string')) {
      return false;
    }

    return true;
  }

  private saveSession(): void {
    try {
      const data = {
        sessionId: this.state.sessionId,
        userId: this.state.userId,
        lastActivity: this.state.lastActivity,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save session', { error });
    }
  }

  private clearSession(): void {
    this.state = {
      isActive: false,
      lastActivity: Date.now(),
      sessionId: null,
      userId: null,
    };

    try {
      localStorage.removeItem(this.storageKey);
      // Clear all sensitive data from storage
      this.clearSensitiveData();
    } catch (error) {
      logger.error('Failed to clear session', { error });
    }
  }

  private clearSensitiveData(): void {
    // Clear any cached sensitive data
    const sensitiveKeys = ['auth_token', 'refresh_token', 'user_data', 'csrf_token'];

    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Clear cookies if needed
    document.cookie.split(';').forEach(c => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  }

  private setupEventListeners(): void {
    // Use arrow function to preserve 'this' context
    const handler = () => this.handleActivity();

    this.activityEvents.forEach(eventType => {
      document.addEventListener(eventType, handler as EventListener);
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.activityEvents.forEach(eventType => {
        document.removeEventListener(eventType, handler as EventListener);
      });
      this.destroy();
    });
  }

  private handleActivity(): void {
    if (!this.state.isActive) {
      return;
    }

    const now = Date.now();
    const elapsed = now - this.state.lastActivity;

    // Only update if significant time has passed (reduce storage writes)
    if (elapsed > 5000) {
      this.state.lastActivity = now;
      this.saveSession();
    }
  }

  private startSessionCheck(): void {
    this.checkTimer = setInterval(() => {
      this.checkSession();
    }, this.config.checkInterval);
  }

  private checkSession(): void {
    if (!this.state.isActive) {
      return;
    }

    const elapsed = Date.now() - this.state.lastActivity;
    const remaining = this.config.timeout - elapsed;

    if (remaining <= 0) {
      // Session expired
      this.handleTimeout();
    } else if (remaining <= this.config.warningTime && this.warningCallback) {
      // Show warning
      this.warningCallback();
    }
  }

  private handleTimeout(): void {
    logger.warn('Session timeout', {
      sessionId: this.state.sessionId,
      userId: this.state.userId,
    });

    this.clearSession();

    if (this.timeoutCallback) {
      this.timeoutCallback();
    }

    // Force logout
    window.location.href = '/login?reason=session_timeout';
  }

  public startSession(sessionId: string, userId?: string): void {
    this.state = {
      isActive: true,
      lastActivity: Date.now(),
      sessionId,
      userId: userId || null,
    };

    this.saveSession();

    // Regenerate CSRF token for new session
    csrfManager.regenerateToken();

    logger.info('Session started', {
      sessionId,
      userId,
    });
  }

  public endSession(): void {
    logger.info('Session ended', {
      sessionId: this.state.sessionId,
      userId: this.state.userId,
    });

    this.clearSession();
  }

  public extendSession(): void {
    if (this.state.isActive) {
      this.state.lastActivity = Date.now();
      this.saveSession();
    }
  }

  public onWarning(callback: () => void): void {
    this.warningCallback = callback;
  }

  public onTimeout(callback: () => void): void {
    this.timeoutCallback = callback;
  }

  public getTimeRemaining(): number {
    if (!this.state.isActive) {
      return 0;
    }

    const elapsed = Date.now() - this.state.lastActivity;
    const remaining = this.config.timeout - elapsed;

    return Math.max(0, remaining);
  }

  public isSessionActive(): boolean {
    return this.state.isActive && this.getTimeRemaining() > 0;
  }

  public getSessionInfo(): Readonly<SessionState> {
    return { ...this.state };
  }

  public updateConfig(config: Partial<SessionConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Restart session check with new interval
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.startSessionCheck();
    }
  }

  public destroy(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    this.clearSession();
  }
}

export const secureSessionManager = new SecureSessionManager();
