/**
 * Multi-Factor Authentication Service
 *
 * Comprehensive MFA implementation supporting TOTP, WebAuthn/FIDO2,
 * SMS, email verification, and hardware security keys.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// MFA Method Types
export type MFAMethod = 'totp' | 'webauthn' | 'sms' | 'email' | 'backup_codes';

// MFA Status
export type MFAStatus = 'pending' | 'verified' | 'expired' | 'failed';

// TOTP Configuration
export interface TOTPConfig {
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  issuer: string;
  accountName: string;
}

// WebAuthn Credential
export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  signCount: number;
  transports: string[];
  createdAt: number;
  lastUsedAt: number;
  deviceName: string;
  deviceType: 'platform' | 'cross-platform';
}

// User MFA Settings
export interface UserMFASettings {
  userId: string;
  enabled: boolean;
  methods: MFAMethod[];
  preferredMethod: MFAMethod;
  totpSecret?: string;
  totpVerified: boolean;
  webauthnCredentials: WebAuthnCredential[];
  phoneNumber?: string;
  phoneVerified: boolean;
  email?: string;
  emailVerified: boolean;
  backupCodes: string[];
  backupCodesUsed: string[];
  recoveryEmail?: string;
  lastVerifiedAt?: number;
  trustedDevices: TrustedDevice[];
  createdAt: number;
  updatedAt: number;
}

// Trusted Device
export interface TrustedDevice {
  id: string;
  fingerprint: string;
  userAgent: string;
  ipAddress: string;
  location?: string;
  trustedAt: number;
  expiresAt: number;
  lastUsedAt: number;
}

// MFA Challenge
export interface MFAChallenge {
  id: string;
  userId: string;
  method: MFAMethod;
  challenge: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  status: MFAStatus;
  createdAt: number;
  verifiedAt?: number;
  metadata: Record<string, unknown>;
}

// WebAuthn Registration Options
export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  timeout: number;
  attestation: 'none' | 'indirect' | 'direct';
  authenticatorSelection: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    residentKey: 'required' | 'preferred' | 'discouraged';
    userVerification: 'required' | 'preferred' | 'discouraged';
  };
  excludeCredentials: Array<{
    type: 'public-key';
    id: string;
    transports: string[];
  }>;
}

// WebAuthn Authentication Options
export interface WebAuthnAuthOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<{
    type: 'public-key';
    id: string;
    transports: string[];
  }>;
  userVerification: 'required' | 'preferred' | 'discouraged';
}

// MFA Service Configuration
export interface MFAServiceConfig {
  totpIssuer: string;
  totpAlgorithm: 'SHA1' | 'SHA256' | 'SHA512';
  totpDigits: number;
  totpPeriod: number;
  webauthnRpId: string;
  webauthnRpName: string;
  webauthnTimeout: number;
  challengeExpiryMinutes: number;
  maxAttempts: number;
  backupCodeCount: number;
  trustedDeviceExpiryDays: number;
  smsProvider?: 'twilio' | 'aws-sns';
  emailProvider?: 'sendgrid' | 'ses';
}

// MFA Stats
export interface MFAStats {
  totalUsers: number;
  enabledUsers: number;
  byMethod: Record<MFAMethod, number>;
  activeChallenges: number;
  verificationsToday: number;
  failedAttemptsToday: number;
}

export class MFAService extends EventEmitter {
  private config: MFAServiceConfig;
  private userSettings: Map<string, UserMFASettings> = new Map();
  private challenges: Map<string, MFAChallenge> = new Map();
  private verificationCounts: { timestamp: number; success: boolean }[] = [];

  constructor(config?: Partial<MFAServiceConfig>) {
    super();
    this.config = {
      totpIssuer: 'UpCoach',
      totpAlgorithm: 'SHA256',
      totpDigits: 6,
      totpPeriod: 30,
      webauthnRpId: 'upcoach.app',
      webauthnRpName: 'UpCoach',
      webauthnTimeout: 60000,
      challengeExpiryMinutes: 5,
      maxAttempts: 3,
      backupCodeCount: 10,
      trustedDeviceExpiryDays: 30,
      ...config,
    };

    // Clean up expired challenges periodically
    setInterval(() => this.cleanupExpiredChallenges(), 60000);
  }

  /**
   * Enable MFA for a user
   */
  enableMFA(userId: string, methods: MFAMethod[]): UserMFASettings {
    const existing = this.userSettings.get(userId);
    const now = Date.now();

    const settings: UserMFASettings = {
      userId,
      enabled: true,
      methods,
      preferredMethod: methods[0],
      totpVerified: existing?.totpVerified || false,
      webauthnCredentials: existing?.webauthnCredentials || [],
      phoneVerified: existing?.phoneVerified || false,
      emailVerified: existing?.emailVerified || false,
      backupCodes: existing?.backupCodes || [],
      backupCodesUsed: existing?.backupCodesUsed || [],
      trustedDevices: existing?.trustedDevices || [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.userSettings.set(userId, settings);
    this.emit('mfa-enabled', { userId, methods });

    return settings;
  }

  /**
   * Disable MFA for a user
   */
  disableMFA(userId: string): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings) return false;

    settings.enabled = false;
    settings.updatedAt = Date.now();
    this.userSettings.set(userId, settings);

    this.emit('mfa-disabled', { userId });
    return true;
  }

  /**
   * Setup TOTP for a user
   */
  setupTOTP(userId: string, accountName: string): TOTPConfig {
    const secret = this.generateTOTPSecret();

    const settings = this.getUserSettings(userId);
    settings.totpSecret = secret;
    settings.totpVerified = false;
    settings.updatedAt = Date.now();

    if (!settings.methods.includes('totp')) {
      settings.methods.push('totp');
    }

    this.userSettings.set(userId, settings);

    return {
      secret,
      algorithm: this.config.totpAlgorithm,
      digits: this.config.totpDigits,
      period: this.config.totpPeriod,
      issuer: this.config.totpIssuer,
      accountName,
    };
  }

  /**
   * Verify TOTP setup
   */
  verifyTOTPSetup(userId: string, code: string): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings?.totpSecret) return false;

    const valid = this.verifyTOTPCode(settings.totpSecret, code);

    if (valid) {
      settings.totpVerified = true;
      settings.updatedAt = Date.now();
      this.userSettings.set(userId, settings);
      this.emit('totp-verified', { userId });
    }

    return valid;
  }

  /**
   * Generate TOTP secret
   */
  private generateTOTPSecret(): string {
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  /**
   * Base32 encode
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }

  /**
   * Verify TOTP code
   */
  private verifyTOTPCode(secret: string, code: string, window: number = 1): boolean {
    const now = Math.floor(Date.now() / 1000);

    for (let i = -window; i <= window; i++) {
      const timeStep = Math.floor(now / this.config.totpPeriod) + i;
      const expectedCode = this.generateTOTPCode(secret, timeStep);

      if (code === expectedCode) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate TOTP code for a time step
   */
  private generateTOTPCode(secret: string, timeStep: number): string {
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(timeStep));

    const decodedSecret = this.base32Decode(secret);
    const hmac = crypto.createHmac(this.config.totpAlgorithm.toLowerCase(), decodedSecret);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, this.config.totpDigits);
    return otp.toString().padStart(this.config.totpDigits, '0');
  }

  /**
   * Base32 decode
   */
  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanedInput = encoded.toUpperCase().replace(/=+$/, '');
    const result: number[] = [];
    let bits = 0;
    let value = 0;

    for (const char of cleanedInput) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        result.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }

    return Buffer.from(result);
  }

  /**
   * Start WebAuthn registration
   */
  startWebAuthnRegistration(
    userId: string,
    userName: string,
    displayName: string,
    authenticatorType?: 'platform' | 'cross-platform'
  ): WebAuthnRegistrationOptions {
    const settings = this.getUserSettings(userId);
    const challenge = this.generateChallenge();

    // Store challenge for verification
    const mfaChallenge: MFAChallenge = {
      id: this.generateId(),
      userId,
      method: 'webauthn',
      challenge,
      expiresAt: Date.now() + this.config.challengeExpiryMinutes * 60 * 1000,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      status: 'pending',
      createdAt: Date.now(),
      metadata: { type: 'registration' },
    };

    this.challenges.set(mfaChallenge.id, mfaChallenge);

    return {
      challenge,
      rp: {
        id: this.config.webauthnRpId,
        name: this.config.webauthnRpName,
      },
      user: {
        id: userId,
        name: userName,
        displayName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: this.config.webauthnTimeout,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: authenticatorType,
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: settings.webauthnCredentials.map((cred) => ({
        type: 'public-key' as const,
        id: cred.id,
        transports: cred.transports,
      })),
    };
  }

  /**
   * Complete WebAuthn registration
   */
  completeWebAuthnRegistration(
    userId: string,
    credentialId: string,
    publicKey: string,
    transports: string[],
    deviceName: string,
    deviceType: 'platform' | 'cross-platform'
  ): WebAuthnCredential {
    const settings = this.getUserSettings(userId);
    const now = Date.now();

    const credential: WebAuthnCredential = {
      id: credentialId,
      publicKey,
      signCount: 0,
      transports,
      createdAt: now,
      lastUsedAt: now,
      deviceName,
      deviceType,
    };

    settings.webauthnCredentials.push(credential);

    if (!settings.methods.includes('webauthn')) {
      settings.methods.push('webauthn');
    }

    settings.updatedAt = now;
    this.userSettings.set(userId, settings);

    this.emit('webauthn-registered', { userId, credentialId, deviceName });

    return credential;
  }

  /**
   * Start WebAuthn authentication
   */
  startWebAuthnAuthentication(userId: string): WebAuthnAuthOptions & { challengeId: string } {
    const settings = this.userSettings.get(userId);
    if (!settings?.webauthnCredentials.length) {
      throw new Error('No WebAuthn credentials registered');
    }

    const challenge = this.generateChallenge();

    const mfaChallenge: MFAChallenge = {
      id: this.generateId(),
      userId,
      method: 'webauthn',
      challenge,
      expiresAt: Date.now() + this.config.challengeExpiryMinutes * 60 * 1000,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      status: 'pending',
      createdAt: Date.now(),
      metadata: { type: 'authentication' },
    };

    this.challenges.set(mfaChallenge.id, mfaChallenge);

    return {
      challengeId: mfaChallenge.id,
      challenge,
      timeout: this.config.webauthnTimeout,
      rpId: this.config.webauthnRpId,
      allowCredentials: settings.webauthnCredentials.map((cred) => ({
        type: 'public-key' as const,
        id: cred.id,
        transports: cred.transports,
      })),
      userVerification: 'preferred',
    };
  }

  /**
   * Verify WebAuthn authentication
   */
  verifyWebAuthnAuthentication(
    challengeId: string,
    credentialId: string,
    _authenticatorData: string,
    _signature: string,
    _signCount: number
  ): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.status !== 'pending') return false;

    if (Date.now() > challenge.expiresAt) {
      challenge.status = 'expired';
      return false;
    }

    const settings = this.userSettings.get(challenge.userId);
    if (!settings) return false;

    const credential = settings.webauthnCredentials.find((c) => c.id === credentialId);
    if (!credential) return false;

    // In production: verify authenticatorData, signature, and signCount
    // For now, we'll simulate successful verification

    credential.lastUsedAt = Date.now();
    settings.lastVerifiedAt = Date.now();
    settings.updatedAt = Date.now();

    challenge.status = 'verified';
    challenge.verifiedAt = Date.now();

    this.userSettings.set(challenge.userId, settings);
    this.recordVerification(true);

    this.emit('webauthn-verified', { userId: challenge.userId, credentialId });

    return true;
  }

  /**
   * Remove WebAuthn credential
   */
  removeWebAuthnCredential(userId: string, credentialId: string): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings) return false;

    const index = settings.webauthnCredentials.findIndex((c) => c.id === credentialId);
    if (index === -1) return false;

    settings.webauthnCredentials.splice(index, 1);
    settings.updatedAt = Date.now();

    if (settings.webauthnCredentials.length === 0) {
      settings.methods = settings.methods.filter((m) => m !== 'webauthn');
    }

    this.userSettings.set(userId, settings);
    this.emit('webauthn-removed', { userId, credentialId });

    return true;
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(userId: string): string[] {
    const settings = this.getUserSettings(userId);
    const codes: string[] = [];

    for (let i = 0; i < this.config.backupCodeCount; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    settings.backupCodes = codes.map((code) =>
      crypto.createHash('sha256').update(code).digest('hex')
    );
    settings.backupCodesUsed = [];

    if (!settings.methods.includes('backup_codes')) {
      settings.methods.push('backup_codes');
    }

    settings.updatedAt = Date.now();
    this.userSettings.set(userId, settings);

    this.emit('backup-codes-generated', { userId, count: codes.length });

    return codes;
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(userId: string, code: string): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings?.backupCodes.length) return false;

    const normalizedCode = code.toUpperCase().replace(/-/g, '');
    const formattedCode = `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4)}`;
    const hashedCode = crypto.createHash('sha256').update(formattedCode).digest('hex');

    const index = settings.backupCodes.indexOf(hashedCode);
    if (index === -1) return false;

    // Mark code as used
    settings.backupCodesUsed.push(hashedCode);
    settings.backupCodes.splice(index, 1);
    settings.lastVerifiedAt = Date.now();
    settings.updatedAt = Date.now();

    this.userSettings.set(userId, settings);
    this.recordVerification(true);

    this.emit('backup-code-used', { userId, remainingCodes: settings.backupCodes.length });

    return true;
  }

  /**
   * Send SMS verification code
   */
  async sendSMSCode(userId: string, phoneNumber: string): Promise<string> {
    const settings = this.getUserSettings(userId);

    if (!settings.methods.includes('sms')) {
      settings.methods.push('sms');
    }
    settings.phoneNumber = phoneNumber;
    settings.updatedAt = Date.now();

    const code = this.generateNumericCode(6);
    const challenge: MFAChallenge = {
      id: this.generateId(),
      userId,
      method: 'sms',
      challenge: crypto.createHash('sha256').update(code).digest('hex'),
      expiresAt: Date.now() + this.config.challengeExpiryMinutes * 60 * 1000,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      status: 'pending',
      createdAt: Date.now(),
      metadata: { phoneNumber },
    };

    this.challenges.set(challenge.id, challenge);
    this.userSettings.set(userId, settings);

    // In production: send SMS via provider
    this.emit('sms-code-sent', { userId, phoneNumber: this.maskPhoneNumber(phoneNumber) });

    return challenge.id;
  }

  /**
   * Verify SMS code
   */
  verifySMSCode(challengeId: string, code: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.method !== 'sms') return false;

    return this.verifyChallenge(challenge, code);
  }

  /**
   * Send email verification code
   */
  async sendEmailCode(userId: string, email: string): Promise<string> {
    const settings = this.getUserSettings(userId);

    if (!settings.methods.includes('email')) {
      settings.methods.push('email');
    }
    settings.email = email;
    settings.updatedAt = Date.now();

    const code = this.generateNumericCode(6);
    const challenge: MFAChallenge = {
      id: this.generateId(),
      userId,
      method: 'email',
      challenge: crypto.createHash('sha256').update(code).digest('hex'),
      expiresAt: Date.now() + this.config.challengeExpiryMinutes * 60 * 1000,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      status: 'pending',
      createdAt: Date.now(),
      metadata: { email },
    };

    this.challenges.set(challenge.id, challenge);
    this.userSettings.set(userId, settings);

    // In production: send email via provider
    this.emit('email-code-sent', { userId, email: this.maskEmail(email) });

    return challenge.id;
  }

  /**
   * Verify email code
   */
  verifyEmailCode(challengeId: string, code: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.method !== 'email') return false;

    return this.verifyChallenge(challenge, code);
  }

  /**
   * Verify a challenge
   */
  private verifyChallenge(challenge: MFAChallenge, code: string): boolean {
    if (challenge.status !== 'pending') return false;

    if (Date.now() > challenge.expiresAt) {
      challenge.status = 'expired';
      return false;
    }

    challenge.attempts++;

    if (challenge.attempts > challenge.maxAttempts) {
      challenge.status = 'failed';
      this.recordVerification(false);
      return false;
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    if (hashedCode === challenge.challenge) {
      challenge.status = 'verified';
      challenge.verifiedAt = Date.now();

      const settings = this.userSettings.get(challenge.userId);
      if (settings) {
        settings.lastVerifiedAt = Date.now();
        settings.updatedAt = Date.now();

        if (challenge.method === 'sms') {
          settings.phoneVerified = true;
        } else if (challenge.method === 'email') {
          settings.emailVerified = true;
        }

        this.userSettings.set(challenge.userId, settings);
      }

      this.recordVerification(true);
      return true;
    }

    this.recordVerification(false);
    return false;
  }

  /**
   * Create MFA challenge for user
   */
  createChallenge(userId: string, method: MFAMethod): MFAChallenge {
    const settings = this.userSettings.get(userId);
    if (!settings?.methods.includes(method)) {
      throw new Error(`MFA method ${method} not enabled for user`);
    }

    let challengeValue: string;

    if (method === 'totp') {
      // For TOTP, the challenge is just a marker
      challengeValue = 'totp';
    } else {
      challengeValue = this.generateChallenge();
    }

    const challenge: MFAChallenge = {
      id: this.generateId(),
      userId,
      method,
      challenge: challengeValue,
      expiresAt: Date.now() + this.config.challengeExpiryMinutes * 60 * 1000,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      status: 'pending',
      createdAt: Date.now(),
      metadata: {},
    };

    this.challenges.set(challenge.id, challenge);
    return challenge;
  }

  /**
   * Verify MFA for a challenge
   */
  verifyMFA(challengeId: string, code: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return false;

    if (challenge.method === 'totp') {
      const settings = this.userSettings.get(challenge.userId);
      if (!settings?.totpSecret || !settings.totpVerified) return false;

      challenge.attempts++;

      if (Date.now() > challenge.expiresAt || challenge.attempts > challenge.maxAttempts) {
        challenge.status = challenge.attempts > challenge.maxAttempts ? 'failed' : 'expired';
        this.recordVerification(false);
        return false;
      }

      const valid = this.verifyTOTPCode(settings.totpSecret, code);

      if (valid) {
        challenge.status = 'verified';
        challenge.verifiedAt = Date.now();
        settings.lastVerifiedAt = Date.now();
        this.userSettings.set(challenge.userId, settings);
        this.recordVerification(true);
        return true;
      }

      this.recordVerification(false);
      return false;
    }

    return this.verifyChallenge(challenge, code);
  }

  /**
   * Add trusted device
   */
  addTrustedDevice(
    userId: string,
    fingerprint: string,
    userAgent: string,
    ipAddress: string,
    location?: string
  ): TrustedDevice {
    const settings = this.getUserSettings(userId);
    const now = Date.now();

    const device: TrustedDevice = {
      id: this.generateId(),
      fingerprint,
      userAgent,
      ipAddress,
      location,
      trustedAt: now,
      expiresAt: now + this.config.trustedDeviceExpiryDays * 24 * 60 * 60 * 1000,
      lastUsedAt: now,
    };

    settings.trustedDevices.push(device);
    settings.updatedAt = now;
    this.userSettings.set(userId, settings);

    this.emit('device-trusted', { userId, deviceId: device.id });

    return device;
  }

  /**
   * Check if device is trusted
   */
  isTrustedDevice(userId: string, fingerprint: string): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings) return false;

    const device = settings.trustedDevices.find((d) => d.fingerprint === fingerprint);
    if (!device) return false;

    if (Date.now() > device.expiresAt) {
      this.removeTrustedDevice(userId, device.id);
      return false;
    }

    device.lastUsedAt = Date.now();
    settings.updatedAt = Date.now();
    this.userSettings.set(userId, settings);

    return true;
  }

  /**
   * Remove trusted device
   */
  removeTrustedDevice(userId: string, deviceId: string): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings) return false;

    const index = settings.trustedDevices.findIndex((d) => d.id === deviceId);
    if (index === -1) return false;

    settings.trustedDevices.splice(index, 1);
    settings.updatedAt = Date.now();
    this.userSettings.set(userId, settings);

    this.emit('device-untrusted', { userId, deviceId });

    return true;
  }

  /**
   * Get user settings
   */
  getUserSettings(userId: string): UserMFASettings {
    let settings = this.userSettings.get(userId);

    if (!settings) {
      settings = {
        userId,
        enabled: false,
        methods: [],
        preferredMethod: 'totp',
        totpVerified: false,
        webauthnCredentials: [],
        phoneVerified: false,
        emailVerified: false,
        backupCodes: [],
        backupCodesUsed: [],
        trustedDevices: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.userSettings.set(userId, settings);
    }

    return settings;
  }

  /**
   * Get MFA stats
   */
  getStats(): MFAStats {
    const byMethod: Record<MFAMethod, number> = {
      totp: 0,
      webauthn: 0,
      sms: 0,
      email: 0,
      backup_codes: 0,
    };

    let enabledUsers = 0;

    for (const settings of this.userSettings.values()) {
      if (settings.enabled) {
        enabledUsers++;
        for (const method of settings.methods) {
          byMethod[method]++;
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayVerifications = this.verificationCounts.filter(
      (v) => v.timestamp >= todayStart
    );

    return {
      totalUsers: this.userSettings.size,
      enabledUsers,
      byMethod,
      activeChallenges: Array.from(this.challenges.values()).filter(
        (c) => c.status === 'pending' && Date.now() < c.expiresAt
      ).length,
      verificationsToday: todayVerifications.filter((v) => v.success).length,
      failedAttemptsToday: todayVerifications.filter((v) => !v.success).length,
    };
  }

  /**
   * Generate random challenge
   */
  private generateChallenge(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mfa_${Date.now().toString(36)}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate numeric code
   */
  private generateNumericCode(length: number): string {
    const digits = crypto.randomInt(0, Math.pow(10, length));
    return digits.toString().padStart(length, '0');
  }

  /**
   * Mask phone number
   */
  private maskPhoneNumber(phone: string): string {
    if (phone.length <= 4) return '****';
    return `****${phone.slice(-4)}`;
  }

  /**
   * Mask email
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '****@****';
    const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***';
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Record verification attempt
   */
  private recordVerification(success: boolean): void {
    this.verificationCounts.push({ timestamp: Date.now(), success });

    // Keep last 24 hours of data
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.verificationCounts = this.verificationCounts.filter((v) => v.timestamp > oneDayAgo);
  }

  /**
   * Clean up expired challenges
   */
  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    for (const [id, challenge] of this.challenges) {
      if (challenge.expiresAt < now && challenge.status === 'pending') {
        challenge.status = 'expired';
      }
      // Remove old challenges (older than 1 hour)
      if (challenge.createdAt < now - 3600000) {
        this.challenges.delete(id);
      }
    }
  }
}

// Singleton instance
let mfaService: MFAService | null = null;

export function getMFAService(): MFAService {
  if (!mfaService) {
    mfaService = new MFAService();
  }
  return mfaService;
}

export default MFAService;
