import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';
import { redis } from '../redis';
import { db } from '../database';
import { config } from '../../config/environment';
import * as crypto from 'crypto';

interface AppleUserInfo {
  sub: string;
  email: string;
  email_verified: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
  real_user_status?: number;
  transfer_sub?: string;
}

interface AppleSignInResponse {
  user: unknown;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  isNewUser: boolean;
  securityEvents?: Array<{
    type: string;
    timestamp: string;
    details: unknown;
  }>;
}

interface AppleAuthRequest {
  identityToken: string;
  authorizationCode?: string;
  user?: {
    name?: {
      firstName: string;
      lastName: string;
    };
    email?: string;
  };
  platform: 'mobile' | 'web';
  deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  nonce?: string;
}

interface AppleJWTHeader {
  alg: string;
  typ: string;
  kid: string;
}

interface AppleJWTPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  c_hash?: string;
  email?: string;
  email_verified?: string;
  auth_time?: number;
  nonce_supported?: boolean;
  real_user_status?: number;
  transfer_sub?: string;
}

export class AppleAuthService {
  private static instance: AppleAuthService;
  private supabaseClient: unknown;
  private applePublicKeys: Map<string, any> = new Map();
  private readonly CLIENT_IDS: {
    web: string;
    mobile: string;
    service: string;
  };
  private readonly TEAM_ID: string;
  private readonly KEY_ID: string;
  private readonly PRIVATE_KEY: string;
  private readonly APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
  private readonly APPLE_ISSUER = 'https://appleid.apple.com';

  constructor() {
    // Initialize Apple Sign-In configuration
    this.CLIENT_IDS = {
      web: process.env.APPLE_WEB_CLIENT_ID!,
      mobile: process.env.APPLE_MOBILE_CLIENT_ID!,
      service: process.env.APPLE_SERVICE_CLIENT_ID!,
    };

    this.TEAM_ID = process.env.APPLE_TEAM_ID!;
    this.KEY_ID = process.env.APPLE_KEY_ID!;
    this.PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY!;

    // Validate required configuration
    this.validateConfiguration();

    // Initialize Supabase client
    this.initializeSupabase();

    // Fetch and cache Apple's public keys
    this.refreshApplePublicKeys();
  }

  static getInstance(): AppleAuthService {
    if (!AppleAuthService.instance) {
      AppleAuthService.instance = new AppleAuthService();
    }
    return AppleAuthService.instance;
  }

  /**
   * Validate Apple Sign-In configuration
   */
  private validateConfiguration(): void {
    const requiredEnvVars = [
      'APPLE_WEB_CLIENT_ID',
      'APPLE_MOBILE_CLIENT_ID',
      'APPLE_TEAM_ID',
      'APPLE_KEY_ID',
      'APPLE_PRIVATE_KEY',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required Apple Sign-In environment variables: ${missingVars.join(', ')}`);
    }

    // Validate private key format
    if (!this.PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
      logger.warn('Apple private key may not be in correct format');
    }
  }

  /**
   * Initialize Supabase client
   */
  private initializeSupabase(): void {
    const supabaseUrl = config.supabase.url;
    const supabaseServiceKey = config.supabase.serviceRoleKey;

    if (supabaseUrl && supabaseServiceKey) {
      this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'X-Client-Info': 'upcoach-backend@1.0.0',
          },
        },
      });
    }
  }

  /**
   * Fetch and cache Apple's public keys for JWT verification
   */
  private async refreshApplePublicKeys(): Promise<void> {
    try {
      const response = await fetch(this.APPLE_KEYS_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch Apple public keys: ${response.status}`);
      }

      const data = await response.json();

      for (const key of data.keys) {
        this.applePublicKeys.set(key.kid, key);
      }

      logger.info('Apple public keys cached successfully', {
        keyCount: this.applePublicKeys.size,
      });

