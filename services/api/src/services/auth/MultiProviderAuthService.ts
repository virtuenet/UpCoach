import { googleAuthService } from './GoogleAuthService';
import { secureGoogleAuthService } from './SecureGoogleAuthService';
import { appleAuthService } from './AppleAuthService';
import { facebookAuthService } from './FacebookAuthService';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';
import { redis } from '../redis';
import { db } from '../database';

type AuthProvider = 'google' | 'apple' | 'facebook';

interface UnifiedAuthRequest {
  provider: AuthProvider;
  platform: 'mobile' | 'web';
  credentials: {
    // Google/Apple
    idToken?: string;
    // Apple
    authorizationCode?: string;
    user?: {
      name?: {
        firstName: string;
        lastName: string;
      };
      email?: string;
    };
    // Facebook
    accessToken?: string;
    permissions?: string[];
  };
  deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  nonce?: string;
  securityLevel?: 'standard' | 'enhanced';
}

interface UnifiedAuthResponse {
  user: unknown;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  provider: AuthProvider;
  isNewUser: boolean;
  securityEvents?: Array<{
    type: string;
    timestamp: string;
    details: unknown;
  }>;
  accountsLinked?: AuthProvider[];
}

interface ProviderCapabilities {
  emailVerification: boolean;
  realUserValidation: boolean;
  refreshTokenSupport: boolean;
  webhookSupport: boolean;
  securityFeatures: string[];
}

export class MultiProviderAuthService {
  private static instance: MultiProviderAuthService;
  private readonly PROVIDER_CAPABILITIES: Record<AuthProvider, ProviderCapabilities> = {
    google: {
      emailVerification: true,
      realUserValidation: false,
      refreshTokenSupport: true,
      webhookSupport: false,
      securityFeatures: ['PKCE', 'nonce', 'state', 'hosted_domain'],
    },
    apple: {
      emailVerification: true,
      realUserValidation: true,
      refreshTokenSupport: true,
      webhookSupport: false,
      securityFeatures: ['PKCE', 'nonce', 'real_user_status'],
    },
    facebook: {
      emailVerification: false,
      realUserValidation: false,
      refreshTokenSupport: true,
      webhookSupport: true,
      securityFeatures: ['webhook_verification', 'long_lived_tokens'],
    },
  };

  private constructor() {}

  static getInstance(): MultiProviderAuthService {
    if (!MultiProviderAuthService.instance) {
      MultiProviderAuthService.instance = new MultiProviderAuthService();
    }
    return MultiProviderAuthService.instance;
  }

