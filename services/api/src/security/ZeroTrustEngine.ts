import { Request } from 'express';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { geoip } from 'geoip-lite';
import Fingerprint2 from 'fingerprintjs2';
import * as speakeasy from 'speakeasy';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from '../utils/logger';
import * as tf from '@tensorflow/tfjs-node';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const logger = new Logger('ZeroTrustEngine');

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface DeviceFingerprint {
  deviceId: string;
  userAgent: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  language: string;
  canvasFingerprint: string;
  webglFingerprint: string;
  audioFingerprint: string;
  fonts: string[];
  plugins: string[];
  createdAt: Date;
  lastSeen: Date;
}

export interface DeviceHealthCheck {
  deviceId: string;
  osVersion: string;
  browserVersion: string;
  antivirusEnabled: boolean;
  diskEncryptionEnabled: boolean;
  isJailbroken: boolean;
  isMDMEnrolled: boolean;
  lastHealthCheck: Date;
  healthScore: number; // 0-100
}

export interface AccessContext {
  userId: string;
  deviceId: string;
  ipAddress: string;
  location: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
    timezone: string;
  } | null;
  timestamp: Date;
  userAgent: string;
  requestPath: string;
  requestMethod: string;
  sessionId: string;
}

export interface TrustScore {
  overall: number; // 0-100
  components: {
    userReputation: number; // 0-100
    deviceTrust: number; // 0-100
    locationRisk: number; // 0-100 (100 = low risk)
    behavioralScore: number; // 0-100
    threatIntelligence: number; // 0-100 (100 = no threats)
  };
  riskFactors: string[];
  recommendation: 'ALLOW' | 'MFA_CHALLENGE' | 'BLOCK';
}

export interface AuthenticationRequest {
  userId: string;
  password?: string;
  mfaToken?: string;
  deviceFingerprint: DeviceFingerprint;
  context: AccessContext;
}

export interface AuthenticationResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  trustScore: TrustScore;
  requiresMFA: boolean;
  mfaMethods?: ('TOTP' | 'SMS' | 'EMAIL' | 'BIOMETRIC' | 'HARDWARE_TOKEN')[];
  sessionId?: string;
  expiresAt?: Date;
  errors?: string[];
}

export interface PrivilegeElevationRequest {
  userId: string;
  requestedPrivileges: string[];
  duration: number; // seconds
  justification: string;
  approvers?: string[];
}

export interface PrivilegeElevation {
  id: string;
  userId: string;
  privileges: string[];
  grantedAt: Date;
  expiresAt: Date;
  approvedBy: string[];
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  breakGlassAccess: boolean;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  deviceId: string;
  initialIpAddress: string;
  currentIpAddress: string;
  initialLocation: any;
  currentLocation: any;
  createdAt: Date;
  lastActivity: Date;
  trustScore: number;
  flags: string[];
}

export interface NetworkSegment {
  id: string;
  name: string;
  allowedServices: string[];
  requiredCertificates: string[];
  encryptionRequired: boolean;
  mTLSEnabled: boolean;
  networkPolicies: string[];
}

export interface ServiceAuthentication {
  serviceId: string;
  certificateThumbprint: string;
  issuedAt: Date;
  expiresAt: Date;
  allowedEndpoints: string[];
  trustScore: number;
}

// ============================================================================
// ZERO-TRUST ENGINE
// ============================================================================

export class ZeroTrustEngine {
  private anomalyDetectionModel: tf.LayersModel | null = null;
  private behaviorBaselines: Map<string, UserBehaviorBaseline> = new Map();

  constructor() {
    this.initializeAnomalyDetection();
    this.loadBehaviorBaselines();
  }

  // ==========================================================================
  // DEVICE FINGERPRINTING & TRUST
  // ==========================================================================

  async generateDeviceFingerprint(req: Request): Promise<DeviceFingerprint> {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';

    // Extract browser and platform info
    const platform = this.extractPlatform(userAgent);
    const screenResolution = req.headers['x-screen-resolution'] as string || 'unknown';
    const timezone = req.headers['x-timezone'] as string || 'UTC';

    // Generate canvas fingerprint
    const canvasFingerprint = this.generateCanvasFingerprint(req);
    const webglFingerprint = this.generateWebGLFingerprint(req);
    const audioFingerprint = this.generateAudioFingerprint(req);

    // Combine all factors to create unique device ID
    const fingerprintData = [
      userAgent,
      platform,
      screenResolution,
      timezone,
      acceptLanguage,
      canvasFingerprint,
      webglFingerprint,
      audioFingerprint
    ].join('|');

    const deviceId = crypto
      .createHash('sha256')
      .update(fingerprintData)
      .digest('hex');

    const fingerprint: DeviceFingerprint = {
      deviceId,
      userAgent,
      platform,
      screenResolution,
      timezone,
      language: acceptLanguage.split(',')[0] || 'en',
      canvasFingerprint,
      webglFingerprint,
      audioFingerprint,
      fonts: this.detectFonts(req),
      plugins: this.detectPlugins(req),
      createdAt: new Date(),
      lastSeen: new Date()
    };

    // Store fingerprint in Redis for quick lookup
    await redis.setex(
      `device:fingerprint:${deviceId}`,
      86400 * 30, // 30 days
      JSON.stringify(fingerprint)
    );

    return fingerprint;
  }

