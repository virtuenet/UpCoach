/**
 * Session Manager Service
 *
 * Secure session handling with device fingerprinting, session rotation,
 * concurrent session limits, and suspicious activity detection.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// Session Status
export type SessionStatus = 'active' | 'expired' | 'revoked' | 'suspicious';

// Device Type
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

// Device Fingerprint
export interface DeviceFingerprint {
  hash: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution?: string;
  colorDepth?: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  webglVendor?: string;
  webglRenderer?: string;
  plugins?: string[];
  fonts?: string[];
  canvas?: string;
  audio?: string;
}

// Session
export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  status: SessionStatus;
  deviceFingerprint: DeviceFingerprint;
  deviceType: DeviceType;
  deviceName: string;
  ipAddress: string;
  location?: SessionLocation;
  userAgent: string;
  mfaVerified: boolean;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  refreshExpiresAt: number;
  metadata: Record<string, unknown>;
}

// Session Location
export interface SessionLocation {
  country: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  isVpn?: boolean;
  isTor?: boolean;
  isProxy?: boolean;
}

// Session Activity
export interface SessionActivity {
  id: string;
  sessionId: string;
  userId: string;
  action: string;
  resource?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  success: boolean;
  metadata: Record<string, unknown>;
}

// Suspicious Activity Alert
export interface SuspiciousActivityAlert {
  id: string;
  sessionId: string;
  userId: string;
  type: SuspiciousActivityType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: Record<string, unknown>;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

export type SuspiciousActivityType =
  | 'impossible_travel'
  | 'new_device'
  | 'unusual_location'
  | 'brute_force'
  | 'session_hijacking'
  | 'concurrent_sessions'
  | 'unusual_time'
  | 'unusual_behavior';

// Session Manager Configuration
export interface SessionManagerConfig {
  sessionDurationMinutes: number;
  refreshDurationDays: number;
  maxConcurrentSessions: number;
  inactivityTimeoutMinutes: number;
  rotateSessionOnActivity: boolean;
  rotationIntervalMinutes: number;
  requireMfaForNewDevice: boolean;
  blockSuspiciousSessions: boolean;
  enableLocationTracking: boolean;
  impossibleTravelSpeedKmh: number;
}

// Session Stats
export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  byStatus: Record<SessionStatus, number>;
  byDeviceType: Record<DeviceType, number>;
  suspiciousAlerts: number;
  avgSessionDurationMinutes: number;
}

export class SessionManager extends EventEmitter {
  private config: SessionManagerConfig;
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private activities: SessionActivity[] = [];
  private alerts: Map<string, SuspiciousActivityAlert> = new Map();
  private ipLocationCache: Map<string, SessionLocation> = new Map();

  constructor(config?: Partial<SessionManagerConfig>) {
    super();
    this.config = {
      sessionDurationMinutes: 60,
      refreshDurationDays: 30,
      maxConcurrentSessions: 5,
      inactivityTimeoutMinutes: 30,
      rotateSessionOnActivity: true,
      rotationIntervalMinutes: 15,
      requireMfaForNewDevice: true,
      blockSuspiciousSessions: true,
      enableLocationTracking: true,
      impossibleTravelSpeedKmh: 1000,
      ...config,
    };

    // Clean up expired sessions periodically
    setInterval(() => this.cleanupExpiredSessions(), 60000);
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    deviceFingerprint: DeviceFingerprint,
    ipAddress: string,
    userAgent: string,
    mfaVerified: boolean = false,
    metadata: Record<string, unknown> = {}
  ): Promise<Session> {
    // Check concurrent session limit
    await this.enforceConcurrentLimit(userId);

    // Detect device type
    const deviceType = this.detectDeviceType(userAgent);
    const deviceName = this.parseDeviceName(userAgent);

    // Get location if enabled
    let location: SessionLocation | undefined;
    if (this.config.enableLocationTracking) {
      location = await this.getLocationFromIP(ipAddress);
    }

    // Check for suspicious activity
    const existingSessions = this.getUserSessions(userId);
    if (existingSessions.length > 0) {
      await this.checkForSuspiciousActivity(userId, deviceFingerprint, ipAddress, location);
    }

    const now = Date.now();
    const session: Session = {
      id: this.generateSessionId(),
      userId,
      token: this.generateToken(),
      refreshToken: this.generateToken(),
      status: 'active',
      deviceFingerprint,
      deviceType,
      deviceName,
      ipAddress,
      location,
      userAgent,
      mfaVerified,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + this.config.sessionDurationMinutes * 60 * 1000,
      refreshExpiresAt: now + this.config.refreshDurationDays * 24 * 60 * 60 * 1000,
      metadata,
    };

    this.sessions.set(session.id, session);

    // Track user sessions
    let userSessionSet = this.userSessions.get(userId);
    if (!userSessionSet) {
      userSessionSet = new Set();
      this.userSessions.set(userId, userSessionSet);
    }
    userSessionSet.add(session.id);

    // Log activity
    this.logActivity(session.id, userId, 'session_created', undefined, ipAddress, userAgent, true);

    this.emit('session-created', { sessionId: session.id, userId, deviceType });

    return session;
  }

  /**
   * Validate session token
   */
  validateSession(token: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.token === token && session.status === 'active') {
        if (Date.now() > session.expiresAt) {
          session.status = 'expired';
          this.emit('session-expired', { sessionId: session.id, userId: session.userId });
          return null;
        }

        // Check inactivity timeout
        if (Date.now() - session.lastActivityAt > this.config.inactivityTimeoutMinutes * 60 * 1000) {
          session.status = 'expired';
          this.emit('session-inactive', { sessionId: session.id, userId: session.userId });
          return null;
        }

        return session;
      }
    }
    return null;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session activity
   */
  updateActivity(
    sessionId: string,
    action: string,
    resource?: string,
    ipAddress?: string,
    userAgent?: string
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return false;

    const now = Date.now();

    // Check if session should be rotated
    if (
      this.config.rotateSessionOnActivity &&
      now - session.lastActivityAt > this.config.rotationIntervalMinutes * 60 * 1000
    ) {
      session.token = this.generateToken();
      this.emit('session-rotated', { sessionId, userId: session.userId });
    }

    session.lastActivityAt = now;

    // Extend session if active
    session.expiresAt = now + this.config.sessionDurationMinutes * 60 * 1000;

    // Log activity
    this.logActivity(
      sessionId,
      session.userId,
      action,
      resource,
      ipAddress || session.ipAddress,
      userAgent || session.userAgent,
      true
    );

    return true;
  }

  /**
   * Refresh session
   */
  async refreshSession(refreshToken: string, ipAddress: string, userAgent: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.refreshToken === refreshToken) {
        if (session.status !== 'active' && session.status !== 'expired') {
          return null;
        }

        if (Date.now() > session.refreshExpiresAt) {
          session.status = 'expired';
          return null;
        }

        // Check for IP/device changes
        if (session.ipAddress !== ipAddress) {
          // Log suspicious refresh
          this.createAlert(
            session.id,
            session.userId,
            'session_hijacking',
            'high',
            `Session refreshed from different IP: ${session.ipAddress} -> ${ipAddress}`,
            { oldIP: session.ipAddress, newIP: ipAddress }
          );

          if (this.config.blockSuspiciousSessions) {
            session.status = 'suspicious';
            return null;
          }
        }

        const now = Date.now();

        // Generate new tokens
        session.token = this.generateToken();
        session.refreshToken = this.generateToken();
        session.status = 'active';
        session.lastActivityAt = now;
        session.expiresAt = now + this.config.sessionDurationMinutes * 60 * 1000;
        session.refreshExpiresAt = now + this.config.refreshDurationDays * 24 * 60 * 60 * 1000;
        session.ipAddress = ipAddress;
        session.userAgent = userAgent;

        this.logActivity(session.id, session.userId, 'session_refreshed', undefined, ipAddress, userAgent, true);

        this.emit('session-refreshed', { sessionId: session.id, userId: session.userId });

        return session;
      }
    }
    return null;
  }

  /**
   * Revoke session
   */
  revokeSession(sessionId: string, reason?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'revoked';
    this.logActivity(
      sessionId,
      session.userId,
      'session_revoked',
      undefined,
      session.ipAddress,
      session.userAgent,
      true,
      { reason }
    );

    this.emit('session-revoked', { sessionId, userId: session.userId, reason });

    return true;
  }

  /**
   * Revoke all sessions for user
   */
  revokeAllUserSessions(userId: string, exceptSessionId?: string): number {
    const userSessionSet = this.userSessions.get(userId);
    if (!userSessionSet) return 0;

    let count = 0;
    for (const sessionId of userSessionSet) {
      if (sessionId !== exceptSessionId) {
        if (this.revokeSession(sessionId, 'user_revoke_all')) {
          count++;
        }
      }
    }

    this.emit('all-sessions-revoked', { userId, count, exceptSessionId });

    return count;
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): Session[] {
    const userSessionSet = this.userSessions.get(userId);
    if (!userSessionSet) return [];

    const sessions: Session[] = [];
    for (const sessionId of userSessionSet) {
      const session = this.sessions.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }

  /**
   * Get active sessions for user
   */
  getActiveUserSessions(userId: string): Session[] {
    return this.getUserSessions(userId).filter((s) => s.status === 'active');
  }

  /**
   * Mark session as MFA verified
   */
  markMfaVerified(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.mfaVerified = true;
    this.logActivity(
      sessionId,
      session.userId,
      'mfa_verified',
      undefined,
      session.ipAddress,
      session.userAgent,
      true
    );

    this.emit('session-mfa-verified', { sessionId, userId: session.userId });

    return true;
  }

  /**
   * Check if new device requires MFA
   */
  isNewDevice(userId: string, fingerprint: DeviceFingerprint): boolean {
    const sessions = this.getUserSessions(userId);

    for (const session of sessions) {
      if (session.deviceFingerprint.hash === fingerprint.hash) {
        return false;
      }
    }

    return true;
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceConcurrentLimit(userId: string): Promise<void> {
    const activeSessions = this.getActiveUserSessions(userId);

    if (activeSessions.length >= this.config.maxConcurrentSessions) {
      // Revoke oldest sessions
      const toRevoke = activeSessions
        .sort((a, b) => a.lastActivityAt - b.lastActivityAt)
        .slice(0, activeSessions.length - this.config.maxConcurrentSessions + 1);

      for (const session of toRevoke) {
        this.revokeSession(session.id, 'concurrent_limit');
      }

      this.createAlert(
        activeSessions[0].id,
        userId,
        'concurrent_sessions',
        'low',
        `Concurrent session limit exceeded. Revoked ${toRevoke.length} old sessions.`,
        { limit: this.config.maxConcurrentSessions, revoked: toRevoke.length }
      );
    }
  }

  /**
   * Check for suspicious activity
   */
  private async checkForSuspiciousActivity(
    userId: string,
    fingerprint: DeviceFingerprint,
    ipAddress: string,
    location?: SessionLocation
  ): Promise<void> {
    const recentSessions = this.getActiveUserSessions(userId);
    if (recentSessions.length === 0) return;

    const lastSession = recentSessions[0];

    // Check for new device
    if (this.isNewDevice(userId, fingerprint)) {
      this.createAlert(
        lastSession.id,
        userId,
        'new_device',
        'medium',
        `Login from new device: ${fingerprint.userAgent}`,
        { fingerprint: fingerprint.hash, userAgent: fingerprint.userAgent }
      );
    }

    // Check for impossible travel
    if (location && lastSession.location) {
      const timeDiffHours = (Date.now() - lastSession.lastActivityAt) / (1000 * 60 * 60);
      const distance = this.calculateDistance(
        lastSession.location.latitude || 0,
        lastSession.location.longitude || 0,
        location.latitude || 0,
        location.longitude || 0
      );
      const speedKmh = distance / timeDiffHours;

      if (speedKmh > this.config.impossibleTravelSpeedKmh) {
        this.createAlert(
          lastSession.id,
          userId,
          'impossible_travel',
          'high',
          `Impossible travel detected: ${Math.round(distance)}km in ${Math.round(timeDiffHours * 60)} minutes`,
          {
            distance,
            timeDiffMinutes: timeDiffHours * 60,
            speedKmh,
            fromLocation: lastSession.location,
            toLocation: location,
          }
        );
      }
    }

    // Check for VPN/Tor/Proxy
    if (location?.isVpn || location?.isTor || location?.isProxy) {
      this.createAlert(
        lastSession.id,
        userId,
        'unusual_location',
        'medium',
        `Login from anonymizing service detected`,
        { isVpn: location.isVpn, isTor: location.isTor, isProxy: location.isProxy }
      );
    }

    // Check for unusual time (outside normal hours)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5) {
      this.createAlert(
        lastSession.id,
        userId,
        'unusual_time',
        'low',
        `Login at unusual time: ${hour}:00`,
        { hour, localTime: new Date().toISOString() }
      );
    }
  }

  /**
   * Create suspicious activity alert
   */
  private createAlert(
    sessionId: string,
    userId: string,
    type: SuspiciousActivityType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    evidence: Record<string, unknown>
  ): SuspiciousActivityAlert {
    const alert: SuspiciousActivityAlert = {
      id: `alert_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
      sessionId,
      userId,
      type,
      severity,
      description,
      evidence,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.set(alert.id, alert);
    this.emit('suspicious-activity', alert);

    return alert;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();
    alert.resolvedBy = resolvedBy;

    this.emit('alert-resolved', { alertId, resolvedBy });

    return true;
  }

  /**
   * Get alerts
   */
  getAlerts(options?: {
    userId?: string;
    resolved?: boolean;
    severity?: string;
    limit?: number;
  }): SuspiciousActivityAlert[] {
    let alerts = Array.from(this.alerts.values());

    if (options?.userId) {
      alerts = alerts.filter((a) => a.userId === options.userId);
    }

    if (options?.resolved !== undefined) {
      alerts = alerts.filter((a) => a.resolved === options.resolved);
    }

    if (options?.severity) {
      alerts = alerts.filter((a) => a.severity === options.severity);
    }

    alerts.sort((a, b) => b.timestamp - a.timestamp);

    return alerts.slice(0, options?.limit || 100);
  }

  /**
   * Get session activities
   */
  getActivities(options?: {
    sessionId?: string;
    userId?: string;
    action?: string;
    limit?: number;
  }): SessionActivity[] {
    let activities = [...this.activities];

    if (options?.sessionId) {
      activities = activities.filter((a) => a.sessionId === options.sessionId);
    }

    if (options?.userId) {
      activities = activities.filter((a) => a.userId === options.userId);
    }

    if (options?.action) {
      activities = activities.filter((a) => a.action === options.action);
    }

    activities.sort((a, b) => b.timestamp - a.timestamp);

    return activities.slice(0, options?.limit || 100);
  }

  /**
   * Get statistics
   */
  getStats(): SessionStats {
    const byStatus: Record<SessionStatus, number> = {
      active: 0,
      expired: 0,
      revoked: 0,
      suspicious: 0,
    };

    const byDeviceType: Record<DeviceType, number> = {
      mobile: 0,
      tablet: 0,
      desktop: 0,
      unknown: 0,
    };

    let totalDuration = 0;
    let activeSessions = 0;

    for (const session of this.sessions.values()) {
      byStatus[session.status]++;
      byDeviceType[session.deviceType]++;

      if (session.status === 'active') {
        activeSessions++;
      }

      totalDuration += session.lastActivityAt - session.createdAt;
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      byStatus,
      byDeviceType,
      suspiciousAlerts: Array.from(this.alerts.values()).filter((a) => !a.resolved).length,
      avgSessionDurationMinutes: this.sessions.size > 0
        ? Math.round(totalDuration / this.sessions.size / 60000)
        : 0,
    };
  }

  /**
   * Log activity
   */
  private logActivity(
    sessionId: string,
    userId: string,
    action: string,
    resource?: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    metadata: Record<string, unknown> = {}
  ): void {
    const activity: SessionActivity = {
      id: `act_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
      sessionId,
      userId,
      action,
      resource,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: Date.now(),
      success,
      metadata,
    };

    this.activities.push(activity);

    // Keep last 10000 activities
    if (this.activities.length > 10000) {
      this.activities = this.activities.slice(-10000);
    }
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): DeviceType {
    const ua = userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
      return 'mobile';
    }

    if (/ipad|tablet|playbook|silk/i.test(ua)) {
      return 'tablet';
    }

    if (/windows|macintosh|linux/i.test(ua)) {
      return 'desktop';
    }

    return 'unknown';
  }

  /**
   * Parse device name from user agent
   */
  private parseDeviceName(userAgent: string): string {
    // Extract browser and OS info
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)[\/\s](\d+)/i);
    const osMatch = userAgent.match(/(Windows|Mac OS X|Linux|Android|iOS|iPhone|iPad)[\s\/]?([0-9._]*)/i);

    const browser = browserMatch ? browserMatch[1] : 'Unknown Browser';
    const os = osMatch ? osMatch[1].replace('_', ' ') : 'Unknown OS';

    return `${browser} on ${os}`;
  }

  /**
   * Get location from IP
   */
  private async getLocationFromIP(ipAddress: string): Promise<SessionLocation | undefined> {
    // Check cache
    const cached = this.ipLocationCache.get(ipAddress);
    if (cached) return cached;

    // In production: use IP geolocation service
    // For now, return mock data
    const location: SessionLocation = {
      country: 'US',
      region: 'California',
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
      isp: 'Example ISP',
      isVpn: false,
      isTor: false,
      isProxy: false,
    };

    this.ipLocationCache.set(ipAddress, location);

    // Cache cleanup
    if (this.ipLocationCache.size > 10000) {
      const keys = Array.from(this.ipLocationCache.keys()).slice(0, 5000);
      for (const key of keys) {
        this.ipLocationCache.delete(key);
      }
    }

    return location;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now().toString(36)}_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate secure token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions) {
      // Mark expired sessions
      if (session.status === 'active' && now > session.expiresAt) {
        session.status = 'expired';
      }

      // Remove sessions older than 90 days
      if (now - session.createdAt > 90 * 24 * 60 * 60 * 1000) {
        this.sessions.delete(sessionId);

        const userSessionSet = this.userSessions.get(session.userId);
        if (userSessionSet) {
          userSessionSet.delete(sessionId);
        }
      }
    }

    // Clean up old activities (older than 30 days)
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    this.activities = this.activities.filter((a) => a.timestamp > thirtyDaysAgo);

    // Clean up old resolved alerts (older than 7 days)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    for (const [alertId, alert] of this.alerts) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < sevenDaysAgo) {
        this.alerts.delete(alertId);
      }
    }
  }
}

// Singleton instance
let sessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager();
  }
  return sessionManager;
}

export default SessionManager;
