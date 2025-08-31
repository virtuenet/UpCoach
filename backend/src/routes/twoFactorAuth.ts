/**
 * Two-Factor Authentication Routes
 */

import { Router } from 'express';
import TwoFactorAuthController from '../controllers/TwoFactorAuthController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();

// Get 2FA status
router.get(
  '/status',
  authenticate,
  TwoFactorAuthController.get2FAStatus.bind(TwoFactorAuthController)
);

// TOTP endpoints
router.post(
  '/totp/setup',
  authenticate,
  TwoFactorAuthController.setupTOTP.bind(TwoFactorAuthController)
);

router.post(
  '/totp/enable',
  authenticate,
  [body('token').isString().isLength({ min: 6, max: 6 }).withMessage('Invalid token format')],
  validateRequest,
  TwoFactorAuthController.verifyAndEnableTOTP.bind(TwoFactorAuthController)
);

router.post(
  '/totp/verify',
  [
    body('userId').isUUID().withMessage('Invalid user ID'),
    body('token').isString().isLength({ min: 6, max: 8 }).withMessage('Invalid token format'),
    body('trustDevice').optional().isBoolean(),
    body('deviceName').optional().isString().trim(),
  ],
  validateRequest,
  TwoFactorAuthController.verifyTOTP.bind(TwoFactorAuthController)
);

// Disable 2FA
router.post(
  '/disable',
  authenticate,
  [
    body('password').isString().notEmpty().withMessage('Password is required'),
    body('token').isString().isLength({ min: 6, max: 8 }).withMessage('Invalid token format'),
  ],
  validateRequest,
  TwoFactorAuthController.disable2FA.bind(TwoFactorAuthController)
);

// Backup codes
router.post(
  '/backup-codes/regenerate',
  authenticate,
  [body('token').isString().isLength({ min: 6, max: 8 }).withMessage('Invalid token format')],
  validateRequest,
  TwoFactorAuthController.regenerateBackupCodes.bind(TwoFactorAuthController)
);

// Trusted devices
router.get(
  '/trusted-devices',
  authenticate,
  TwoFactorAuthController.getTrustedDevices.bind(TwoFactorAuthController)
);

router.delete(
  '/trusted-devices/:deviceId',
  authenticate,
  [param('deviceId').isString().notEmpty().withMessage('Invalid device ID')],
  validateRequest,
  TwoFactorAuthController.removeTrustedDevice.bind(TwoFactorAuthController)
);

// WebAuthn endpoints
router.post(
  '/webauthn/register/start',
  authenticate,
  TwoFactorAuthController.startWebAuthnRegistration.bind(TwoFactorAuthController)
);

router.post(
  '/webauthn/register/verify',
  authenticate,
  [
    body('response').isObject().withMessage('Invalid response format'),
    body('name').optional().isString().trim(),
  ],
  validateRequest,
  TwoFactorAuthController.verifyWebAuthnRegistration.bind(TwoFactorAuthController)
);

router.post(
  '/webauthn/authenticate/start',
  [body('userId').optional().isUUID().withMessage('Invalid user ID')],
  validateRequest,
  TwoFactorAuthController.startWebAuthnAuthentication.bind(TwoFactorAuthController)
);

router.post(
  '/webauthn/authenticate/verify',
  [
    body('response').isObject().withMessage('Invalid response format'),
    body('userId').optional().isUUID().withMessage('Invalid user ID'),
  ],
  validateRequest,
  TwoFactorAuthController.verifyWebAuthnAuthentication.bind(TwoFactorAuthController)
);

router.get(
  '/webauthn/credentials',
  authenticate,
  TwoFactorAuthController.listWebAuthnCredentials.bind(TwoFactorAuthController)
);

router.delete(
  '/webauthn/credentials/:credentialId',
  authenticate,
  [param('credentialId').isString().notEmpty().withMessage('Invalid credential ID')],
  validateRequest,
  TwoFactorAuthController.deleteWebAuthnCredential.bind(TwoFactorAuthController)
);

router.patch(
  '/webauthn/credentials/:credentialId',
  authenticate,
  [
    param('credentialId').isString().notEmpty().withMessage('Invalid credential ID'),
    body('name').isString().trim().notEmpty().withMessage('Name is required'),
  ],
  validateRequest,
  TwoFactorAuthController.renameWebAuthnCredential.bind(TwoFactorAuthController)
);

export default router;
