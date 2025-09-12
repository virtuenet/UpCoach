"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorAuthController = void 0;
const TwoFactorAuthService_1 = require("../services/TwoFactorAuthService");
const WebAuthnService_1 = require("../services/WebAuthnService");
const logger_1 = require("../utils/logger");
const User_1 = require("../models/User");
class TwoFactorAuthController {
    async get2FAStatus(req, _res) {
        try {
            const userId = req.user.id;
            const [is2FAEnabled, method, config, trustedDevices, webAuthnCredentials, webAuthnStats] = await Promise.all([
                TwoFactorAuthService_1.twoFactorAuthService.is2FAEnabled(userId),
                TwoFactorAuthService_1.twoFactorAuthService.get2FAMethod(userId),
                TwoFactorAuthService_1.twoFactorAuthService.get2FAConfig(userId),
                TwoFactorAuthService_1.twoFactorAuthService.getTrustedDevices(userId),
                WebAuthnService_1.webAuthnService.getUserCredentials(userId),
                WebAuthnService_1.webAuthnService.getUserCredentialStats(userId),
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
        }
        catch (error) {
            logger_1.logger.error('Error getting 2FA status', error);
            _res.status(500).json({ error: 'Failed to get 2FA status' });
        }
    }
    async setupTOTP(req, _res) {
        try {
            const userId = req.user.id;
            const email = req.user.email;
            const isEnabled = await TwoFactorAuthService_1.twoFactorAuthService.is2FAEnabled(userId);
            if (isEnabled) {
                return _res.status(400).json({ error: '2FA is already enabled' });
            }
            const { secret, qrCode, backupCodes } = await TwoFactorAuthService_1.twoFactorAuthService.generateTOTPSecret(userId, email);
            _res.json({
                secret: secret.base32,
                qrCode,
                backupCodes,
                message: 'Scan the QR code with your authenticator app and verify with a code',
            });
        }
        catch (error) {
            logger_1.logger.error('Error setting up TOTP', error);
            _res.status(500).json({ error: 'Failed to setup 2FA' });
        }
    }
    async verifyAndEnableTOTP(req, _res) {
        try {
            const userId = req.user.id;
            const { token } = req.body;
            if (!token) {
                return _res.status(400).json({ error: 'Verification code is required' });
            }
            const { success, backupCodes } = await TwoFactorAuthService_1.twoFactorAuthService.verifyAndEnableTOTP(userId, token);
            if (!success) {
                return _res.status(400).json({ error: 'Invalid verification code' });
            }
            _res.json({
                success: true,
                backupCodes,
                message: '2FA has been enabled successfully. Save your backup codes securely.',
            });
        }
        catch (error) {
            logger_1.logger.error('Error verifying TOTP', error);
            _res.status(500).json({ error: 'Failed to enable 2FA' });
        }
    }
    async verifyTOTP(req, _res) {
        try {
            const { userId, token } = req.body;
            if (!userId || !token) {
                return _res.status(400).json({ error: 'User ID and token are required' });
            }
            const canAttempt = await TwoFactorAuthService_1.twoFactorAuthService.check2FARateLimit(userId);
            if (!canAttempt) {
                return _res.status(429).json({ error: 'Too many attempts. Please try again later.' });
            }
            const verified = await TwoFactorAuthService_1.twoFactorAuthService.verifyTOTP(userId, token);
            if (verified) {
                await TwoFactorAuthService_1.twoFactorAuthService.clear2FARateLimit(userId);
                const { trustDevice, deviceName } = req.body;
                if (trustDevice && deviceName) {
                    const fingerprint = TwoFactorAuthService_1.twoFactorAuthService.generateDeviceFingerprint(req.get('user-agent') || '', req.ip || 'unknown', req.get('accept-language') || 'en');
                    await TwoFactorAuthService_1.twoFactorAuthService.addTrustedDevice(userId, {
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
            }
            else {
                _res.status(400).json({ error: 'Invalid verification code' });
            }
        }
        catch (error) {
            logger_1.logger.error('Error verifying TOTP', error);
            _res.status(500).json({ error: 'Verification failed' });
        }
    }
    async disable2FA(req, _res) {
        try {
            const userId = req.user.id;
            const { password, token } = req.body;
            const user = await User_1.User.findByPk(userId);
            if (!user) {
                return _res.status(404).json({ error: 'User not found' });
            }
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return _res.status(400).json({ error: 'Invalid password' });
            }
            const verified = await TwoFactorAuthService_1.twoFactorAuthService.verifyTOTP(userId, token);
            if (!verified) {
                return _res.status(400).json({ error: 'Invalid verification code' });
            }
            await TwoFactorAuthService_1.twoFactorAuthService.disable2FA(userId);
            _res.json({
                success: true,
                message: '2FA has been disabled',
            });
        }
        catch (error) {
            logger_1.logger.error('Error disabling 2FA', error);
            _res.status(500).json({ error: 'Failed to disable 2FA' });
        }
    }
    async regenerateBackupCodes(req, _res) {
        try {
            const userId = req.user.id;
            const { token } = req.body;
            const verified = await TwoFactorAuthService_1.twoFactorAuthService.verifyTOTP(userId, token);
            if (!verified) {
                return _res.status(400).json({ error: 'Invalid verification code' });
            }
            const backupCodes = await TwoFactorAuthService_1.twoFactorAuthService.regenerateBackupCodes(userId);
            _res.json({
                backupCodes,
                message: 'New backup codes generated. Save them securely.',
            });
        }
        catch (error) {
            logger_1.logger.error('Error regenerating backup codes', error);
            _res.status(500).json({ error: 'Failed to regenerate backup codes' });
        }
    }
    async getTrustedDevices(req, _res) {
        try {
            const userId = req.user.id;
            const devices = await TwoFactorAuthService_1.twoFactorAuthService.getTrustedDevices(userId);
            _res.json({ devices });
        }
        catch (error) {
            logger_1.logger.error('Error getting trusted devices', error);
            _res.status(500).json({ error: 'Failed to get trusted devices' });
        }
    }
    async removeTrustedDevice(req, _res) {
        try {
            const userId = req.user.id;
            const { deviceId } = req.params;
            await TwoFactorAuthService_1.twoFactorAuthService.removeTrustedDevice(userId, deviceId);
            _res.json({
                success: true,
                message: 'Device removed successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error removing trusted device', error);
            _res.status(500).json({ error: 'Failed to remove device' });
        }
    }
    async startWebAuthnRegistration(req, _res) {
        try {
            const userId = req.user.id;
            const userName = req.user.email;
            const userDisplayName = req.user.name || req.user.email;
            const options = await WebAuthnService_1.webAuthnService.generateRegistrationOptions(userId, userName, userDisplayName);
            _res.json(options);
        }
        catch (error) {
            logger_1.logger.error('Error starting WebAuthn registration', error);
            _res.status(500).json({ error: 'Failed to start registration' });
        }
    }
    async verifyWebAuthnRegistration(req, _res) {
        try {
            const userId = req.user.id;
            const { response, name } = req.body;
            const { verified, credentialId } = await WebAuthnService_1.webAuthnService.verifyRegistrationResponse(userId, response, name);
            if (verified) {
                _res.json({
                    verified: true,
                    credentialId,
                    message: 'Passkey registered successfully',
                });
            }
            else {
                _res.status(400).json({ error: 'Registration verification failed' });
            }
        }
        catch (error) {
            logger_1.logger.error('Error verifying WebAuthn registration', error);
            _res.status(500).json({ error: 'Failed to verify registration' });
        }
    }
    async startWebAuthnAuthentication(req, _res) {
        try {
            const { userId } = req.body;
            const options = await WebAuthnService_1.webAuthnService.generateAuthenticationOptions(userId);
            _res.json(options);
        }
        catch (error) {
            logger_1.logger.error('Error starting WebAuthn authentication', error);
            _res.status(500).json({ error: 'Failed to start authentication' });
        }
    }
    async verifyWebAuthnAuthentication(req, _res) {
        try {
            const { response, userId } = req.body;
            const result = await WebAuthnService_1.webAuthnService.verifyAuthenticationResponse(response, userId);
            if (result.verified) {
                _res.json({
                    verified: true,
                    userId: result.userId,
                    message: 'Authentication successful',
                });
            }
            else {
                _res.status(400).json({ error: 'Authentication verification failed' });
            }
        }
        catch (error) {
            logger_1.logger.error('Error verifying WebAuthn authentication', error);
            _res.status(500).json({ error: 'Failed to verify authentication' });
        }
    }
    async listWebAuthnCredentials(req, _res) {
        try {
            const userId = req.user.id;
            const credentials = await WebAuthnService_1.webAuthnService.getUserCredentials(userId);
            const stats = await WebAuthnService_1.webAuthnService.getUserCredentialStats(userId);
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
        }
        catch (error) {
            logger_1.logger.error('Error listing WebAuthn credentials', error);
            _res.status(500).json({ error: 'Failed to list credentials' });
        }
    }
    async deleteWebAuthnCredential(req, _res) {
        try {
            const userId = req.user.id;
            const { credentialId } = req.params;
            await WebAuthnService_1.webAuthnService.deleteCredential(userId, credentialId);
            _res.json({
                success: true,
                message: 'Credential deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting WebAuthn credential', error);
            _res.status(500).json({ error: 'Failed to delete credential' });
        }
    }
    async renameWebAuthnCredential(req, _res) {
        try {
            const userId = req.user.id;
            const { credentialId } = req.params;
            const { name } = req.body;
            await WebAuthnService_1.webAuthnService.renameCredential(userId, credentialId, name);
            _res.json({
                success: true,
                message: 'Credential renamed successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error renaming WebAuthn credential', error);
            _res.status(500).json({ error: 'Failed to rename credential' });
        }
    }
    async sendSMSCode(req, _res) {
        try {
            const userId = req.user.id;
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                return _res.status(400).json({ error: 'Phone number is required' });
            }
            const result = await TwoFactorAuthService_1.twoFactorAuthService.sendSMSCode(userId, phoneNumber);
            _res.json(result);
        }
        catch (error) {
            logger_1.logger.error('Error sending SMS code', error);
            _res.status(500).json({ error: 'Failed to send SMS code' });
        }
    }
    async enableSMS2FA(req, _res) {
        try {
            const userId = req.user.id;
            const { phoneNumber, verificationCode } = req.body;
            if (!phoneNumber || !verificationCode) {
                return _res.status(400).json({
                    error: 'Phone number and verification code are required'
                });
            }
            const result = await TwoFactorAuthService_1.twoFactorAuthService.enableSMS2FA(userId, phoneNumber, verificationCode);
            if (result.success) {
                _res.json({
                    success: true,
                    message: result.message,
                });
            }
            else {
                _res.status(400).json({ error: result.message });
            }
        }
        catch (error) {
            logger_1.logger.error('Error enabling SMS 2FA', error);
            _res.status(500).json({ error: 'Failed to enable SMS 2FA' });
        }
    }
    async sendEmailCode(req, _res) {
        try {
            const userId = req.user.id;
            const { email } = req.body;
            if (!email) {
                return _res.status(400).json({ error: 'Email address is required' });
            }
            const result = await TwoFactorAuthService_1.twoFactorAuthService.sendEmailCode(userId, email);
            _res.json(result);
        }
        catch (error) {
            logger_1.logger.error('Error sending email code', error);
            _res.status(500).json({ error: 'Failed to send email code' });
        }
    }
    async enableEmail2FA(req, _res) {
        try {
            const userId = req.user.id;
            const { email, verificationCode } = req.body;
            if (!email || !verificationCode) {
                return _res.status(400).json({
                    error: 'Email address and verification code are required'
                });
            }
            const result = await TwoFactorAuthService_1.twoFactorAuthService.enableEmail2FA(userId, email, verificationCode);
            if (result.success) {
                _res.json({
                    success: true,
                    message: result.message,
                });
            }
            else {
                _res.status(400).json({ error: result.message });
            }
        }
        catch (error) {
            logger_1.logger.error('Error enabling email 2FA', error);
            _res.status(500).json({ error: 'Failed to enable email 2FA' });
        }
    }
    async verify2FA(req, _res) {
        try {
            const userId = req.user.id;
            const { code } = req.body;
            if (!code) {
                return _res.status(400).json({ error: 'Verification code is required' });
            }
            const verified = await TwoFactorAuthService_1.twoFactorAuthService.verify2FA(userId, code);
            if (verified) {
                _res.json({
                    success: true,
                    message: '2FA verification successful',
                });
            }
            else {
                _res.status(400).json({
                    error: 'Invalid verification code'
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error verifying 2FA', error);
            _res.status(500).json({ error: 'Failed to verify 2FA code' });
        }
    }
}
exports.TwoFactorAuthController = TwoFactorAuthController;
exports.default = new TwoFactorAuthController();
//# sourceMappingURL=TwoFactorAuthController.js.map