import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';
import { redis } from '../redis';
import { db } from '../database';

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

interface GoogleSignInResponse {
  user: any;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  isNewUser: boolean;
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private oauthClient: OAuth2Client;
  private supabaseClient: any;
  private readonly CLIENT_ID: string;
  private readonly MOBILE_CLIENT_ID: string;
  private readonly WEB_CLIENT_ID: string;

  constructor() {
    // Initialize OAuth2 client with multiple client IDs
    this.CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
    this.MOBILE_CLIENT_ID = process.env.GOOGLE_MOBILE_CLIENT_ID || this.CLIENT_ID;
    this.WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || this.CLIENT_ID;

    if (!this.CLIENT_ID) {
      throw new Error('Google OAuth client ID not configured');
    }

    this.oauthClient = new OAuth2Client({
      clientId: this.CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    });

    // Initialize Supabase client for user synchronization
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Verify Google ID token from mobile or web client
   */
  async verifyIdToken(idToken: string, platform?: 'mobile' | 'web'): Promise<GoogleUserInfo> {
    try {
      // Determine which client ID to use for verification
      const clientIds = [this.CLIENT_ID];
      
      if (platform === 'mobile' && this.MOBILE_CLIENT_ID !== this.CLIENT_ID) {
        clientIds.push(this.MOBILE_CLIENT_ID);
      }
      
      if (platform === 'web' && this.WEB_CLIENT_ID !== this.CLIENT_ID) {
        clientIds.push(this.WEB_CLIENT_ID);
      }

      // Verify the token with Google
      const ticket = await this.oauthClient.verifyIdToken({
        idToken,
        audience: clientIds,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new ApiError(401, 'Invalid Google token payload');
      }

      // Validate token claims
      this.validateTokenClaims(payload);

      return {
        sub: payload.sub,
        email: payload.email!,
        email_verified: payload.email_verified || false,
        name: payload.name || '',
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        locale: payload.locale,
      };
    } catch (error: any) {
      logger.error('Google token verification failed:', error);
      
      if (error.message?.includes('Token used too late')) {
        throw new ApiError(401, 'Google token has expired');
      }
      
      if (error.message?.includes('Wrong number of segments')) {
        throw new ApiError(400, 'Malformed Google token');
      }
      
      throw new ApiError(401, 'Invalid Google authentication token');
    }
  }

  /**
   * Validate token claims for security
   */
  private validateTokenClaims(payload: any): void {
    // Check issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      throw new ApiError(401, 'Invalid token issuer');
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new ApiError(401, 'Token has expired');
    }

    // Check if email is present
    if (!payload.email) {
      throw new ApiError(400, 'Email not provided in Google token');
    }

    // Optionally check email verification
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !payload.email_verified) {
      throw new ApiError(403, 'Email not verified with Google');
    }
  }