  private generateCanvasFingerprint(req: Request): string {
    // Canvas fingerprint from client-provided data
    const canvasData = req.headers['x-canvas-fingerprint'] as string;
    if (canvasData) {
      return crypto.createHash('sha256').update(canvasData).digest('hex');
    }

    // Fallback: generate from user agent
    return crypto.createHash('sha256')
      .update(req.headers['user-agent'] || 'unknown')
      .digest('hex')
      .substring(0, 32);
  }

  private generateWebGLFingerprint(req: Request): string {
    const webglData = req.headers['x-webgl-fingerprint'] as string;
    if (webglData) {
      return crypto.createHash('sha256').update(webglData).digest('hex');
    }
    return crypto.randomBytes(16).toString('hex');
  }

  private generateAudioFingerprint(req: Request): string {
    const audioData = req.headers['x-audio-fingerprint'] as string;
    if (audioData) {
      return crypto.createHash('sha256').update(audioData).digest('hex');
    }
    return crypto.randomBytes(16).toString('hex');
  }

  private extractPlatform(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS';
    return 'Unknown';
  }

  private detectFonts(req: Request): string[] {
    const fontsHeader = req.headers['x-fonts'] as string;
    if (fontsHeader) {
      return fontsHeader.split(',').map(f => f.trim());
    }
    return ['Arial', 'Helvetica', 'Times New Roman', 'Courier']; // Default fonts
  }

  private detectPlugins(req: Request): string[] {
    const pluginsHeader = req.headers['x-plugins'] as string;
    if (pluginsHeader) {
      return pluginsHeader.split(',').map(p => p.trim());
    }
    return [];
  }

  async performDeviceHealthCheck(deviceId: string): Promise<DeviceHealthCheck> {
    // Retrieve device info from database
    const device = await prisma.trustedDevice.findUnique({
      where: { deviceId }
    });

    if (!device) {
      throw new Error('Device not found');
    }

    const healthCheck: DeviceHealthCheck = {
      deviceId,
      osVersion: device.osVersion || 'unknown',
      browserVersion: device.browserVersion || 'unknown',
      antivirusEnabled: device.antivirusEnabled || false,
      diskEncryptionEnabled: device.diskEncryption || false,
      isJailbroken: device.isJailbroken || false,
      isMDMEnrolled: device.mdmEnrolled || false,
      lastHealthCheck: new Date(),
      healthScore: 0
    };

    // Calculate health score
    let score = 100;

    if (!healthCheck.antivirusEnabled) score -= 20;
    if (!healthCheck.diskEncryptionEnabled) score -= 30;
    if (healthCheck.isJailbroken) score -= 50;
    if (!healthCheck.isMDMEnrolled) score -= 10;

    // Check OS version (penalize outdated OS)
    if (this.isOSVersionOutdated(healthCheck.osVersion)) {
      score -= 15;
    }

    healthCheck.healthScore = Math.max(0, score);

    // Update in database
    await prisma.trustedDevice.update({
      where: { deviceId },
      data: {
        healthScore: healthCheck.healthScore,
        lastHealthCheck: healthCheck.lastHealthCheck
      }
    });

    return healthCheck;
  }

  private isOSVersionOutdated(osVersion: string): boolean {
    // Simple version check - in production, use a more sophisticated check
    const version = parseFloat(osVersion);

    // Example thresholds
    if (osVersion.includes('Windows') && version < 10) return true;
    if (osVersion.includes('macOS') && version < 12) return true;
    if (osVersion.includes('Android') && version < 11) return true;
    if (osVersion.includes('iOS') && version < 15) return true;

    return false;
  }

  async registerTrustedDevice(
    userId: string,
    fingerprint: DeviceFingerprint,
    requiresApproval: boolean = false
  ): Promise<void> {
    const status = requiresApproval ? 'PENDING_APPROVAL' : 'TRUSTED';

    await prisma.trustedDevice.upsert({
      where: { deviceId: fingerprint.deviceId },
      create: {
        deviceId: fingerprint.deviceId,
        userId,
        deviceName: `${fingerprint.platform} - ${fingerprint.userAgent.substring(0, 50)}`,
        fingerprint: JSON.stringify(fingerprint),
        status,
        firstSeen: new Date(),
        lastSeen: new Date(),
        trustScore: 50, // Initial trust score
        osVersion: fingerprint.platform,
        browserVersion: this.extractBrowserVersion(fingerprint.userAgent)
      },
      update: {
        lastSeen: new Date(),
        fingerprint: JSON.stringify(fingerprint)
      }
    });

    logger.info(`Device registered for user ${userId}: ${fingerprint.deviceId} (${status})`);
  }

