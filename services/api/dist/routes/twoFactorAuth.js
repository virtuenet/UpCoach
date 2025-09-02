"use strict";
/**
 * Two-Factor Authentication Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TwoFactorAuthController_1 = __importDefault(require("../controllers/TwoFactorAuthController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// Get 2FA status
router.get('/status', auth_1.authenticate, TwoFactorAuthController_1.default.get2FAStatus.bind(TwoFactorAuthController_1.default));
// TOTP endpoints
router.post('/totp/setup', auth_1.authenticate, TwoFactorAuthController_1.default.setupTOTP.bind(TwoFactorAuthController_1.default));
router.post('/totp/enable', auth_1.authenticate, [(0, express_validator_1.body)('token').isString().isLength({ min: 6, max: 6 }).withMessage('Invalid token format')], validation_1.validateRequest, TwoFactorAuthController_1.default.verifyAndEnableTOTP.bind(TwoFactorAuthController_1.default));
router.post('/totp/verify', [
    (0, express_validator_1.body)('userId').isUUID().withMessage('Invalid user ID'),
    (0, express_validator_1.body)('token').isString().isLength({ min: 6, max: 8 }).withMessage('Invalid token format'),
    (0, express_validator_1.body)('trustDevice').optional().isBoolean(),
    (0, express_validator_1.body)('deviceName').optional().isString().trim(),
], validation_1.validateRequest, TwoFactorAuthController_1.default.verifyTOTP.bind(TwoFactorAuthController_1.default));
// Disable 2FA
router.post('/disable', auth_1.authenticate, [
    (0, express_validator_1.body)('password').isString().notEmpty().withMessage('Password is required'),
    (0, express_validator_1.body)('token').isString().isLength({ min: 6, max: 8 }).withMessage('Invalid token format'),
], validation_1.validateRequest, TwoFactorAuthController_1.default.disable2FA.bind(TwoFactorAuthController_1.default));
// Backup codes
router.post('/backup-codes/regenerate', auth_1.authenticate, [(0, express_validator_1.body)('token').isString().isLength({ min: 6, max: 8 }).withMessage('Invalid token format')], validation_1.validateRequest, TwoFactorAuthController_1.default.regenerateBackupCodes.bind(TwoFactorAuthController_1.default));
// Trusted devices
router.get('/trusted-devices', auth_1.authenticate, TwoFactorAuthController_1.default.getTrustedDevices.bind(TwoFactorAuthController_1.default));
router.delete('/trusted-devices/:deviceId', auth_1.authenticate, [(0, express_validator_1.param)('deviceId').isString().notEmpty().withMessage('Invalid device ID')], validation_1.validateRequest, TwoFactorAuthController_1.default.removeTrustedDevice.bind(TwoFactorAuthController_1.default));
// WebAuthn endpoints
router.post('/webauthn/register/start', auth_1.authenticate, TwoFactorAuthController_1.default.startWebAuthnRegistration.bind(TwoFactorAuthController_1.default));
router.post('/webauthn/register/verify', auth_1.authenticate, [
    (0, express_validator_1.body)('response').isObject().withMessage('Invalid response format'),
    (0, express_validator_1.body)('name').optional().isString().trim(),
], validation_1.validateRequest, TwoFactorAuthController_1.default.verifyWebAuthnRegistration.bind(TwoFactorAuthController_1.default));
router.post('/webauthn/authenticate/start', [(0, express_validator_1.body)('userId').optional().isUUID().withMessage('Invalid user ID')], validation_1.validateRequest, TwoFactorAuthController_1.default.startWebAuthnAuthentication.bind(TwoFactorAuthController_1.default));
router.post('/webauthn/authenticate/verify', [
    (0, express_validator_1.body)('response').isObject().withMessage('Invalid response format'),
    (0, express_validator_1.body)('userId').optional().isUUID().withMessage('Invalid user ID'),
], validation_1.validateRequest, TwoFactorAuthController_1.default.verifyWebAuthnAuthentication.bind(TwoFactorAuthController_1.default));
router.get('/webauthn/credentials', auth_1.authenticate, TwoFactorAuthController_1.default.listWebAuthnCredentials.bind(TwoFactorAuthController_1.default));
router.delete('/webauthn/credentials/:credentialId', auth_1.authenticate, [(0, express_validator_1.param)('credentialId').isString().notEmpty().withMessage('Invalid credential ID')], validation_1.validateRequest, TwoFactorAuthController_1.default.deleteWebAuthnCredential.bind(TwoFactorAuthController_1.default));
router.patch('/webauthn/credentials/:credentialId', auth_1.authenticate, [
    (0, express_validator_1.param)('credentialId').isString().notEmpty().withMessage('Invalid credential ID'),
    (0, express_validator_1.body)('name').isString().trim().notEmpty().withMessage('Name is required'),
], validation_1.validateRequest, TwoFactorAuthController_1.default.renameWebAuthnCredential.bind(TwoFactorAuthController_1.default));
exports.default = router;
//# sourceMappingURL=twoFactorAuth.js.map