/**
 * Two-Factor Authentication Controller
 * Handles TOTP and WebAuthn authentication endpoints
 */
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class TwoFactorAuthController {
    /**
     * Get 2FA status for current user
     */
    get2FAStatus(req: AuthenticatedRequest, _res: Response): Promise<void>;
    /**
     * Setup TOTP - Generate secret and QR code
     */
    setupTOTP(req: AuthenticatedRequest, _res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Verify TOTP and enable 2FA
     */
    verifyAndEnableTOTP(req: AuthenticatedRequest, _res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Verify TOTP token for login
     */
    verifyTOTP(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Disable 2FA
     */
    disable2FA(req: AuthenticatedRequest, _res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Regenerate backup codes
     */
    regenerateBackupCodes(req: AuthenticatedRequest, _res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Manage trusted devices
     */
    getTrustedDevices(req: AuthenticatedRequest, _res: Response): Promise<void>;
    /**
     * Remove trusted device
     */
    removeTrustedDevice(req: AuthenticatedRequest, _res: Response): Promise<void>;
    /**
     * WebAuthn - Start registration
     */
    startWebAuthnRegistration(req: AuthenticatedRequest, _res: Response): Promise<void>;
    /**
     * WebAuthn - Verify registration
     */
    verifyWebAuthnRegistration(req: AuthenticatedRequest, _res: Response): Promise<void>;
    /**
     * WebAuthn - Start authentication
     */
    startWebAuthnAuthentication(req: Request, _res: Response): Promise<void>;
    /**
     * WebAuthn - Verify authentication
     */
    verifyWebAuthnAuthentication(req: Request, _res: Response): Promise<void>;
    /**
     * WebAuthn - List credentials
     */
    listWebAuthnCredentials(req: AuthenticatedRequest, _res: Response): Promise<void>;
    /**
     * WebAuthn - Delete credential
     */
    deleteWebAuthnCredential(req: AuthenticatedRequest, _res: Response): Promise<void>;
    /**
     * WebAuthn - Rename credential
     */
    renameWebAuthnCredential(req: AuthenticatedRequest, _res: Response): Promise<void>;
}
declare const _default: TwoFactorAuthController;
export default _default;
//# sourceMappingURL=TwoFactorAuthController.d.ts.map