  /**
   * Process Google sign-in and create/update user
   */
  async signIn(
    idToken: string,
    platform: 'mobile' | 'web' = 'web',
    deviceInfo?: {
      deviceId?: string;
      deviceName?: string;
      platform?: string;
      appVersion?: string;
    }
  ): Promise<GoogleSignInResponse> {
    try {
      // Verify the Google token
      const googleUser = await this.verifyIdToken(idToken, platform);

      // Check for existing user
      let user = await this.findUserByGoogleId(googleUser.sub);
      let isNewUser = false;

      if (!user) {
        // Check if user exists with the same email
        user = await this.findUserByEmail(googleUser.email);
        
        if (user) {
          // Link existing account with Google
          await this.linkGoogleAccount(user.id, googleUser);
        } else {
          // Create new user
          user = await this.createGoogleUser(googleUser);
          isNewUser = true;
        }
      } else {
        // Update user info from Google if needed
        await this.updateUserFromGoogle(user.id, googleUser);
      }

      // Sync with Supabase if configured
      if (this.supabaseClient) {
        await this.syncWithSupabase(user, googleUser);
      }

      // Generate JWT tokens
      const tokens = await this.generateTokens(user, deviceInfo);

      // Log authentication event
      await this.logAuthEvent(user.id, 'google_signin', platform, deviceInfo);

      return {
        user: this.sanitizeUser(user),
        tokens,
        isNewUser,
      };
    } catch (error) {
      logger.error('Google sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Get user info from Google tokens (for backward compatibility)
   */
  async getUserInfo(tokens: { idToken: string; accessToken?: string }): Promise<GoogleUserInfo> {
    return this.verifyIdToken(tokens.idToken);
  }

  /**
   * Find user by Google ID
   */
  private async findUserByGoogleId(googleId: string): Promise<any> {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE google_id = $1 AND is_active = true',
        [googleId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by Google ID:', error);
      return null;
    }
  }

  /**
   * Find user by email
   */
  private async findUserByEmail(email: string): Promise<any> {
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

  /**
   * Create new user from Google data
   */
  private async createGoogleUser(googleUser: GoogleUserInfo): Promise<any> {
    try {
      const result = await db.query(
        `INSERT INTO users (
          email, name, google_id, google_email, 
          avatar_url, is_email_verified, auth_provider,
          role, is_active, preferences, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`,
        [
          googleUser.email.toLowerCase(),
          googleUser.name,
          googleUser.sub,
          googleUser.email,
          googleUser.picture,
          googleUser.email_verified,
          'google',
          'user',
          true,
          JSON.stringify({
            theme: 'light',
            notifications: true,
            language: googleUser.locale || 'en',
          }),
        ]
      );

      logger.info('Created new Google user:', {
        userId: result.rows[0].id,
        email: googleUser.email,
      });

      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ApiError(409, 'User already exists');
      }
      logger.error('Error creating Google user:', error);
      throw new ApiError(500, 'Failed to create user account');
    }
  }

  /**
   * Link existing account with Google
   */
  private async linkGoogleAccount(userId: string, googleUser: GoogleUserInfo): Promise<void> {
    try {
      await db.query(
        `UPDATE users 
         SET google_id = $1, 
             google_email = $2,
             auth_provider = CASE 
               WHEN auth_provider = 'email' THEN 'google'
               ELSE auth_provider 
             END,
             avatar_url = COALESCE(avatar_url, $3),
             is_email_verified = CASE 
               WHEN is_email_verified = false THEN $4 
               ELSE is_email_verified 
             END,
             updated_at = NOW()
         WHERE id = $5`,
        [googleUser.sub, googleUser.email, googleUser.picture, googleUser.email_verified, userId]
      );

      logger.info('Linked Google account to existing user:', { userId });
    } catch (error) {
      logger.error('Error linking Google account:', error);
      throw new ApiError(500, 'Failed to link Google account');
    }
  }

  /**
   * Update user information from Google
   */
  private async updateUserFromGoogle(userId: string, googleUser: GoogleUserInfo): Promise<void> {
    try {
      await db.query(
        `UPDATE users 
         SET avatar_url = COALESCE($1, avatar_url),
             is_email_verified = CASE 
               WHEN is_email_verified = false THEN $2 
               ELSE is_email_verified 
             END,
             last_login_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [googleUser.picture, googleUser.email_verified, userId]
      );
    } catch (error) {
      logger.error('Error updating user from Google:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Sync user with Supabase
   */
  private async syncWithSupabase(user: any, googleUser: GoogleUserInfo): Promise<void> {
    if (!this.supabaseClient) return;

    try {
      // Check if user exists in Supabase
      const { data: supabaseUser } = await this.supabaseClient.auth.admin.getUserById(
        user.id
      );

      if (!supabaseUser) {
        // Create user in Supabase
        await this.supabaseClient.auth.admin.createUser({
          id: user.id,
          email: user.email,
          email_confirm: googleUser.email_verified,
          user_metadata: {
            name: user.name,
            avatar_url: user.avatar_url,
            provider: 'google',
            google_id: googleUser.sub,
          },
        });
      } else {
        // Update user metadata in Supabase
        await this.supabaseClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...supabaseUser.user_metadata,
            google_id: googleUser.sub,
            last_sign_in_provider: 'google',
          },
        });
      }
    } catch (error) {
      logger.error('Error syncing with Supabase:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Generate JWT tokens for authenticated user
   */
  private async generateTokens(
    user: any,
    deviceInfo?: any
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const { generateTokens } = await import('../../middleware/auth');
    
    // Create mock request object for token generation
    const mockReq = {
      headers: {
        'user-agent': deviceInfo?.deviceName || 'Google Auth',
      },
      ip: '127.0.0.1',
    };

    const tokens = generateTokens(user.id, user.email, user.role, mockReq as any);

    // Store refresh token in Redis with device info
    const refreshTokenKey = `refresh_token:${user.id}`;
    const refreshTokenData = {
      token: tokens.refreshToken,
      deviceInfo,
      createdAt: new Date().toISOString(),
    };

    await redis.setEx(
      refreshTokenKey,
      30 * 24 * 60 * 60, // 30 days
      JSON.stringify(refreshTokenData)
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600, // 1 hour
    };
  }

  /**
   * Log authentication event for audit
   */
  private async logAuthEvent(
    userId: string,
    eventType: string,
    platform: string,
    deviceInfo?: any
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO auth_events (
          user_id, event_type, platform, device_info, 
          ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          userId,
          eventType,
          platform,
          deviceInfo ? JSON.stringify(deviceInfo) : null,
          deviceInfo?.ipAddress || null,
        ]
      );
    } catch (error) {
      logger.error('Error logging auth event:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const { verifyRefreshToken } = await import('../../middleware/auth');
      
      // Verify the refresh token
      const { userId } = verifyRefreshToken(refreshToken);

      // Get user from database
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new ApiError(401, 'User not found or inactive');
      }

      const user = result.rows[0];

      // Check if refresh token exists in Redis
      const storedTokenData = await redis.get(`refresh_token:${userId}`);
      if (!storedTokenData) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      const tokenData = JSON.parse(storedTokenData);
      if (tokenData.token !== refreshToken) {
        throw new ApiError(401, 'Token mismatch');
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(user, tokenData.deviceInfo);

      // Log token refresh event
      await this.logAuthEvent(userId, 'token_refresh', 'api', tokenData.deviceInfo);

      return newTokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(userId: string): Promise<{
    valid: boolean;
    user?: any;
  }> {
    try {
      // Check if user exists and is active
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (result.rows.length === 0) {
        return { valid: false };
      }

      const user = result.rows[0];

      // Check if refresh token exists in Redis
      const refreshTokenExists = await redis.exists(`refresh_token:${userId}`);
      
      if (!refreshTokenExists) {
        return { valid: false };
      }

      return {
        valid: true,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      logger.error('Session validation failed:', error);
      return { valid: false };
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllTokens(userId: string): Promise<void> {
    try {
      // Remove all refresh tokens from Redis
      await redis.del(`refresh_token:${userId}`);
      
      // Log revocation event
      await this.logAuthEvent(userId, 'tokens_revoked', 'api');
      
      logger.info('All tokens revoked for user:', { userId });
    } catch (error) {
      logger.error('Error revoking tokens:', error);
      throw new ApiError(500, 'Failed to revoke tokens');
    }
  }

  /**
   * Verify Google access token (for compatibility with older tests)
   */
  async verifyAccessToken(accessToken: string): Promise<GoogleUserInfo> {
    try {
      // Use the access token to get user info from Google API
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new Error('Invalid access token');
      }

      const userData = await response.json();
      
      return {
        sub: userData.id,
        email: userData.email,
        email_verified: userData.verified_email || false,
        name: userData.name || '',
        given_name: userData.given_name,
        family_name: userData.family_name,
        picture: userData.picture,
        locale: userData.locale,
      };
    } catch (error) {
      logger.error('Access token verification failed:', error);
      throw new ApiError(401, 'Invalid access token');
    }
  }

  /**
   * Generate OAuth state for CSRF protection
   */
  generateOAuthState(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate OAuth state
   */
  validateOAuthState(state: string, storedState: string): boolean {
    return state === storedState;
  }

  /**
   * Sanitize user object for response
   */
  private sanitizeUser(user: any): any {
    const { password_hash, ...sanitized } = user;
    return {
      ...sanitized,
      preferences: typeof user.preferences === 'string' 
        ? JSON.parse(user.preferences) 
        : user.preferences,
    };
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();