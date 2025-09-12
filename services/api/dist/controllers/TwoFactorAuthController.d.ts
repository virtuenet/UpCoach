import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class TwoFactorAuthController {
    get2FAStatus(req: AuthenticatedRequest, _res: Response): Promise<void>;
    setupTOTP(req: AuthenticatedRequest, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    verifyAndEnableTOTP(req: AuthenticatedRequest, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    verifyTOTP(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    disable2FA(req: AuthenticatedRequest, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    regenerateBackupCodes(req: AuthenticatedRequest, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTrustedDevices(req: AuthenticatedRequest, _res: Response): Promise<void>;
    removeTrustedDevice(req: AuthenticatedRequest, _res: Response): Promise<void>;
    startWebAuthnRegistration(req: AuthenticatedRequest, _res: Response): Promise<void>;
    verifyWebAuthnRegistration(req: AuthenticatedRequest, _res: Response): Promise<void>;
    startWebAuthnAuthentication(req: Request, _res: Response): Promise<void>;
    verifyWebAuthnAuthentication(req: Request, _res: Response): Promise<void>;
    listWebAuthnCredentials(req: AuthenticatedRequest, _res: Response): Promise<void>;
    deleteWebAuthnCredential(req: AuthenticatedRequest, _res: Response): Promise<void>;
    renameWebAuthnCredential(req: AuthenticatedRequest, _res: Response): Promise<void>;
}
declare const _default: TwoFactorAuthController;
export default _default;
//# sourceMappingURL=TwoFactorAuthController.d.ts.map