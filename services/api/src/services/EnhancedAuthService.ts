import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { redis } from './redis';
import { User } from '../models/User';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
  deviceId: string;
  jti: string;
  family?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  family: string;
}

interface DeviceFingerprint {
  userAgent: string;
  ip: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
}

export class EnhancedAuthService {
  private static readonly ACCESS_TOKEN_TTL = '1h';
  private static readonly REFRESH_TOKEN_TTL = '24h';
  private static readonly TOKEN_FAMILY_PREFIX = 'token_family:';
  private static readonly REVOKED_TOKENS_PREFIX = 'revoked_tokens:';
  private static readonly MAX_REFRESH_CHAIN_LENGTH = 10;

  /**
   * Generate a hash of the device fingerprint for consistent device identification
   */
  private static hashDeviceFingerprint(fingerprint: DeviceFingerprint): string {
    const data = `${fingerprint.userAgent}|${fingerprint.ip}|${fingerprint.acceptLanguage || ''}|${fingerprint.acceptEncoding || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a new token pair with rotation tracking
   */
  static async generateTokenPair(
    userId: string,
    deviceFingerprint: DeviceFingerprint
  ): Promise<TokenPair> {
    const family = uuidv4();
    const deviceId = this.hashDeviceFingerprint(deviceFingerprint);
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    // Generate access token
    const accessToken = jwt.sign(
      {
        userId,
        type: 'access',
        deviceId,
        jti: accessJti,
      } as TokenPayload,
      config.jwt.secret,
      {
        expiresIn: this.ACCESS_TOKEN_TTL,
        issuer: 'upcoach-api',
        audience: 'upcoach-client',
      }
    );

    // Generate refresh token with family tracking
    const refreshToken = jwt.sign(
      {
        userId,
        type: 'refresh',
        deviceId,
        family,
        jti: refreshJti,
      } as TokenPayload,
      config.jwt.refreshSecret || config.jwt.secret,
      {
        expiresIn: this.REFRESH_TOKEN_TTL,
        issuer: 'upcoach-api',
        audience: 'upcoach-client',
      }
    );

    // Store token family in Redis for tracking
    await this.storeTokenFamily(family, refreshJti, userId);

    // Log authentication event
    logger.info('Token pair generated', {
      userId,
      family,
      deviceId: deviceId.substring(0, 8), // Log only first 8 chars for privacy
    });

    return { accessToken, refreshToken, family };
  }

  /**
   * Rotate refresh token with security checks
   */
  static async rotateRefreshToken(
    oldRefreshToken: string,
    deviceFingerprint: DeviceFingerprint
  ): Promise<TokenPair | null> {
    try {
      // Verify the old refresh token
      const decoded = jwt.verify(
        oldRefreshToken,
        config.jwt.refreshSecret || config.jwt.secret
      ) as TokenPayload;

      const { userId, family, jti: oldJti, deviceId } = decoded;

      // Verify device fingerprint matches
      const currentDeviceId = this.hashDeviceFingerprint(deviceFingerprint);
      if (deviceId !== currentDeviceId) {
        logger.warn('Device fingerprint mismatch during token rotation', {
          userId,
          family,
          expectedDevice: deviceId.substring(0, 8),
          actualDevice: currentDeviceId.substring(0, 8),
        });

        // Potential token theft - invalidate entire family
        await this.invalidateTokenFamily(family!);
        return null;
      }

      // Check if token is in the valid family chain
      const isValidFamily = await this.validateTokenFamily(family!, oldJti);
      if (!isValidFamily) {
        logger.warn('Invalid token family detected', { userId, family });
        await this.invalidateTokenFamily(family!);
        return null;
      }

      // Check if token has been revoked
      const isRevoked = await this.isTokenRevoked(oldJti);
      if (isRevoked) {
        logger.warn('Attempted use of revoked token', { userId, jti: oldJti });
        return null;
      }

      // Generate new token pair
      const newAccessJti = uuidv4();
      const newRefreshJti = uuidv4();

      const accessToken = jwt.sign(
        {
          userId,
          type: 'access',
          deviceId,
          jti: newAccessJti,
        } as TokenPayload,
        config.jwt.secret,
        {
          expiresIn: this.ACCESS_TOKEN_TTL,
          issuer: 'upcoach-api',
          audience: 'upcoach-client',
        }
      );

      const refreshToken = jwt.sign(
        {
          userId,
          type: 'refresh',
          deviceId,
          family,
          jti: newRefreshJti,
        } as TokenPayload,
        config.jwt.refreshSecret || config.jwt.secret,
        {
          expiresIn: this.REFRESH_TOKEN_TTL,
          issuer: 'upcoach-api',
          audience: 'upcoach-client',
        }
      );

      // Update token family chain
      await this.updateTokenFamily(family!, oldJti, newRefreshJti);

      // Revoke the old refresh token
      await this.revokeToken(oldJti);

      logger.info('Token rotated successfully', {
        userId,
        family,
        oldJti: oldJti.substring(0, 8),
        newJti: newRefreshJti.substring(0, 8),
      });

      return { accessToken, refreshToken, family: family! };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Expired refresh token used for rotation');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.error('Invalid refresh token used for rotation', { error });
      } else {
        logger.error('Token rotation error', { error });
      }

      return null;
    }
  }

  /**
   * Validate access token
   */
  static async validateAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'upcoach-api',
        audience: 'upcoach-client',
      }) as TokenPayload;

      // Check if token has been revoked
      const isRevoked = await this.isTokenRevoked(decoded.jti);
      if (isRevoked) {
        logger.warn('Revoked access token used', { jti: decoded.jti });
        return null;
      }

      // Verify token type
      if (decoded.type !== 'access') {
        logger.warn('Invalid token type for access', { type: decoded.type });
        return null;
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid access token', { error });
      }

      return null;
    }
  }

  /**
   * Logout user by invalidating tokens
   */
  static async logout(
    userId: string,
    refreshToken?: string,
    logoutAllDevices: boolean = false
  ): Promise<void> {
    try {
      if (logoutAllDevices) {
        // Invalidate all token families for the user
        await this.invalidateAllUserTokens(userId);
        logger.info('User logged out from all devices', { userId });
      } else if (refreshToken) {
        // Invalidate specific token family
        const decoded = jwt.decode(refreshToken) as TokenPayload;
        if (decoded && decoded.family) {
          await this.invalidateTokenFamily(decoded.family);
          logger.info('User logged out from device', {
            userId,
            family: decoded.family,
          });
        }
      }
    } catch (error) {
      logger.error('Logout error', { userId, error });
      throw error;
    }
  }

  /**
   * Store token family in Redis
   */
  private static async storeTokenFamily(
    family: string,
    jti: string,
    userId: string
  ): Promise<void> {
    const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
    const data = {
      currentJti: jti,
      userId,
      chainLength: 1,
      createdAt: new Date().toISOString(),
      lastRotated: new Date().toISOString(),
    };

    await redis.setEx(
      key,
      24 * 60 * 60, // 24 hours TTL
      JSON.stringify(data)
    );

    // Also maintain a set of active families per user
    await redis.sadd(`user_families:${userId}`, family);
    await redis.expire(`user_families:${userId}`, 24 * 60 * 60);
  }

  /**
   * Update token family chain
   */
  private static async updateTokenFamily(
    family: string,
    oldJti: string,
    newJti: string
  ): Promise<void> {
    const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
    const dataStr = await redis.get(key);

    if (!dataStr) {
      throw new Error('Token family not found');
    }

    const data = JSON.parse(dataStr);

    // Check chain length to prevent infinite chains
    if (data.chainLength >= this.MAX_REFRESH_CHAIN_LENGTH) {
      throw new Error('Max refresh chain length exceeded');
    }

    data.previousJti = oldJti;
    data.currentJti = newJti;
    data.chainLength += 1;
    data.lastRotated = new Date().toISOString();

    await redis.setEx(
      key,
      24 * 60 * 60, // Reset TTL
      JSON.stringify(data)
    );
  }

  /**
   * Validate token family
   */
  private static async validateTokenFamily(family: string, jti: string): Promise<boolean> {
    const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
    const dataStr = await redis.get(key);

    if (!dataStr) {
      return false;
    }

    const data = JSON.parse(dataStr);
    return data.currentJti === jti || data.previousJti === jti;
  }

  /**
   * Invalidate token family
   */
  private static async invalidateTokenFamily(family: string): Promise<void> {
    const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
    const dataStr = await redis.get(key);

    if (dataStr) {
      const data = JSON.parse(dataStr);

      // Revoke all tokens in the family
      if (data.currentJti) {
        await this.revokeToken(data.currentJti);
      }
      if (data.previousJti) {
        await this.revokeToken(data.previousJti);
      }

      // Remove family from user's active families
      if (data.userId) {
        await redis.srem(`user_families:${data.userId}`, family);
      }
    }

    await redis.del(key);
  }

  /**
   * Invalidate all tokens for a user
   */
  private static async invalidateAllUserTokens(userId: string): Promise<void> {
    const families = await redis.smembers(`user_families:${userId}`);

    for (const family of families) {
      await this.invalidateTokenFamily(family);
    }

    await redis.del(`user_families:${userId}`);
  }

  /**
   * Revoke a specific token
   */
  private static async revokeToken(jti: string): Promise<void> {
    const key = `${this.REVOKED_TOKENS_PREFIX}${jti}`;
    await redis.setEx(
      key,
      24 * 60 * 60, // Keep for 24 hours
      '1'
    );
  }

  /**
   * Check if token is revoked
   */
  private static async isTokenRevoked(jti: string): Promise<boolean> {
    const key = `${this.REVOKED_TOKENS_PREFIX}${jti}`;
    const result = await redis.get(key);
    return result === '1';
  }

  /**
   * Clean up expired token data (maintenance task)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      // This should be called periodically (e.g., daily)
      const pattern = `${this.TOKEN_FAMILY_PREFIX}*`;
      const keys = await redis.keys(pattern);

      let cleaned = 0;
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl === -2 || ttl === -1) {
          // Key doesn't exist or has no TTL
          await redis.del(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.info('Cleaned up expired token families', { count: cleaned });
      }
    } catch (error) {
      logger.error('Token cleanup error', { error });
    }
  }
}

// Export for backward compatibility
export default EnhancedAuthService;