  /**
   * Unified authentication across all providers
   */
  async authenticate(request: UnifiedAuthRequest): Promise<UnifiedAuthResponse> {
    const startTime = process.hrtime.bigint();

    try {
      // Validate request
      this.validateAuthRequest(request);

      // Check provider-specific rate limits
      await this.checkProviderRateLimit(request.provider, request.deviceInfo?.ipAddress);

      // Route to appropriate provider service
      let authResult;
      switch (request.provider) {
        case 'google':
          authResult = await this.authenticateWithGoogle(request);
          break;
        case 'apple':
          authResult = await this.authenticateWithApple(request);
          break;
        case 'facebook':
          authResult = await this.authenticateWithFacebook(request);
          break;
        default:
          throw new ApiError(400, `Unsupported authentication provider: ${request.provider}`);
      }

      // Check for linked accounts across providers
      const linkedAccounts = await this.getLinkedAccounts(authResult.user.id);

      // Log unified authentication event
      await this.logUnifiedAuthEvent(authResult.user.id, request.provider, {
        platform: request.platform,
        isNewUser: authResult.isNewUser,
        linkedAccounts,
        securityLevel: request.securityLevel || 'standard',
        deviceInfo: request.deviceInfo,
      });

      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;

      logger.info('Unified authentication completed', {
        provider: request.provider,
        userId: authResult.user.id,
        platform: request.platform,
        isNewUser: authResult.isNewUser,
        linkedAccountsCount: linkedAccounts.length,
        processingTime: `${totalTime.toFixed(2)}ms`,
      });

      return {
        ...authResult,
        provider: request.provider,
        accountsLinked: linkedAccounts,
      };

    } catch (error) {
      // Log authentication failure
      await this.logUnifiedAuthEvent(null, request.provider, {
        platform: request.platform,
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceInfo: request.deviceInfo,
        success: false,
      });

      logger.error('Unified authentication failed:', {
        provider: request.provider,
        platform: request.platform,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Provider-specific authentication methods
   */
  private async authenticateWithGoogle(request: UnifiedAuthRequest): Promise<unknown> {
    if (!request.credentials.idToken) {
      throw new ApiError(400, 'Google ID token is required');
    }

    const service = request.securityLevel === 'enhanced'
      ? secureGoogleAuthService
      : googleAuthService;

    if (request.securityLevel === 'enhanced') {
      return service.signIn({
        idToken: request.credentials.idToken,
        platform: request.platform,
        deviceInfo: request.deviceInfo,
        nonce: request.nonce,
      });
    } else {
      return service.signIn(
        request.credentials.idToken,
        request.platform,
        request.deviceInfo
      );
    }
  }

  private async authenticateWithApple(request: UnifiedAuthRequest): Promise<unknown> {
    if (!request.credentials.idToken) {
      throw new ApiError(400, 'Apple identity token is required');
    }

    return appleAuthService.signIn({
      identityToken: request.credentials.idToken,
      authorizationCode: request.credentials.authorizationCode,
      user: request.credentials.user,
      platform: request.platform,
      deviceInfo: request.deviceInfo,
      nonce: request.nonce,
    });
  }

  private async authenticateWithFacebook(request: UnifiedAuthRequest): Promise<unknown> {
    if (!request.credentials.accessToken) {
      throw new ApiError(400, 'Facebook access token is required');
    }

    return facebookAuthService.signIn({
      accessToken: request.credentials.accessToken,
      platform: request.platform,
      deviceInfo: request.deviceInfo,
      permissions: request.credentials.permissions,
    });
  }

  /**
   * Link multiple authentication providers to same user account
   */
  async linkProvider(
    userId: string,
    provider: AuthProvider,
    credentials: UnifiedAuthRequest['credentials'],
    platform: 'mobile' | 'web' = 'web'
  ): Promise<{
    success: boolean;
    linkedProvider: AuthProvider;
    accountsLinked: AuthProvider[];
  }> {
    try {
      // Get existing user
      const user = await this.getUserById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check if provider is already linked
      if (await this.isProviderLinked(userId, provider)) {
        throw new ApiError(409, `${provider} account is already linked to this user`);
      }

      // Verify provider credentials
      let providerUserId: string;
      let providerEmail: string | undefined;

      switch (provider) {
        case 'google':
          const googleResult = await googleAuthService.verifyIdToken(
            credentials.idToken!,
            platform
          );
          providerUserId = googleResult.sub;
          providerEmail = googleResult.email;
          break;

        case 'apple':
          const appleResult = await appleAuthService.verifyIdentityToken(
            credentials.idToken!,
            platform
          );
          providerUserId = appleResult.sub;
          providerEmail = appleResult.email;
          break;

        case 'facebook':
          const facebookTokenValidation = await facebookAuthService.validateAccessToken(
            credentials.accessToken!
          );
          const facebookUser = await facebookAuthService.getUserInfo(credentials.accessToken!);
          providerUserId = facebookUser.id;
          providerEmail = facebookUser.email;
          break;

        default:
          throw new ApiError(400, `Unsupported provider for linking: ${provider}`);
      }

      // Validate email match if both accounts have emails
      if (user.email && providerEmail &&
          user.email.toLowerCase() !== providerEmail.toLowerCase()) {
        throw new ApiError(403, 'Email addresses do not match between accounts');
      }

      // Check if this provider account is already linked to another user
      const existingUserWithProvider = await this.findUserByProviderId(provider, providerUserId);
      if (existingUserWithProvider && existingUserWithProvider.id !== userId) {
        throw new ApiError(409, `This ${provider} account is already linked to another user`);
      }

      // Link the provider account
      await this.linkProviderToUser(userId, provider, providerUserId, providerEmail);

      // Get updated linked accounts
      const linkedAccounts = await this.getLinkedAccounts(userId);

      // Log linking event
      await this.logUnifiedAuthEvent(userId, provider, {
        action: 'account_linked',
        platform,
        linkedAccounts,
      });

      logger.info('Provider account linked successfully', {
        userId,
        provider,
        providerUserId,
        totalLinkedAccounts: linkedAccounts.length,
      });

      return {
        success: true,
        linkedProvider: provider,
        accountsLinked: linkedAccounts,
      };

    } catch (error) {
      logger.error('Provider linking failed:', {
        userId,
        provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Unlink authentication provider from user account
   */
  async unlinkProvider(
    userId: string,
    provider: AuthProvider
  ): Promise<{
    success: boolean;
    unlinkedProvider: AuthProvider;
    accountsLinked: AuthProvider[];
  }> {
    try {
      // Get user and verify they have other authentication methods
      const user = await this.getUserById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const linkedAccounts = await this.getLinkedAccounts(userId);

      // Ensure user has at least one other authentication method or a password
      if (linkedAccounts.length <= 1 && !user.password_hash) {
        throw new ApiError(400, 'Cannot unlink the only authentication method. Please set a password or link another account first.');
      }

      // Check if provider is actually linked
      if (!linkedAccounts.includes(provider)) {
        throw new ApiError(404, `${provider} account is not linked to this user`);
      }

      // Unlink the provider
      await this.unlinkProviderFromUser(userId, provider);

      // Get updated linked accounts
      const updatedLinkedAccounts = await this.getLinkedAccounts(userId);

      // Log unlinking event
      await this.logUnifiedAuthEvent(userId, provider, {
        action: 'account_unlinked',
        remainingProviders: updatedLinkedAccounts,
      });

      logger.info('Provider account unlinked successfully', {
        userId,
        provider,
        remainingLinkedAccounts: updatedLinkedAccounts.length,
      });

      return {
        success: true,
        unlinkedProvider: provider,
        accountsLinked: updatedLinkedAccounts,
      };

    } catch (error) {
      logger.error('Provider unlinking failed:', {
        userId,
        provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get user's authentication status across all providers
   */
  async getUserAuthStatus(userId: string): Promise<{
    userId: string;
    primaryProvider: AuthProvider | null;
    linkedProviders: Array<{
      provider: AuthProvider;
      linkedAt: string;
      verified: boolean;
      capabilities: ProviderCapabilities;
    }>;
    hasPassword: boolean;
    securityScore: number;
    recommendations: string[];
  }> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const linkedAccounts = await this.getLinkedAccounts(userId);
      const primaryProvider = user.auth_provider as AuthProvider | null;

      // Get detailed provider information
      const linkedProviders = await Promise.all(
        linkedAccounts.map(async (provider) => {
          const linkInfo = await this.getProviderLinkInfo(userId, provider);
          return {
            provider,
            linkedAt: linkInfo.linkedAt,
            verified: linkInfo.verified,
            capabilities: this.PROVIDER_CAPABILITIES[provider],
          };
        })
      );

      // Calculate security score
      const securityScore = this.calculateSecurityScore(user, linkedProviders);

      // Generate security recommendations
      const recommendations = this.generateSecurityRecommendations(user, linkedProviders);

      return {
        userId,
        primaryProvider,
        linkedProviders,
        hasPassword: !!user.password_hash,
        securityScore,
        recommendations,
      };

    } catch (error) {
      logger.error('Failed to get user auth status:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(provider?: AuthProvider): ProviderCapabilities | Record<AuthProvider, ProviderCapabilities> {
    if (provider) {
      return this.PROVIDER_CAPABILITIES[provider];
    }
    return this.PROVIDER_CAPABILITIES;
  }

  /**
   * Handle provider webhook events
   */
  async handleProviderWebhook(
    provider: AuthProvider,
    event: string,
    payload: unknown,
    signature?: string
  ): Promise<{ success: boolean; processed: boolean }> {
    try {
      let processed = false;

      switch (provider) {
        case 'facebook':
          if (signature) {
            const isValid = facebookAuthService.verifyWebhookSignature(
              JSON.stringify(payload),
              signature
            );
            if (!isValid) {
              throw new ApiError(401, 'Invalid Facebook webhook signature');
            }
          }

          if (event === 'deauthorize' && payload.user_id) {
            await facebookAuthService.handleDeauthorization(payload.user_id);
            processed = true;
          }
          break;

        default:
          logger.warn('Webhook not supported for provider', { provider, event });
          break;
      }

      // Log webhook event
      await this.logUnifiedAuthEvent(null, provider, {
        action: 'webhook_received',
        event,
        processed,
      });

      return { success: true, processed };

    } catch (error) {
      logger.error('Provider webhook handling failed:', {
        provider,
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Utility methods
   */
  private validateAuthRequest(request: UnifiedAuthRequest): void {
    if (!request.provider) {
      throw new ApiError(400, 'Authentication provider is required');
    }

    if (!request.platform) {
      throw new ApiError(400, 'Platform is required');
    }

    if (!request.credentials) {
      throw new ApiError(400, 'Provider credentials are required');
    }

    // Provider-specific validations
    switch (request.provider) {
      case 'google':
      case 'apple':
        if (!request.credentials.idToken) {
          throw new ApiError(400, `${request.provider} ID token is required`);
        }
        break;
      case 'facebook':
        if (!request.credentials.accessToken) {
          throw new ApiError(400, 'Facebook access token is required');
        }
        break;
    }
  }

  private async checkProviderRateLimit(provider: AuthProvider, ipAddress?: string): Promise<void> {
    const rateLimitKey = `multi_provider_auth:${provider}:${ipAddress || 'unknown'}`;
    const attempts = await redis.incr(rateLimitKey);

    if (attempts === 1) {
      await redis.expire(rateLimitKey, 300); // 5 minutes window
    }

    const limits = {
      google: 10,
      apple: 8,
      facebook: 6,
    };

    if (attempts > limits[provider]) {
      throw new ApiError(
        429,
        `Too many ${provider} authentication attempts. Please try again later.`
      );
    }
  }

  private async getUserById(userId: string): Promise<unknown> {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      return null;
    }
  }

  private async getLinkedAccounts(userId: string): Promise<AuthProvider[]> {
    try {
      const result = await db.query(
        `SELECT google_id, apple_id, facebook_id FROM users WHERE id = $1`,
        [userId]
      );

      if (!result.rows[0]) {
        return [];
      }

      const user = result.rows[0];
      const linked: AuthProvider[] = [];

      if (user.google_id) linked.push('google');
      if (user.apple_id) linked.push('apple');
      if (user.facebook_id) linked.push('facebook');

      return linked;
    } catch (error) {
      logger.error('Error getting linked accounts:', error);
      return [];
    }
  }

  private async isProviderLinked(userId: string, provider: AuthProvider): Promise<boolean> {
    const linkedAccounts = await this.getLinkedAccounts(userId);
    return linkedAccounts.includes(provider);
  }

  private async findUserByProviderId(provider: AuthProvider, providerId: string): Promise<unknown> {
    try {
      const column = `${provider}_id`;
      const result = await db.query(
        `SELECT * FROM users WHERE ${column} = $1`,
        [providerId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by provider ID:', error);
      return null;
    }
  }

  private async linkProviderToUser(
    userId: string,
    provider: AuthProvider,
    providerId: string,
    email?: string
  ): Promise<void> {
    try {
      const column = `${provider}_id`;
      await db.query(
        `UPDATE users SET ${column} = $1, updated_at = NOW() WHERE id = $2`,
        [providerId, userId]
      );
    } catch (error) {
      logger.error('Error linking provider to user:', error);
      throw new ApiError(500, 'Failed to link provider account');
    }
  }

  private async unlinkProviderFromUser(userId: string, provider: AuthProvider): Promise<void> {
    try {
      const column = `${provider}_id`;
      await db.query(
        `UPDATE users SET ${column} = NULL, updated_at = NOW() WHERE id = $1`,
        [userId]
      );
    } catch (error) {
      logger.error('Error unlinking provider from user:', error);
      throw new ApiError(500, 'Failed to unlink provider account');
    }
  }

  private async getProviderLinkInfo(userId: string, provider: AuthProvider): Promise<{
    linkedAt: string;
    verified: boolean;
  }> {
    try {
      // This would require additional columns in the database to track linking timestamps
      // For now, we'll use created_at as a fallback
      const result = await db.query(
        'SELECT created_at, email_verified FROM users WHERE id = $1',
        [userId]
      );

      const user = result.rows[0];
      return {
        linkedAt: user?.created_at || new Date().toISOString(),
        verified: user?.email_verified || false,
      };
    } catch (error) {
      logger.error('Error getting provider link info:', error);
      return {
        linkedAt: new Date().toISOString(),
        verified: false,
      };
    }
  }

  private calculateSecurityScore(user: unknown, linkedProviders: unknown[]): number {
    let score = 0;

    // Base score for having an account
    score += 20;

    // Email verification
    if (user.email_verified) score += 15;

    // Password set
    if (user.password_hash) score += 15;

    // Multiple providers linked
    score += Math.min(linkedProviders.length * 10, 30);

    // Provider-specific security features
    for (const provider of linkedProviders) {
      if (provider.capabilities.realUserValidation) score += 5;
      if (provider.capabilities.emailVerification) score += 5;
      score += provider.capabilities.securityFeatures.length * 2;
    }

    return Math.min(score, 100);
  }

  private generateSecurityRecommendations(user: unknown, linkedProviders: unknown[]): string[] {
    const recommendations: string[] = [];

    if (!user.email_verified) {
      recommendations.push('Verify your email address to improve account security');
    }

    if (!user.password_hash) {
      recommendations.push('Set a password as a backup authentication method');
    }

    if (linkedProviders.length < 2) {
      recommendations.push('Link additional authentication providers for better security');
    }

    const hasRealUserValidation = linkedProviders.some(p => p.capabilities.realUserValidation);
    if (!hasRealUserValidation) {
      recommendations.push('Consider linking Apple Sign-In for enhanced user verification');
    }

    if (linkedProviders.length === 1 && !user.password_hash) {
      recommendations.push('Add a backup authentication method to prevent account lockout');
    }

    return recommendations;
  }

  private async logUnifiedAuthEvent(
    userId: string | null,
    provider: AuthProvider,
    details: unknown
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO security_events (
          user_id, event_type, platform, details,
          ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          userId,
          `multi_provider_auth_${provider}`,
          details.platform || 'unknown',
          JSON.stringify(details),
          details.deviceInfo?.ipAddress || null,
          details.deviceInfo?.userAgent || null,
        ]
      );
    } catch (error) {
      logger.error('Error logging unified auth event:', error);
    }
  }
}

// Export singleton instance
export const multiProviderAuthService = MultiProviderAuthService.getInstance();