import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';
import { redis } from '../redis';
import { db } from '../database';
import { config } from '../../config/environment';
import * as crypto from 'crypto';

interface FacebookUserInfo {
  id: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  picture?: {
    data?: {
      height?: number;
      is_silhouette?: boolean;
      url?: string;
      width?: number;
    };
  };
  verified?: boolean;
}

interface FacebookSignInResponse {
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

interface FacebookAuthRequest {
  accessToken: string;
  platform: 'mobile' | 'web';
  deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  permissions?: string[];
}

interface FacebookTokenValidation {
  app_id: string;
  type: string;
  application: string;
  data_access_expires_at: number;
  expires_at: number;
  is_valid: boolean;
  issued_at: number;
  metadata?: {
    auth_type?: string;
    sso?: string;
  };
  scopes: string[];
  user_id: string;
}

export class FacebookAuthService {
  private static instance: FacebookAuthService;
  private supabaseClient: unknown;
  private readonly APP_ID: string;
  private readonly APP_SECRET: string;
  private readonly GRAPH_API_URL = 'https://graph.facebook.com/v18.0';
  private readonly REQUIRED_PERMISSIONS = ['email', 'public_profile'];

  constructor() {
    // Initialize Facebook configuration
    this.APP_ID = process.env.FACEBOOK_APP_ID!;
    this.APP_SECRET = process.env.FACEBOOK_APP_SECRET!;

    // Validate required configuration
    this.validateConfiguration();

    // Initialize Supabase client
    this.initializeSupabase();
  }

  static getInstance(): FacebookAuthService {
    if (!FacebookAuthService.instance) {
      FacebookAuthService.instance = new FacebookAuthService();
    }
    return FacebookAuthService.instance;
  }