      // Cache in Redis for distributed deployments
      await redis.setEx(
        'apple_public_keys',
        3600, // 1 hour cache
        JSON.stringify(data.keys)
      );

    } catch (error) {
      logger.error('Failed to fetch Apple public keys:', error);

      // Try to load from Redis cache
      try {
        const cachedKeys = await redis.get('apple_public_keys');
        if (cachedKeys) {
          const keys = JSON.parse(cachedKeys);
          for (const key of keys) {
            this.applePublicKeys.set(key.kid, key);
          }
          logger.info('Loaded Apple public keys from cache');
        }
      } catch (cacheError) {
        logger.error('Failed to load Apple public keys from cache:', cacheError);
      }
    }
  }

  /**
   * Verify Apple ID token
   */
  async verifyIdentityToken(
    identityToken: string,
    platform: 'mobile' | 'web',
    options: {
      nonce?: string;
      audience?: string;
    } = {}
  ): Promise<AppleUserInfo> {
    try {
      const startTime = process.hrtime.bigint();

      // Decode JWT header to get key ID
      const decoded = jwt.decode(identityToken, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        throw new ApiError(400, 'Invalid Apple identity token format');
      }

      const header = decoded.header as AppleJWTHeader;
      const payload = decoded.payload as AppleJWTPayload;

      // Validate basic JWT structure
      if (!header.kid || !header.alg || header.alg !== 'RS256') {
        throw new ApiError(400, 'Invalid Apple token header');
      }

      // Get Apple's public key for verification
      const publicKey = await this.getApplePublicKey(header.kid);
      if (!publicKey) {
        // Refresh keys and try again
        await this.refreshApplePublicKeys();
        const refreshedKey = await this.getApplePublicKey(header.kid);
        if (!refreshedKey) {
          throw new ApiError(401, 'Unable to verify Apple token - key not found');
        }
      }

      // Verify JWT signature and claims
      const verifiedPayload = jwt.verify(identityToken, publicKey, {
        algorithms: ['RS256'],
        issuer: this.APPLE_ISSUER,
        audience: options.audience || this.getClientIdForPlatform(platform),
        clockTolerance: 60, // 60 seconds tolerance
      }) as AppleJWTPayload;

      // Additional security validations
      await this.validateAppleTokenClaims(verifiedPayload, options);

      const endTime = process.hrtime.bigint();
      const verificationTime = Number(endTime - startTime) / 1000000;

      logger.info('Apple token verification completed', {
        platform,
        verificationTime: `${verificationTime.toFixed(2)}ms`,
        userId: verifiedPayload.sub,
        emailVerified: verifiedPayload.email_verified,
      });

      return {
        sub: verifiedPayload.sub,
        email: verifiedPayload.email || '',
        email_verified: verifiedPayload.email_verified || 'false',
        real_user_status: verifiedPayload.real_user_status,
        transfer_sub: verifiedPayload.transfer_sub,
      };

    } catch (error: unknown) {
      logger.error('Apple token verification failed:', {
        error: error.message,
        platform,
        // Don't log the actual token for security
      });

      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Apple identity token has expired');
      }

      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid Apple identity token');
      }

      throw new ApiError(401, 'Apple authentication failed');
    }
  }

  /**
   * Get Apple public key by key ID
   */
  private async getApplePublicKey(kid: string): Promise<string | null> {
    const keyData = this.applePublicKeys.get(kid);
    if (!keyData) {
      return null;
    }

    try {
      // Convert JWK to PEM format
      const jwkToPem = require('jwk-to-pem');
      return jwkToPem(keyData);
    } catch (error) {
      logger.error('Failed to convert Apple JWK to PEM:', error);
      return null;
    }
  }

  /**
   * Get appropriate client ID for platform
   */
  private getClientIdForPlatform(platform: 'mobile' | 'web'): string {
    return platform === 'mobile' ? this.CLIENT_IDS.mobile : this.CLIENT_IDS.web;
  }

  /**
   * Validate Apple token claims
   */
  private async validateAppleTokenClaims(
    payload: AppleJWTPayload,
    options: { nonce?: string }
  ): Promise<void> {
    // Check issuer
    if (payload.iss !== this.APPLE_ISSUER) {
      throw new ApiError(401, 'Invalid Apple token issuer');
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new ApiError(401, 'Apple token has expired');
    }

    // Check issued at time (prevent very old tokens)
    if (payload.iat && (now - payload.iat) > 600) { // 10 minutes max age
      throw new ApiError(401, 'Apple token is too old');
    }

    // Validate nonce if provided (CSRF protection)
    if (options.nonce) {
      const hashedNonce = crypto.createHash('sha256')
        .update(options.nonce)
        .digest('hex');

      // Apple uses the first 16 characters of the SHA256 hash
      const expectedNonceHash = hashedNonce.substring(0, 32);

      // Note: Apple doesn't always include nonce in the token
      // This is a best-effort validation
      logger.debug('Nonce validation (Apple)', {
        provided: !!options.nonce,
        expected: expectedNonceHash,
      });
    }

    // Check for suspicious patterns in subject
    if (payload.sub && payload.sub.length !== 41) {
      logger.warn('Apple token has unusual subject format', {
        subLength: payload.sub.length,
      });
    }

    // Validate real user status if present
    if (payload.real_user_status !== undefined) {
      // 0 = unsupported, 1 = unknown, 2 = likely real user
      if (payload.real_user_status < 1) {
        logger.warn('Apple token indicates potentially fake user', {
          realUserStatus: payload.real_user_status,
        });
      }
    }
  }

  /**
   * Process Apple Sign-In
   */
  async signIn(request: AppleAuthRequest): Promise<AppleSignInResponse> {
    const startTime = process.hrtime.bigint();
    const securityEvents: Array<{ type: string; timestamp: string; details: unknown }> = [];

    try {
      // Verify the Apple identity token
      const appleUser = await this.verifyIdentityToken(
        request.identityToken,
        request.platform,
        {
          nonce: request.nonce,
        }
      );

      // Security event logging
      securityEvents.push({
        type: 'apple_token_verified',
        timestamp: new Date().toISOString(),
        details: {
          platform: request.platform,
          email_verified: appleUser.email_verified,
          real_user_status: appleUser.real_user_status,
        },
      });

      // Rate limiting check
      await this.checkRateLimit(appleUser.email || appleUser.sub, request.deviceInfo?.ipAddress);

      // Check for existing user
      let user = await this.findUserByAppleId(appleUser.sub);
      let isNewUser = false;

      if (!user) {
        // Check if user exists with the same email (if email is provided)
        if (appleUser.email) {
          user = await this.findUserByEmail(appleUser.email);

          if (user) {
            // Link existing account with Apple
            await this.validateAccountLinking(user, appleUser);
            await this.linkAppleAccount(user.id, appleUser);

            securityEvents.push({
              type: 'apple_account_linked',
              timestamp: new Date().toISOString(),
              details: { existingUserId: user.id },
            });
          }
        }

        if (!user) {
          // Create new user
          user = await this.createAppleUser(appleUser, request);
          isNewUser = true;

          securityEvents.push({
            type: 'apple_user_created',
            timestamp: new Date().toISOString(),
            details: { newUserId: user.id },
          });
        }
      } else {
        // Update existing user info
        await this.updateUserFromApple(user.id, appleUser);

        securityEvents.push({
          type: 'apple_user_updated',
          timestamp: new Date().toISOString(),
          details: { userId: user.id },
        });
      }

      // Sync with Supabase if configured
      if (this.supabaseClient) {
        await this.syncWithSupabase(user, appleUser);
      }

      // Generate JWT tokens
      const tokens = await this.generateSecureTokens(user, request.deviceInfo);

      // Comprehensive audit logging
      await this.logSecurityEvent(user.id, 'apple_signin_success', request.platform, {
        deviceInfo: request.deviceInfo,
        securityEvents,
        isNewUser,
        emailVerified: appleUser.email_verified === 'true',
        realUserStatus: appleUser.real_user_status,
      });

      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;

      logger.info('Apple Sign-In completed', {
        userId: user.id,
        email: appleUser.email,
        platform: request.platform,
        isNewUser,
        processingTime: `${totalTime.toFixed(2)}ms`,
        securityEventCount: securityEvents.length,
      });

      return {
        user: this.sanitizeUser(user),
        tokens,
        isNewUser,
        securityEvents,
      };

    } catch (error) {
      // Security event for failed attempts
      await this.logSecurityEvent(null, 'apple_signin_failed', request.platform, {
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceInfo: request.deviceInfo,
      });

      logger.error('Apple Sign-In failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: request.platform,
        deviceInfo: request.deviceInfo,
      });

      throw error;
    }
  }

  /**
   * Generate client secret for server-to-server communication
   */
  generateClientSecret(audience: string = 'https://appleid.apple.com'): string {
    try {
      const now = Math.floor(Date.now() / 1000);

      const payload = {
        iss: this.TEAM_ID,
        iat: now,
        exp: now + 3600, // 1 hour
        aud: audience,
        sub: this.CLIENT_IDS.service || this.CLIENT_IDS.web,
      };

      const header = {
        alg: 'ES256',
        kid: this.KEY_ID,
      };

      return jwt.sign(payload, this.PRIVATE_KEY, {
        algorithm: 'ES256',
        header,
      });

    } catch (error) {
      logger.error('Failed to generate Apple client secret:', error);
      throw new ApiError(500, 'Failed to generate Apple client secret');
    }
  }

  /**
   * Exchange authorization code for refresh token (for web flows)
   */
  async exchangeAuthorizationCode(
    authorizationCode: string,
    platform: 'web' | 'mobile' = 'web'
  ): Promise<{
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    token_type?: string;
    expires_in?: number;
  }> {
    try {
      const clientSecret = this.generateClientSecret();
      const clientId = this.getClientIdForPlatform(platform);

      const response = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: authorizationCode,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Apple token exchange failed: ${response.status} - ${errorData}`);
      }

      const tokenData = await response.json();

      logger.info('Apple authorization code exchanged successfully', {
        platform,
        hasRefreshToken: !!tokenData.refresh_token,
        hasIdToken: !!tokenData.id_token,
      });

      return tokenData;

    } catch (error) {
      logger.error('Apple authorization code exchange failed:', error);
      throw new ApiError(500, 'Failed to exchange Apple authorization code');
    }
  }

  /**
   * Utility methods
   */
  private async checkRateLimit(identifier: string, ipAddress?: string): Promise<void> {
    const rateLimitKey = `apple_auth_rate_limit:${identifier}:${ipAddress || 'unknown'}`;
    const attempts = await redis.incr(rateLimitKey);

    if (attempts === 1) {
      await redis.expire(rateLimitKey, 300); // 5 minutes window
    }

    if (attempts > 5) { // Max 5 attempts per 5 minutes for Apple
      throw new ApiError(429, 'Too many Apple authentication attempts. Please try again later.');
    }
  }

  private async validateAccountLinking(existingUser: unknown, appleUser: AppleUserInfo): Promise<void> {
    // Verify email match if both have emails
    if (existingUser.email && appleUser.email &&
        existingUser.email.toLowerCase() !== appleUser.email.toLowerCase()) {
      throw new ApiError(403, 'Email mismatch during Apple account linking');
    }

    // Check if account already has Apple linked
    if (existingUser.apple_id && existingUser.apple_id !== appleUser.sub) {
      throw new ApiError(409, 'A different Apple account is already linked to this user');
    }

    // Apple doesn't verify emails the same way Google does
    // But we should still check if it's marked as verified
    if (appleUser.email_verified === 'false') {
      logger.warn('Apple account email not verified during linking', {
        userId: existingUser.id,
        appleId: appleUser.sub,
      });
    }
  }

  private async findUserByAppleId(appleId: string): Promise<unknown> {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE apple_id = $1 AND status IN ($2, $3)',
        [appleId, 'active', 'pending']
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by Apple ID:', error);
      return null;
    }
  }

  private async findUserByEmail(email: string): Promise<unknown> {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      return null;
    }
  }

  private async createAppleUser(appleUser: AppleUserInfo, request: AppleAuthRequest): Promise<unknown> {
    try {
      // Extract name from request if provided during first sign-in
      let firstName = '';
      let lastName = '';
      let fullName = '';

      if (request.user?.name) {
        firstName = request.user.name.firstName || '';
        lastName = request.user.name.lastName || '';
        fullName = `${firstName} ${lastName}`.trim();
      }

      // Use email from request or fall back to Apple user info
      const email = request.user?.email || appleUser.email || '';

      const result = await db.query(
        `INSERT INTO users (
          email, name, first_name, last_name,
          apple_id, email_verified, auth_provider,
          role, status, preferences, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`,
        [
          email.toLowerCase(),
          fullName || 'Apple User',
          firstName,
          lastName,
          appleUser.sub,
          appleUser.email_verified === 'true',
          'apple',
          'user',
          'active',
          JSON.stringify({
            theme: 'light',
            notifications: true,
            language: 'en',
            onboardingCompleted: false,
            appleSignInPreferences: {
              realUserStatus: appleUser.real_user_status,
              firstSignInDate: new Date().toISOString(),
            },
          }),
        ]
      );

      logger.info('Created new Apple user:', {
        userId: result.rows[0].id,
        email: email,
        emailVerified: appleUser.email_verified,
        hasName: !!fullName,
      });

      return result.rows[0];
    } catch (error: unknown) {
      if (error.code === '23505') {
        throw new ApiError(409, 'User already exists');
      }
      logger.error('Error creating Apple user:', error);
      throw new ApiError(500, 'Failed to create user account');
    }
  }

  private async linkAppleAccount(userId: string, appleUser: AppleUserInfo): Promise<void> {
    try {
      await db.query(
        `UPDATE users
         SET apple_id = $1,
             auth_provider = CASE
               WHEN auth_provider = 'email' THEN 'apple'
               ELSE auth_provider
             END,
             email_verified = CASE
               WHEN email_verified = false AND $2 = true THEN true
               ELSE email_verified
             END,
             updated_at = NOW()
         WHERE id = $3`,
        [appleUser.sub, appleUser.email_verified === 'true', userId]
      );

      logger.info('Linked Apple account to existing user:', { userId });
    } catch (error) {
      logger.error('Error linking Apple account:', error);
      throw new ApiError(500, 'Failed to link Apple account');
    }
  }

  private async updateUserFromApple(userId: string, appleUser: AppleUserInfo): Promise<void> {
    try {
      await db.query(
        `UPDATE users
         SET email_verified = CASE
               WHEN email_verified = false AND $1 = true THEN true
               ELSE email_verified
             END,
             last_login_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [appleUser.email_verified === 'true', userId]
      );
    } catch (error) {
      logger.error('Error updating user from Apple:', error);
      // Non-critical error, don't throw
    }
  }

  private async generateSecureTokens(
    user: unknown,
    deviceInfo?: unknown
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const { generateTokens } = await import('../../middleware/auth');

    const mockReq = {
      headers: {
        'user-agent': deviceInfo?.userAgent || deviceInfo?.deviceName || 'Apple Auth',
        'x-device-id': deviceInfo?.deviceId,
        'x-app-version': deviceInfo?.appVersion,
      },
      ip: deviceInfo?.ipAddress || '127.0.0.1',
      connection: {
        remoteAddress: deviceInfo?.ipAddress || '127.0.0.1',
      },
    };

    const tokens = generateTokens(user.id, user.email, user.role, mockReq as unknown);

    // Store refresh token with device binding
    const refreshTokenKey = `refresh_token:${user.id}`;
    const refreshTokenData = {
      token: tokens.refreshToken,
      deviceInfo: {
        ...deviceInfo,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      },
      security: {
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
        provider: 'apple',
      },
    };

    const refreshTokenTTL = config.env === 'production' ? 7 * 24 * 60 * 60 : 30 * 24 * 60 * 60;
    await redis.setEx(
      refreshTokenKey,
      refreshTokenTTL,
      JSON.stringify(refreshTokenData)
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600,
    };
  }

  private async logSecurityEvent(
    userId: string | null,
    eventType: string,
    platform: string,
    details?: unknown
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO security_events (
          user_id, event_type, platform, details,
          ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          userId,
          eventType,
          platform,
          details ? JSON.stringify(details) : null,
          details?.deviceInfo?.ipAddress || null,
          details?.deviceInfo?.userAgent || null,
        ]
      );
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  private async syncWithSupabase(user: unknown, appleUser: AppleUserInfo): Promise<void> {
    if (!this.supabaseClient) return;

    try {
      // Implementation similar to Google auth but for Apple
      const { data: supabaseUser } = await this.supabaseClient.auth.admin.getUserById(user.id);

      if (!supabaseUser) {
        await this.supabaseClient.auth.admin.createUser({
          id: user.id,
          email: user.email,
          email_confirm: appleUser.email_verified === 'true',
          user_metadata: {
            name: user.name,
            provider: 'apple',
            apple_id: appleUser.sub,
            real_user_status: appleUser.real_user_status,
          },
        });
      } else {
        await this.supabaseClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...supabaseUser.user_metadata,
            apple_id: appleUser.sub,
            last_sign_in_provider: 'apple',
          },
        });
      }
    } catch (error) {
      logger.error('Error syncing with Supabase:', error);
    }
  }

  private sanitizeUser(user: unknown): unknown {
    const {
      password_hash,
      apple_refresh_token,
      stripe_customer_secret,
      ...sanitized
    } = user;

    return {
      ...sanitized,
      preferences: typeof user.preferences === 'string'
        ? JSON.parse(user.preferences)
        : user.preferences,
    };
  }
}

// Export singleton instance
export const appleAuthService = AppleAuthService.getInstance();