  private extractBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([0-9.]+)/);
    return match ? `${match[1]} ${match[2]}` : 'Unknown';
  }

  async isDeviceTrusted(deviceId: string, userId: string): Promise<boolean> {
    const device = await prisma.trustedDevice.findFirst({
      where: {
        deviceId,
        userId,
        status: 'TRUSTED'
      }
    });

    return device !== null && device.trustScore >= 60;
  }

  async getDeviceTrustScore(deviceId: string): Promise<number> {
    const device = await prisma.trustedDevice.findUnique({
      where: { deviceId }
    });

    if (!device) return 0;

    // Factor in health score
    const healthCheck = await this.performDeviceHealthCheck(deviceId);

    // Weighted average
    const baseScore = device.trustScore || 50;
    const healthScore = healthCheck.healthScore;

    return Math.round(baseScore * 0.6 + healthScore * 0.4);
  }

  // ==========================================================================
  // ACCESS CONTEXT & GEOLOCATION
  // ==========================================================================

  async buildAccessContext(req: Request, userId: string, sessionId: string): Promise<AccessContext> {
    const ipAddress = this.extractIPAddress(req);
    const location = this.getGeolocation(ipAddress);

    return {
      userId,
      deviceId: req.headers['x-device-id'] as string || 'unknown',
      ipAddress,
      location,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'] || 'unknown',
      requestPath: req.path,
      requestMethod: req.method,
      sessionId
    };
  }

  private extractIPAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  private getGeolocation(ipAddress: string): AccessContext['location'] {
    const geo = geoip.lookup(ipAddress);

    if (!geo) return null;

    return {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      latitude: geo.ll[0],
      longitude: geo.ll[1],
      timezone: geo.timezone
    };
  }

  async detectLocationAnomaly(userId: string, currentLocation: AccessContext['location']): Promise<boolean> {
    if (!currentLocation) return false;

    // Get recent locations from cache
    const recentLocationsKey = `user:${userId}:locations`;
    const recentLocations = await redis.lrange(recentLocationsKey, 0, 9);

    if (recentLocations.length === 0) {
      // First login, no anomaly
      await redis.lpush(recentLocationsKey, JSON.stringify(currentLocation));
      await redis.ltrim(recentLocationsKey, 0, 9); // Keep last 10
      await redis.expire(recentLocationsKey, 86400 * 30); // 30 days
      return false;
    }

    const lastLocation = JSON.parse(recentLocations[0]);

    // Calculate distance (simple approximation)
    const distance = this.calculateDistance(
      lastLocation.latitude,
      lastLocation.longitude,
      currentLocation.latitude,
      currentLocation.longitude
    );

    // Get time difference
    const lastAccessKey = `user:${userId}:lastaccess`;
    const lastAccessTime = await redis.get(lastAccessKey);
    const timeDiffMinutes = lastAccessTime
      ? (Date.now() - parseInt(lastAccessTime)) / 1000 / 60
      : Infinity;

    // Geo-velocity analysis: impossible travel detection
    // If distance > 500km and time < 60 minutes, it's suspicious
    const geoVelocityKmPerMin = distance / Math.max(timeDiffMinutes, 1);

    // Update cache
    await redis.lpush(recentLocationsKey, JSON.stringify(currentLocation));
    await redis.ltrim(recentLocationsKey, 0, 9);
    await redis.setex(lastAccessKey, 86400, Date.now().toString());

    // Flag if geo-velocity > 500 km/h (impossible for normal travel)
    return geoVelocityKmPerMin > 500 / 60;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  // ==========================================================================
  // TRUST SCORE CALCULATION
  // ==========================================================================

  async calculateTrustScore(context: AccessContext): Promise<TrustScore> {
    const scores = {
      userReputation: await this.calculateUserReputation(context.userId),
      deviceTrust: await this.getDeviceTrustScore(context.deviceId),
      locationRisk: await this.calculateLocationRisk(context),
      behavioralScore: await this.calculateBehavioralScore(context),
      threatIntelligence: await this.getThreatIntelligenceScore(context.ipAddress)
    };

    // Weighted average
    const weights = {
      userReputation: 0.25,
      deviceTrust: 0.25,
      locationRisk: 0.20,
      behavioralScore: 0.20,
      threatIntelligence: 0.10
    };

    const overall = Math.round(
      scores.userReputation * weights.userReputation +
      scores.deviceTrust * weights.deviceTrust +
      scores.locationRisk * weights.locationRisk +
      scores.behavioralScore * weights.behavioralScore +
      scores.threatIntelligence * weights.threatIntelligence
    );

    const riskFactors: string[] = [];
    if (scores.userReputation < 50) riskFactors.push('Low user reputation');
    if (scores.deviceTrust < 50) riskFactors.push('Untrusted device');
    if (scores.locationRisk < 50) riskFactors.push('High-risk location');
    if (scores.behavioralScore < 50) riskFactors.push('Anomalous behavior');
    if (scores.threatIntelligence < 50) riskFactors.push('IP flagged by threat intelligence');

    let recommendation: TrustScore['recommendation'];
    if (overall >= 80) {
      recommendation = 'ALLOW';
    } else if (overall >= 50) {
      recommendation = 'MFA_CHALLENGE';
    } else {
      recommendation = 'BLOCK';
    }

    return {
      overall,
      components: scores,
      riskFactors,
      recommendation
    };
  }

  private async calculateUserReputation(userId: string): Promise<number> {
    // Get user account details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            securityIncidents: true,
            failedLoginAttempts: true
          }
        }
      }
    });

    if (!user) return 0;

    let score = 100;

    // Account age (newer accounts = lower score)
    const accountAgeMonths = this.getMonthsSince(user.createdAt);
    if (accountAgeMonths < 1) score -= 20;
    else if (accountAgeMonths < 6) score -= 10;

    // Email verification
    if (!user.emailVerified) score -= 30;

    // Phone verification
    if (!user.phoneVerified) score -= 10;

    // Security incidents
    const incidentCount = user._count.securityIncidents;
    score -= Math.min(incidentCount * 10, 40);

    // Failed login attempts (recent)
    const failedAttempts = user._count.failedLoginAttempts;
    score -= Math.min(failedAttempts * 5, 30);

    // MFA enabled
    if (!user.mfaEnabled) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private getMonthsSince(date: Date): number {
    const now = new Date();
    const months = (now.getFullYear() - date.getFullYear()) * 12 +
                   (now.getMonth() - date.getMonth());
    return months;
  }

  private async calculateLocationRisk(context: AccessContext): Promise<number> {
    if (!context.location) return 50; // Unknown location = medium risk

    let score = 100;

    // High-risk countries (example list)
    const highRiskCountries = ['KP', 'IR', 'SY', 'CU'];
    if (highRiskCountries.includes(context.location.country)) {
      score -= 50;
    }

    // Check for VPN/Tor
    const isVPN = await this.isVPNorTor(context.ipAddress);
    if (isVPN) score -= 30;

    // Location anomaly
    const locationAnomaly = await this.detectLocationAnomaly(context.userId, context.location);
    if (locationAnomaly) score -= 40;

    return Math.max(0, score);
  }

  private async isVPNorTor(ipAddress: string): Promise<boolean> {
    // Check against known VPN/Tor IP ranges (simplified)
    const cached = await redis.get(`vpn:check:${ipAddress}`);
    if (cached) return cached === 'true';

    // In production, use a VPN detection API like IPQualityScore or IPHub
    // For now, simple heuristic
    const isVPN = ipAddress.startsWith('10.') ||
                  ipAddress.startsWith('192.168.') ||
                  ipAddress.startsWith('172.');

    await redis.setex(`vpn:check:${ipAddress}`, 3600, isVPN.toString());
    return isVPN;
  }

  private async calculateBehavioralScore(context: AccessContext): Promise<number> {
    const baseline = await this.getUserBehaviorBaseline(context.userId);

    if (!baseline) {
      // No baseline yet, collect data
      await this.updateBehaviorBaseline(context);
      return 70; // Neutral score for new users
    }

    let score = 100;

    // Time-based anomaly
    const currentHour = new Date(context.timestamp).getHours();
    if (!baseline.typicalLoginHours.includes(currentHour)) {
      score -= 20;
    }

    // Access pattern anomaly
    const recentPaths = await this.getRecentAccessPaths(context.userId);
    if (!recentPaths.includes(context.requestPath)) {
      score -= 10; // New endpoint access
    }

    // Use ML model for anomaly detection
    const mlScore = await this.detectBehavioralAnomalyML(context, baseline);
    score = score * 0.7 + mlScore * 0.3;

    // Update baseline with new data
    await this.updateBehaviorBaseline(context);

    return Math.max(0, Math.round(score));
  }

  private async getThreatIntelligenceScore(ipAddress: string): Promise<number> {
    // Check IP reputation from cache
    const reputationKey = `ip:reputation:${ipAddress}`;
    const cached = await redis.get(reputationKey);

    if (cached) {
      return parseInt(cached);
    }

    // Default score
    let score = 100;

    // Check against blocklist
    const isBlocked = await redis.sismember('ip:blocklist', ipAddress);
    if (isBlocked) {
      score = 0;
    }

    // Cache for 1 hour
    await redis.setex(reputationKey, 3600, score.toString());

    return score;
  }

  // ==========================================================================
  // BEHAVIORAL ANALYSIS & ML
  // ==========================================================================

  private async initializeAnomalyDetection(): Promise<void> {
    try {
      // Simple neural network for anomaly detection
      this.anomalyDetectionModel = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [10], units: 20, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 10, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      this.anomalyDetectionModel.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      logger.info('Anomaly detection model initialized');
    } catch (error) {
      logger.error('Failed to initialize anomaly detection model', error);
    }
  }

  private async loadBehaviorBaselines(): Promise<void> {
    // Load from database
    const baselines = await prisma.userBehaviorBaseline.findMany();

    for (const baseline of baselines) {
      this.behaviorBaselines.set(baseline.userId, {
        userId: baseline.userId,
        typicalLoginHours: baseline.typicalLoginHours as number[],
        typicalLocations: baseline.typicalLocations as any[],
        typicalDevices: baseline.typicalDevices as string[],
        accessPatterns: baseline.accessPatterns as string[],
        avgSessionDuration: baseline.avgSessionDuration,
        lastUpdated: baseline.lastUpdated
      });
    }

    logger.info(`Loaded ${baselines.length} behavior baselines`);
  }

  private async getUserBehaviorBaseline(userId: string): Promise<UserBehaviorBaseline | null> {
    // Check cache first
    if (this.behaviorBaselines.has(userId)) {
      return this.behaviorBaselines.get(userId)!;
    }

    // Load from database
    const baseline = await prisma.userBehaviorBaseline.findUnique({
      where: { userId }
    });

    if (!baseline) return null;

    const userBaseline: UserBehaviorBaseline = {
      userId: baseline.userId,
      typicalLoginHours: baseline.typicalLoginHours as number[],
      typicalLocations: baseline.typicalLocations as any[],
      typicalDevices: baseline.typicalDevices as string[],
      accessPatterns: baseline.accessPatterns as string[],
      avgSessionDuration: baseline.avgSessionDuration,
      lastUpdated: baseline.lastUpdated
    };

    this.behaviorBaselines.set(userId, userBaseline);
    return userBaseline;
  }

  private async updateBehaviorBaseline(context: AccessContext): Promise<void> {
    const hour = new Date(context.timestamp).getHours();

    let baseline = await this.getUserBehaviorBaseline(context.userId);

    if (!baseline) {
      // Create new baseline
      baseline = {
        userId: context.userId,
        typicalLoginHours: [hour],
        typicalLocations: context.location ? [context.location] : [],
        typicalDevices: [context.deviceId],
        accessPatterns: [context.requestPath],
        avgSessionDuration: 0,
        lastUpdated: new Date()
      };
    } else {
      // Update existing baseline
      if (!baseline.typicalLoginHours.includes(hour)) {
        baseline.typicalLoginHours.push(hour);
      }

      if (context.location && !baseline.typicalLocations.some(loc =>
        loc.country === context.location!.country && loc.city === context.location!.city
      )) {
        baseline.typicalLocations.push(context.location);
        // Keep only last 5 locations
        if (baseline.typicalLocations.length > 5) {
          baseline.typicalLocations.shift();
        }
      }

      if (!baseline.typicalDevices.includes(context.deviceId)) {
        baseline.typicalDevices.push(context.deviceId);
        // Keep only last 5 devices
        if (baseline.typicalDevices.length > 5) {
          baseline.typicalDevices.shift();
        }
      }

      if (!baseline.accessPatterns.includes(context.requestPath)) {
        baseline.accessPatterns.push(context.requestPath);
        // Keep only last 50 patterns
        if (baseline.accessPatterns.length > 50) {
          baseline.accessPatterns.shift();
        }
      }
    }

    baseline.lastUpdated = new Date();

    // Save to database
    await prisma.userBehaviorBaseline.upsert({
      where: { userId: context.userId },
      create: {
        userId: context.userId,
        typicalLoginHours: baseline.typicalLoginHours,
        typicalLocations: baseline.typicalLocations,
        typicalDevices: baseline.typicalDevices,
        accessPatterns: baseline.accessPatterns,
        avgSessionDuration: baseline.avgSessionDuration,
        lastUpdated: baseline.lastUpdated
      },
      update: {
        typicalLoginHours: baseline.typicalLoginHours,
        typicalLocations: baseline.typicalLocations,
        typicalDevices: baseline.typicalDevices,
        accessPatterns: baseline.accessPatterns,
        lastUpdated: baseline.lastUpdated
      }
    });

    this.behaviorBaselines.set(context.userId, baseline);
  }

  private async getRecentAccessPaths(userId: string): Promise<string[]> {
    const key = `user:${userId}:accesspaths`;
    const paths = await redis.lrange(key, 0, 49);
    return paths;
  }

  private async detectBehavioralAnomalyML(
    context: AccessContext,
    baseline: UserBehaviorBaseline
  ): Promise<number> {
    if (!this.anomalyDetectionModel) return 70;

    try {
      // Feature engineering
      const features = this.extractFeatures(context, baseline);

      // Predict anomaly score
      const input = tf.tensor2d([features]);
      const prediction = this.anomalyDetectionModel.predict(input) as tf.Tensor;
      const score = await prediction.data();

      input.dispose();
      prediction.dispose();

      // Convert to 0-100 scale (higher = more normal)
      return Math.round((1 - score[0]) * 100);
    } catch (error) {
      logger.error('ML anomaly detection failed', error);
      return 70; // Neutral score on error
    }
  }

  private extractFeatures(context: AccessContext, baseline: UserBehaviorBaseline): number[] {
    const hour = new Date(context.timestamp).getHours();

    return [
      baseline.typicalLoginHours.includes(hour) ? 1 : 0,
      baseline.typicalDevices.includes(context.deviceId) ? 1 : 0,
      baseline.typicalLocations.some(loc =>
        loc.country === context.location?.country
      ) ? 1 : 0,
      baseline.accessPatterns.includes(context.requestPath) ? 1 : 0,
      hour / 24, // Normalized hour
      context.location?.latitude || 0 / 90, // Normalized latitude
      context.location?.longitude || 0 / 180, // Normalized longitude
      baseline.typicalLoginHours.length / 24, // Login hour diversity
      baseline.typicalDevices.length / 5, // Device diversity
      baseline.typicalLocations.length / 5 // Location diversity
    ];
  }

  // ==========================================================================
  // AUTHENTICATION & MFA
  // ==========================================================================

  async authenticate(request: AuthenticationRequest): Promise<AuthenticationResult> {
    try {
      // Step 1: Calculate trust score
      const trustScore = await this.calculateTrustScore(request.context);

      // Step 2: Check if blocked
      if (trustScore.recommendation === 'BLOCK') {
        logger.warn(`Authentication blocked for user ${request.userId}: ${trustScore.riskFactors.join(', ')}`);

        // Log security event
        await this.logSecurityEvent(request.userId, 'AUTH_BLOCKED', {
          trustScore: trustScore.overall,
          riskFactors: trustScore.riskFactors,
          ipAddress: request.context.ipAddress
        });

        return {
          success: false,
          trustScore,
          requiresMFA: false,
          errors: ['Access denied due to security policy']
        };
      }

      // Step 3: Verify password if provided
      if (request.password) {
        const user = await prisma.user.findUnique({
          where: { id: request.userId }
        });

        if (!user) {
          return {
            success: false,
            trustScore,
            requiresMFA: false,
            errors: ['Invalid credentials']
          };
        }

        const passwordValid = await bcrypt.compare(request.password, user.passwordHash);

        if (!passwordValid) {
          // Record failed attempt
          await this.recordFailedLoginAttempt(request.userId, request.context);

          return {
            success: false,
            trustScore,
            requiresMFA: false,
            errors: ['Invalid credentials']
          };
        }
      }

      // Step 4: Determine if MFA required
      const requiresMFA = trustScore.recommendation === 'MFA_CHALLENGE' ||
                          await this.shouldRequireMFA(request.userId, trustScore);

      if (requiresMFA && !request.mfaToken) {
        const mfaMethods = await this.getAvailableMFAMethods(request.userId);

        return {
          success: false,
          trustScore,
          requiresMFA: true,
          mfaMethods
        };
      }

      // Step 5: Verify MFA if provided
      if (request.mfaToken) {
        const mfaValid = await this.verifyMFA(request.userId, request.mfaToken);

        if (!mfaValid) {
          return {
            success: false,
            trustScore,
            requiresMFA: true,
            errors: ['Invalid MFA token']
          };
        }
      }

      // Step 6: Generate session tokens
      const sessionId = crypto.randomBytes(32).toString('hex');
      const token = this.generateJWT(request.userId, sessionId, '1h');
      const refreshToken = this.generateJWT(request.userId, sessionId, '7d', 'refresh');

      // Step 7: Create session
      await this.createSession(sessionId, request.userId, request.context, trustScore.overall);

      // Step 8: Register device if not trusted
      if (!await this.isDeviceTrusted(request.deviceFingerprint.deviceId, request.userId)) {
        await this.registerTrustedDevice(request.userId, request.deviceFingerprint);
      }

      // Step 9: Log successful authentication
      await this.logSecurityEvent(request.userId, 'AUTH_SUCCESS', {
        trustScore: trustScore.overall,
        deviceId: request.deviceFingerprint.deviceId,
        ipAddress: request.context.ipAddress,
        mfaUsed: !!request.mfaToken
      });

      return {
        success: true,
        token,
        refreshToken,
        trustScore,
        requiresMFA: false,
        sessionId,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      };

    } catch (error) {
      logger.error('Authentication error', error);

      return {
        success: false,
        trustScore: {
          overall: 0,
          components: {
            userReputation: 0,
            deviceTrust: 0,
            locationRisk: 0,
            behavioralScore: 0,
            threatIntelligence: 0
          },
          riskFactors: ['Internal error'],
          recommendation: 'BLOCK'
        },
        requiresMFA: false,
        errors: ['Authentication failed']
      };
    }
  }

  private async shouldRequireMFA(userId: string, trustScore: TrustScore): Promise<boolean> {
    // Always require MFA for low trust scores
    if (trustScore.overall < 60) return true;

    // Check user MFA settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaEnforced: true }
    });

    if (user?.mfaEnforced) return true;

    // Adaptive MFA based on risk factors
    if (trustScore.riskFactors.length >= 2) return true;

    return false;
  }

  private async getAvailableMFAMethods(userId: string): Promise<('TOTP' | 'SMS' | 'EMAIL' | 'BIOMETRIC' | 'HARDWARE_TOKEN')[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totpEnabled: true,
        phoneVerified: true,
        emailVerified: true
      }
    });

    const methods: ('TOTP' | 'SMS' | 'EMAIL' | 'BIOMETRIC' | 'HARDWARE_TOKEN')[] = [];

    if (user?.totpEnabled) methods.push('TOTP');
    if (user?.phoneVerified) methods.push('SMS');
    if (user?.emailVerified) methods.push('EMAIL');

    return methods;
  }

  private async verifyMFA(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true }
    });

    if (!user?.totpSecret) return false;

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps before/after
    });

    return verified;
  }

  private generateJWT(userId: string, sessionId: string, expiresIn: string, type: 'access' | 'refresh' = 'access'): string {
    const payload = {
      userId,
      sessionId,
      type,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn });
  }

  private async createSession(
    sessionId: string,
    userId: string,
    context: AccessContext,
    trustScore: number
  ): Promise<void> {
    const sessionContext: SessionContext = {
      sessionId,
      userId,
      deviceId: context.deviceId,
      initialIpAddress: context.ipAddress,
      currentIpAddress: context.ipAddress,
      initialLocation: context.location,
      currentLocation: context.location,
      createdAt: new Date(),
      lastActivity: new Date(),
      trustScore,
      flags: []
    };

    await redis.setex(
      `session:${sessionId}`,
      86400 * 7, // 7 days
      JSON.stringify(sessionContext)
    );

    // Store in database for long-term tracking
    await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        deviceId: context.deviceId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        location: context.location as any,
        trustScore,
        expiresAt: new Date(Date.now() + 86400000 * 7)
      }
    });
  }

  private async recordFailedLoginAttempt(userId: string, context: AccessContext): Promise<void> {
    await prisma.failedLoginAttempt.create({
      data: {
        userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        attemptedAt: new Date()
      }
    });

    // Increment counter in Redis
    const key = `failed:login:${userId}`;
    const count = await redis.incr(key);
    await redis.expire(key, 300); // 5 minutes

    // Check for brute force
    if (count >= 5) {
      await this.logSecurityEvent(userId, 'BRUTE_FORCE_DETECTED', {
        ipAddress: context.ipAddress,
        attemptCount: count
      });

      // Temporarily block user
      await redis.setex(`user:blocked:${userId}`, 900, 'true'); // 15 minutes
    }
  }

  private async logSecurityEvent(userId: string, eventType: string, data: any): Promise<void> {
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType,
        severity: this.getEventSeverity(eventType),
        data: data as any,
        timestamp: new Date()
      }
    });

    logger.info(`Security event: ${eventType} for user ${userId}`, data);
  }

  private getEventSeverity(eventType: string): string {
    const severityMap: Record<string, string> = {
      'AUTH_SUCCESS': 'LOW',
      'AUTH_BLOCKED': 'HIGH',
      'BRUTE_FORCE_DETECTED': 'CRITICAL',
      'LOCATION_ANOMALY': 'MEDIUM',
      'DEVICE_ANOMALY': 'MEDIUM',
      'MFA_FAILED': 'MEDIUM'
    };

    return severityMap[eventType] || 'LOW';
  }

  // ==========================================================================
  // CONTINUOUS AUTHORIZATION
  // ==========================================================================

  async validateSessionContinuously(sessionId: string, currentContext: AccessContext): Promise<boolean> {
    const sessionData = await redis.get(`session:${sessionId}`);

    if (!sessionData) return false;

    const session: SessionContext = JSON.parse(sessionData);

    // Check IP change
    if (session.currentIpAddress !== currentContext.ipAddress) {
      session.flags.push('IP_CHANGE');
      logger.warn(`Session ${sessionId}: IP changed from ${session.currentIpAddress} to ${currentContext.ipAddress}`);
    }

    // Check location change
    if (currentContext.location && session.currentLocation) {
      const distance = this.calculateDistance(
        session.currentLocation.latitude,
        session.currentLocation.longitude,
        currentContext.location.latitude,
        currentContext.location.longitude
      );

      if (distance > 100) { // More than 100km
        session.flags.push('LOCATION_CHANGE');
        logger.warn(`Session ${sessionId}: Location changed by ${distance}km`);
      }
    }

    // Recalculate trust score
    const newTrustScore = await this.calculateTrustScore(currentContext);
    session.trustScore = newTrustScore.overall;

    // Update session
    session.currentIpAddress = currentContext.ipAddress;
    session.currentLocation = currentContext.location;
    session.lastActivity = new Date();

    await redis.setex(
      `session:${sessionId}`,
      86400 * 7,
      JSON.stringify(session)
    );

    // Terminate session if trust score too low
    if (newTrustScore.overall < 40) {
      await this.terminateSession(sessionId, 'Low trust score');
      return false;
    }

    return true;
  }

  async terminateSession(sessionId: string, reason: string): Promise<void> {
    const sessionData = await redis.get(`session:${sessionId}`);

    if (sessionData) {
      const session: SessionContext = JSON.parse(sessionData);

      await this.logSecurityEvent(session.userId, 'SESSION_TERMINATED', {
        sessionId,
        reason
      });
    }

    await redis.del(`session:${sessionId}`);

    await prisma.session.update({
      where: { id: sessionId },
      data: { terminatedAt: new Date(), terminationReason: reason }
    });

    logger.info(`Session ${sessionId} terminated: ${reason}`);
  }

  // ==========================================================================
  // PRIVILEGE ELEVATION & LEAST PRIVILEGE
  // ==========================================================================

  async requestPrivilegeElevation(request: PrivilegeElevationRequest): Promise<PrivilegeElevation> {
    const requiresApproval = this.requiresApproval(request.requestedPrivileges);

    const elevation: PrivilegeElevation = {
      id: crypto.randomBytes(16).toString('hex'),
      userId: request.userId,
      privileges: request.requestedPrivileges,
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + request.duration * 1000),
      approvedBy: requiresApproval ? [] : ['SYSTEM'],
      justification: request.justification,
      status: requiresApproval ? 'PENDING' : 'ACTIVE',
      breakGlassAccess: false
    };

    // Store in database
    await prisma.privilegeElevation.create({
      data: {
        id: elevation.id,
        userId: elevation.userId,
        privileges: elevation.privileges,
        grantedAt: elevation.grantedAt,
        expiresAt: elevation.expiresAt,
        approvedBy: elevation.approvedBy,
        justification: elevation.justification,
        status: elevation.status
      }
    });

    // If requires approval, notify approvers
    if (requiresApproval && request.approvers) {
      await this.notifyApprovers(request.approvers, elevation);
    }

    logger.info(`Privilege elevation requested: ${elevation.id} for user ${request.userId}`);

    return elevation;
  }

  private requiresApproval(privileges: string[]): boolean {
    const criticalPrivileges = [
      'admin:users:delete',
      'admin:system:config',
      'admin:security:bypass',
      'admin:data:export'
    ];

    return privileges.some(p => criticalPrivileges.includes(p));
  }

  private async notifyApprovers(approvers: string[], elevation: PrivilegeElevation): Promise<void> {
    // In production, send email/Slack notifications
    logger.info(`Approval needed for elevation ${elevation.id}, notifying: ${approvers.join(', ')}`);
  }

  async approvePrivilegeElevation(elevationId: string, approverId: string): Promise<void> {
    const elevation = await prisma.privilegeElevation.findUnique({
      where: { id: elevationId }
    });

    if (!elevation) {
      throw new Error('Elevation not found');
    }

    const approvedBy = [...(elevation.approvedBy as string[]), approverId];

    // Update status
    await prisma.privilegeElevation.update({
      where: { id: elevationId },
      data: {
        approvedBy,
        status: 'ACTIVE'
      }
    });

    logger.info(`Privilege elevation ${elevationId} approved by ${approverId}`);
  }

  async checkPrivilege(userId: string, privilege: string): Promise<boolean> {
    // Check active privilege elevations
    const elevation = await prisma.privilegeElevation.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        privileges: {
          has: privilege
        },
        expiresAt: {
          gt: new Date()
        }
      }
    });

    return elevation !== null;
  }

  async breakGlassAccess(userId: string, justification: string): Promise<PrivilegeElevation> {
    // Emergency access - grants all privileges immediately
    const elevation: PrivilegeElevation = {
      id: crypto.randomBytes(16).toString('hex'),
      userId,
      privileges: ['*'],
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      approvedBy: ['BREAK_GLASS'],
      justification,
      status: 'ACTIVE',
      breakGlassAccess: true
    };

    await prisma.privilegeElevation.create({
      data: {
        id: elevation.id,
        userId: elevation.userId,
        privileges: elevation.privileges,
        grantedAt: elevation.grantedAt,
        expiresAt: elevation.expiresAt,
        approvedBy: elevation.approvedBy,
        justification: elevation.justification,
        status: elevation.status,
        breakGlassAccess: true
      }
    });

    // Log critical event
    await this.logSecurityEvent(userId, 'BREAK_GLASS_ACCESS', {
      elevationId: elevation.id,
      justification
    });

    logger.warn(`Break-glass access granted to user ${userId}: ${justification}`);

    return elevation;
  }

  // ==========================================================================
  // NETWORK MICRO-SEGMENTATION
  // ==========================================================================

  async authenticateService(
    serviceId: string,
    certificateThumbprint: string
  ): Promise<ServiceAuthentication> {
    // Verify certificate
    const cert = await prisma.serviceCertificate.findUnique({
      where: { thumbprint: certificateThumbprint }
    });

    if (!cert || cert.serviceId !== serviceId) {
      throw new Error('Invalid service certificate');
    }

    if (cert.expiresAt < new Date()) {
      throw new Error('Certificate expired');
    }

    // Calculate service trust score
    const trustScore = await this.calculateServiceTrustScore(serviceId);

    const auth: ServiceAuthentication = {
      serviceId,
      certificateThumbprint,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      allowedEndpoints: cert.allowedEndpoints as string[],
      trustScore
    };

    // Store in cache
    await redis.setex(
      `service:auth:${serviceId}`,
      3600,
      JSON.stringify(auth)
    );

    return auth;
  }

  private async calculateServiceTrustScore(serviceId: string): Promise<number> {
    // Base score
    let score = 100;

    // Check recent security events
    const events = await prisma.securityEvent.count({
      where: {
        data: {
          path: ['serviceId'],
          equals: serviceId
        },
        severity: {
          in: ['HIGH', 'CRITICAL']
        },
        timestamp: {
          gte: new Date(Date.now() - 86400000) // Last 24 hours
        }
      }
    });

    score -= events * 10;

    return Math.max(0, score);
  }

  async validateServiceToServiceCall(
    sourceServiceId: string,
    targetServiceId: string,
    endpoint: string
  ): Promise<boolean> {
    // Check network policy
    const policy = await prisma.networkSegment.findFirst({
      where: {
        serviceId: sourceServiceId
      }
    });

    if (!policy) return false;

    const allowedServices = policy.allowedServices as string[];
    if (!allowedServices.includes(targetServiceId)) {
      logger.warn(`Service ${sourceServiceId} not allowed to call ${targetServiceId}`);
      return false;
    }

    // Verify mTLS if required
    if (policy.mTLSEnabled) {
      const auth = await redis.get(`service:auth:${sourceServiceId}`);
      if (!auth) {
        logger.warn(`Service ${sourceServiceId} not authenticated via mTLS`);
        return false;
      }
    }

    return true;
  }
}

// ============================================================================
// HELPER INTERFACES
// ============================================================================

interface UserBehaviorBaseline {
  userId: string;
  typicalLoginHours: number[];
  typicalLocations: any[];
  typicalDevices: string[];
  accessPatterns: string[];
  avgSessionDuration: number;
  lastUpdated: Date;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const zeroTrustEngine = new ZeroTrustEngine();