  /**
   * Validate Facebook configuration
   */
  private validateConfiguration(): void {
    if (!this.APP_ID || !this.APP_SECRET) {
      throw new Error('Facebook App ID and App Secret are required');
    }

    if (this.APP_ID.length < 10 || this.APP_SECRET.length < 20) {
      logger.warn('Facebook credentials may be invalid - check APP_ID and APP_SECRET');
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
   * Validate Facebook access token
   */
  async validateAccessToken(accessToken: string): Promise<FacebookTokenValidation> {
    try {
      const appAccessToken = `${this.APP_ID}|${this.APP_SECRET}`;

      const response = await fetch(
        `${this.GRAPH_API_URL}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`
      );

      if (!response.ok) {
        throw new Error(`Facebook token validation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      const tokenData = data.data as FacebookTokenValidation;

      // Validate token properties
      if (!tokenData.is_valid) {
        throw new ApiError(401, 'Facebook access token is invalid');
      }

      if (tokenData.app_id !== this.APP_ID) {
        throw new ApiError(401, 'Facebook token is for different app');
      }

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (tokenData.expires_at && tokenData.expires_at < now) {
        throw new ApiError(401, 'Facebook access token has expired');
      }

      // Validate required permissions
      const hasRequiredPermissions = this.REQUIRED_PERMISSIONS.every(permission =>
        tokenData.scopes.includes(permission)
      );

      if (!hasRequiredPermissions) {
        throw new ApiError(403, `Missing required Facebook permissions: ${this.REQUIRED_PERMISSIONS.join(', ')}`);
      }

      logger.debug('Facebook token validated successfully', {
        userId: tokenData.user_id,
        scopes: tokenData.scopes,
        expiresAt: tokenData.expires_at,
      });

      return tokenData;

    } catch (error: unknown) {
      logger.error('Facebook token validation failed:', {
        error: error.message,
        // Don't log the actual token for security
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(401, 'Failed to validate Facebook access token');
    }
  }

  /**
   * Get Facebook user information
   */
  async getUserInfo(accessToken: string): Promise<FacebookUserInfo> {
    try {
      const fields = [
        'id',
        'email',
        'name',
        'first_name',
        'last_name',
        'picture.width(200).height(200)',
        'verified',
      ].join(',');

      const response = await fetch(
        `${this.GRAPH_API_URL}/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
      );

      if (!response.ok) {
        throw new Error(`Facebook user info request failed: ${response.status}`);
      }

      const userData = await response.json();

      if (userData.error) {
        throw new Error(`Facebook API error: ${userData.error.message}`);
      }

      // Validate required fields
      if (!userData.id) {
        throw new ApiError(400, 'Facebook user ID not provided');
      }

      logger.debug('Facebook user info retrieved', {
        userId: userData.id,
        hasEmail: !!userData.email,
        hasName: !!userData.name,
        verified: userData.verified,
      });

      return userData as FacebookUserInfo;

    } catch (error: unknown) {
      logger.error('Failed to get Facebook user info:', {
        error: error.message,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Failed to retrieve Facebook user information');
    }
  }

  /**
   * Process Facebook Sign-In
   */
  async signIn(request: FacebookAuthRequest): Promise<FacebookSignInResponse> {
    const startTime = process.hrtime.bigint();
    const securityEvents: Array<{ type: string; timestamp: string; details: unknown }> = [];

    try {
      // Validate the Facebook access token
      const tokenValidation = await this.validateAccessToken(request.accessToken);

      securityEvents.push({
        type: 'facebook_token_validated',
        timestamp: new Date().toISOString(),
        details: {
          platform: request.platform,
          scopes: tokenValidation.scopes,
          app_id: tokenValidation.app_id,
        },
      });

      // Get Facebook user information
      const facebookUser = await this.getUserInfo(request.accessToken);

      securityEvents.push({
        type: 'facebook_user_info_retrieved',
        timestamp: new Date().toISOString(),
        details: {
          hasEmail: !!facebookUser.email,
          hasName: !!facebookUser.name,
          verified: facebookUser.verified,
        },
      });

      // Rate limiting check
      await this.checkRateLimit(
        facebookUser.email || facebookUser.id,
        request.deviceInfo?.ipAddress
      );

      // Check for existing user
      let user = await this.findUserByFacebookId(facebookUser.id);
      let isNewUser = false;

      if (!user) {
        // Check if user exists with the same email (if email is provided)
        if (facebookUser.email) {
          user = await this.findUserByEmail(facebookUser.email);

          if (user) {
            // Link existing account with Facebook
            await this.validateAccountLinking(user, facebookUser);
            await this.linkFacebookAccount(user.id, facebookUser);

            securityEvents.push({
              type: 'facebook_account_linked',
              timestamp: new Date().toISOString(),
              details: { existingUserId: user.id },
            });
          }
        }

        if (!user) {
          // Create new user
          user = await this.createFacebookUser(facebookUser, request);
          isNewUser = true;

          securityEvents.push({
            type: 'facebook_user_created',
            timestamp: new Date().toISOString(),
            details: { newUserId: user.id },
          });
        }
      } else {
        // Update existing user info
        await this.updateUserFromFacebook(user.id, facebookUser);

        securityEvents.push({
          type: 'facebook_user_updated',
          timestamp: new Date().toISOString(),
          details: { userId: user.id },
        });
      }

      // Sync with Supabase if configured
      if (this.supabaseClient) {
        await this.syncWithSupabase(user, facebookUser);
      }

      // Generate JWT tokens
      const tokens = await this.generateSecureTokens(user, request.deviceInfo);

      // Comprehensive audit logging
      await this.logSecurityEvent(user.id, 'facebook_signin_success', request.platform, {
        deviceInfo: request.deviceInfo,
        securityEvents,
        isNewUser,
        facebookVerified: facebookUser.verified,
      });

      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;

      logger.info('Facebook Sign-In completed', {
        userId: user.id,
        email: facebookUser.email,
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
      await this.logSecurityEvent(null, 'facebook_signin_failed', request.platform, {
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceInfo: request.deviceInfo,
      });

      logger.error('Facebook Sign-In failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: request.platform,
        deviceInfo: request.deviceInfo,
      });

      throw error;
    }
  }

  /**
   * Verify webhook signature for Facebook webhooks
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.APP_SECRET)
        .update(payload)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Facebook webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Handle Facebook deauthorization webhook
   */
  async handleDeauthorization(userId: string): Promise<void> {
    try {
      // Remove Facebook connection from user account
      await db.query(
        `UPDATE users
         SET facebook_id = NULL,
             facebook_access_token = NULL,
             auth_provider = CASE
               WHEN auth_provider = 'facebook' THEN 'email'
               ELSE auth_provider
             END,
             updated_at = NOW()
         WHERE facebook_id = $1`,
        [userId]
      );

      // Log deauthorization event
      await this.logSecurityEvent(null, 'facebook_deauthorized', 'webhook', {
        facebookUserId: userId,
      });

      logger.info('Facebook deauthorization processed', {
        facebookUserId: userId,
      });

    } catch (error) {
      logger.error('Failed to process Facebook deauthorization:', error);
      throw new ApiError(500, 'Failed to process deauthorization');
    }
  }

  /**
   * Get long-lived access token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    try {
      const response = await fetch(
        `${this.GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.APP_ID}&client_secret=${this.APP_SECRET}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`
      );

      if (!response.ok) {
        throw new Error(`Facebook token exchange failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      logger.info('Facebook long-lived token obtained', {
        expiresIn: data.expires_in,
      });

      return data;

    } catch (error) {
      logger.error('Failed to get Facebook long-lived token:', error);
      throw new ApiError(500, 'Failed to exchange for long-lived token');
    }
  }

  /**
   * Utility methods
   */
  private async checkRateLimit(identifier: string, ipAddress?: string): Promise<void> {
    const rateLimitKey = `facebook_auth_rate_limit:${identifier}:${ipAddress || 'unknown'}`;
    const attempts = await redis.incr(rateLimitKey);

    if (attempts === 1) {
      await redis.expire(rateLimitKey, 300); // 5 minutes window
    }

    if (attempts > 5) { // Max 5 attempts per 5 minutes
      throw new ApiError(429, 'Too many Facebook authentication attempts. Please try again later.');
    }
  }

  private async validateAccountLinking(existingUser: unknown, facebookUser: FacebookUserInfo): Promise<void> {
    // Verify email match if both have emails
    if (existingUser.email && facebookUser.email &&
        existingUser.email.toLowerCase() !== facebookUser.email.toLowerCase()) {
      throw new ApiError(403, 'Email mismatch during Facebook account linking');
    }

    // Check if account already has Facebook linked
    if (existingUser.facebook_id && existingUser.facebook_id !== facebookUser.id) {
      throw new ApiError(409, 'A different Facebook account is already linked to this user');
    }

    // Facebook verification is less strict than other providers
    if (!facebookUser.verified) {
      logger.warn('Facebook account not verified during linking', {
        userId: existingUser.id,
        facebookId: facebookUser.id,
      });
    }
  }

  private async findUserByFacebookId(facebookId: string): Promise<unknown> {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE facebook_id = $1 AND status IN ($2, $3)',
        [facebookId, 'active', 'pending']
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by Facebook ID:', error);
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

  private async createFacebookUser(facebookUser: FacebookUserInfo, request: FacebookAuthRequest): Promise<unknown> {
    try {
      const email = facebookUser.email || '';
      const name = facebookUser.name ||
                  `${facebookUser.first_name || ''} ${facebookUser.last_name || ''}`.trim() ||
                  'Facebook User';
      const avatarUrl = facebookUser.picture?.data?.url;

      const result = await db.query(
        `INSERT INTO users (
          email, name, first_name, last_name,
          facebook_id, avatar_url, email_verified, auth_provider,
          role, status, preferences, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *`,
        [
          email.toLowerCase(),
          name,
          facebookUser.first_name || '',
          facebookUser.last_name || '',
          facebookUser.id,
          avatarUrl,
          !!facebookUser.email, // Facebook emails are generally verified
          'facebook',
          'user',
          'active',
          JSON.stringify({
            theme: 'light',
            notifications: true,
            language: 'en',
            onboardingCompleted: false,
            facebookSignInPreferences: {
              verified: facebookUser.verified,
              firstSignInDate: new Date().toISOString(),
            },
          }),
        ]
      );

      logger.info('Created new Facebook user:', {
        userId: result.rows[0].id,
        email: email,
        hasName: !!name,
        verified: facebookUser.verified,
      });

      return result.rows[0];
    } catch (error: unknown) {
      if (error.code === '23505') {
        throw new ApiError(409, 'User already exists');
      }
      logger.error('Error creating Facebook user:', error);
      throw new ApiError(500, 'Failed to create user account');
    }
  }

  private async linkFacebookAccount(userId: string, facebookUser: FacebookUserInfo): Promise<void> {
    try {
      const avatarUrl = facebookUser.picture?.data?.url;

      await db.query(
        `UPDATE users
         SET facebook_id = $1,
             auth_provider = CASE
               WHEN auth_provider = 'email' THEN 'facebook'
               ELSE auth_provider
             END,
             avatar_url = COALESCE(avatar_url, $2),
             email_verified = CASE
               WHEN email_verified = false AND $3 != '' THEN true
               ELSE email_verified
             END,
             updated_at = NOW()
         WHERE id = $4`,
        [facebookUser.id, avatarUrl, facebookUser.email || '', userId]
      );

      logger.info('Linked Facebook account to existing user:', { userId });
    } catch (error) {
      logger.error('Error linking Facebook account:', error);
      throw new ApiError(500, 'Failed to link Facebook account');
    }
  }

  private async updateUserFromFacebook(userId: string, facebookUser: FacebookUserInfo): Promise<void> {
    try {
      const avatarUrl = facebookUser.picture?.data?.url;

      await db.query(
        `UPDATE users
         SET avatar_url = COALESCE($1, avatar_url),
             last_login_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [avatarUrl, userId]
      );
    } catch (error) {
      logger.error('Error updating user from Facebook:', error);
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
        'user-agent': deviceInfo?.userAgent || deviceInfo?.deviceName || 'Facebook Auth',
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
        provider: 'facebook',
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

  private async syncWithSupabase(user: unknown, facebookUser: FacebookUserInfo): Promise<void> {
    if (!this.supabaseClient) return;

    try {
      const { data: supabaseUser } = await this.supabaseClient.auth.admin.getUserById(user.id);

      if (!supabaseUser) {
        await this.supabaseClient.auth.admin.createUser({
          id: user.id,
          email: user.email,
          email_confirm: !!facebookUser.email,
          user_metadata: {
            name: user.name,
            avatar_url: facebookUser.picture?.data?.url,
            provider: 'facebook',
            facebook_id: facebookUser.id,
            facebook_verified: facebookUser.verified,
          },
        });
      } else {
        await this.supabaseClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...supabaseUser.user_metadata,
            facebook_id: facebookUser.id,
            last_sign_in_provider: 'facebook',
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
      facebook_access_token,
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
export const facebookAuthService = FacebookAuthService.getInstance();