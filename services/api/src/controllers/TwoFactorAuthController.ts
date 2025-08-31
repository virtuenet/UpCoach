/**
 * Two-Factor Authentication Controller
 * Handles TOTP and WebAuthn authentication endpoints
 */

import { Request, Response } from 'express';
import { twoFactorAuthService } from '../services/TwoFactorAuthService';
import { webAuthnService } from '../services/WebAuthnService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export class TwoFactorAuthController {
  /**
   * Get 2FA status for current user
   */
  async get2FAStatus(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;

      const [is2FAEnabled, method, config, trustedDevices, webAuthnCredentials, webAuthnStats] =
        await Promise.all([
          twoFactorAuthService.is2FAEnabled(userId),
          twoFactorAuthService.get2FAMethod(userId),
          twoFactorAuthService.get2FAConfig(userId),
          twoFactorAuthService.getTrustedDevices(userId),
          webAuthnService.getUserCredentials(userId),
          webAuthnService.getUserCredentialStats(userId),
        ]);

      _res.json({
        enabled: is2FAEnabled,
        method,
        hasBackupCodes: config?.backupCodes && config.backupCodes.length > 0,
        backupCodesRemaining: config?.backupCodes?.length || 0,
        trustedDevices: trustedDevices.map(d => ({
          id: d.id,
          name: d.name,
          addedAt: d.addedAt,
          lastUsedAt: d.lastUsedAt,
        })),
        webAuthn: {
          credentials: webAuthnCredentials.map(c => ({
            id: Buffer.from(c.credentialID).toString('base64'),
            name: c.name,
            createdAt: c.createdAt,
            lastUsedAt: c.lastUsedAt,
            backedUp: c.backedUp,
            deviceType: c.deviceType,
          })),
          stats: webAuthnStats,
        },
      });
    } catch (error) {
      logger.error('Error getting 2FA status', error);
      _res.status(500).json({ error: 'Failed to get 2FA status' });
    }
  }

  /**
   * Setup TOTP - Generate secret and QR code
   */
  async setupTOTP(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const email = req.user!.email;

      // Check if already enabled
      const isEnabled = await twoFactorAuthService.is2FAEnabled(userId);
      if (isEnabled) {
        return _res.status(400).json({ error: '2FA is already enabled' });
      }

      const { secret, qrCode, backupCodes } = await twoFactorAuthService.generateTOTPSecret(
        userId,
        email
      );

      _res.json({
        secret: secret.base32,
        qrCode,
        backupCodes,
        message: 'Scan the QR code with your authenticator app and verify with a code',
      });
    } catch (error) {
      logger.error('Error setting up TOTP', error);
      _res.status(500).json({ error: 'Failed to setup 2FA' });
    }
  }

  /**
   * Verify TOTP and enable 2FA
   */
  async verifyAndEnableTOTP(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      if (!token) {
        return _res.status(400).json({ error: 'Verification code is required' });
      }

      const { success, backupCodes } = await twoFactorAuthService.verifyAndEnableTOTP(
        userId,
        token
      );

      if (!success) {
        return _res.status(400).json({ error: 'Invalid verification code' });
      }

      _res.json({
        success: true,
        backupCodes,
        message: '2FA has been enabled successfully. Save your backup codes securely.',
      });
    } catch (error) {
      logger.error('Error verifying TOTP', error);
      _res.status(500).json({ error: 'Failed to enable 2FA' });
    }
  }

  /**
   * Verify TOTP token for login
   */
  async verifyTOTP(req: Request, _res: Response) {
    try {
      const { userId, token } = req.body;

      if (!userId || !token) {
        return _res.status(400).json({ error: 'User ID and token are required' });
      }

      // Check rate limit
      const canAttempt = await twoFactorAuthService.check2FARateLimit(userId);
      if (!canAttempt) {
        return _res.status(429).json({ error: 'Too many attempts. Please try again later.' });
      }

      const verified = await twoFactorAuthService.verifyTOTP(userId, token);

      if (verified) {
        await twoFactorAuthService.clear2FARateLimit(userId);

        // Check device trust
        const { trustDevice, deviceName } = req.body;
        if (trustDevice && deviceName) {
          const fingerprint = twoFactorAuthService.generateDeviceFingerprint(
            req.get('user-agent') || '',
            req.ip || 'unknown',
            req.get('accept-language') || 'en'
          );

          await twoFactorAuthService.addTrustedDevice(userId, {
            name: deviceName,
            fingerprint,
            userAgent: req.get('user-agent') || '',
            ipAddress: req.ip || 'unknown',
          });
        }

        _res.json({
          success: true,
          message: '2FA verification successful',
        });
      } else {
        _res.status(400).json({ error: 'Invalid verification code' });
      }
    } catch (error) {
      logger.error('Error verifying TOTP', error);
      _res.status(500).json({ error: 'Verification failed' });
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const { password: _password, token } = req.body;

      // Verify password first
      // TODO: Verify user password

      // Verify current 2FA token
      const verified = await twoFactorAuthService.verifyTOTP(userId, token);
      if (!verified) {
        return _res.status(400).json({ error: 'Invalid verification code' });
      }

      await twoFactorAuthService.disable2FA(userId);

      _res.json({
        success: true,
        message: '2FA has been disabled',
      });
    } catch (error) {
      logger.error('Error disabling 2FA', error);
      _res.status(500).json({ error: 'Failed to disable 2FA' });
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      // Verify current 2FA token
      const verified = await twoFactorAuthService.verifyTOTP(userId, token);
      if (!verified) {
        return _res.status(400).json({ error: 'Invalid verification code' });
      }

      const backupCodes = await twoFactorAuthService.regenerateBackupCodes(userId);

      _res.json({
        backupCodes,
        message: 'New backup codes generated. Save them securely.',
      });
    } catch (error) {
      logger.error('Error regenerating backup codes', error);
      _res.status(500).json({ error: 'Failed to regenerate backup codes' });
    }
  }

  /**
   * Manage trusted devices
   */
  async getTrustedDevices(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const devices = await twoFactorAuthService.getTrustedDevices(userId);

      _res.json({ devices });
    } catch (error) {
      logger.error('Error getting trusted devices', error);
      _res.status(500).json({ error: 'Failed to get trusted devices' });
    }
  }

  /**
   * Remove trusted device
   */
  async removeTrustedDevice(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const { deviceId } = req.params;

      await twoFactorAuthService.removeTrustedDevice(userId, deviceId);

      _res.json({
        success: true,
        message: 'Device removed successfully',
      });
    } catch (error) {
      logger.error('Error removing trusted device', error);
      _res.status(500).json({ error: 'Failed to remove device' });
    }
  }

  /**
   * WebAuthn - Start registration
   */
  async startWebAuthnRegistration(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const userName = req.user!.email;
      const userDisplayName = req.user!.name || req.user!.email;

      const options = await webAuthnService.generateRegistrationOptions(
        userId,
        userName,
        userDisplayName
      );

      _res.json(options);
    } catch (error) {
      logger.error('Error starting WebAuthn registration', error);
      _res.status(500).json({ error: 'Failed to start registration' });
    }
  }

  /**
   * WebAuthn - Verify registration
   */
  async verifyWebAuthnRegistration(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const { response, name } = req.body;

      const { verified, credentialId } = await webAuthnService.verifyRegistrationResponse(
        userId,
        response,
        name
      );

      if (verified) {
        _res.json({
          verified: true,
          credentialId,
          message: 'Passkey registered successfully',
        });
      } else {
        _res.status(400).json({ error: 'Registration verification failed' });
      }
    } catch (error) {
      logger.error('Error verifying WebAuthn registration', error);
      _res.status(500).json({ error: 'Failed to verify registration' });
    }
  }

  /**
   * WebAuthn - Start authentication
   */
  async startWebAuthnAuthentication(req: Request, _res: Response) {
    try {
      const { userId } = req.body; // Optional, for username-less auth
      const options = await webAuthnService.generateAuthenticationOptions(userId);

      _res.json(options);
    } catch (error) {
      logger.error('Error starting WebAuthn authentication', error);
      _res.status(500).json({ error: 'Failed to start authentication' });
    }
  }

  /**
   * WebAuthn - Verify authentication
   */
  async verifyWebAuthnAuthentication(req: Request, _res: Response) {
    try {
      const { response, userId } = req.body;

      const result = await webAuthnService.verifyAuthenticationResponse(response, userId);

      if (result.verified) {
        _res.json({
          verified: true,
          userId: result.userId,
          message: 'Authentication successful',
        });
      } else {
        _res.status(400).json({ error: 'Authentication verification failed' });
      }
    } catch (error) {
      logger.error('Error verifying WebAuthn authentication', error);
      _res.status(500).json({ error: 'Failed to verify authentication' });
    }
  }

  /**
   * WebAuthn - List credentials
   */
  async listWebAuthnCredentials(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const credentials = await webAuthnService.getUserCredentials(userId);
      const stats = await webAuthnService.getUserCredentialStats(userId);

      _res.json({
        credentials: credentials.map(c => ({
          id: Buffer.from(c.credentialID).toString('base64'),
          name: c.name,
          createdAt: c.createdAt,
          lastUsedAt: c.lastUsedAt,
          backedUp: c.backedUp,
          deviceType: c.deviceType,
        })),
        stats,
      });
    } catch (error) {
      logger.error('Error listing WebAuthn credentials', error);
      _res.status(500).json({ error: 'Failed to list credentials' });
    }
  }

  /**
   * WebAuthn - Delete credential
   */
  async deleteWebAuthnCredential(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const { credentialId } = req.params;

      await webAuthnService.deleteCredential(userId, credentialId);

      _res.json({
        success: true,
        message: 'Credential deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting WebAuthn credential', error);
      _res.status(500).json({ error: 'Failed to delete credential' });
    }
  }

  /**
   * WebAuthn - Rename credential
   */
  async renameWebAuthnCredential(req: AuthenticatedRequest, _res: Response) {
    try {
      const userId = req.user!.id;
      const { credentialId } = req.params;
      const { name } = req.body;

      await webAuthnService.renameCredential(userId, credentialId, name);

      _res.json({
        success: true,
        message: 'Credential renamed successfully',
      });
    } catch (error) {
      logger.error('Error renaming WebAuthn credential', error);
      _res.status(500).json({ error: 'Failed to rename credential' });
    }
  }
}

export default new TwoFactorAuthController();
