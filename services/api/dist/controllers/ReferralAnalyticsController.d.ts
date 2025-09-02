import { Request, Response } from 'express';
export declare class ReferralAnalyticsController {
    getReferralStats(req: Request, res: Response): Promise<void>;
    getAllReferrals(req: Request, _res: Response): Promise<void>;
    updateReferralStatus(req: Request, _res: Response): Promise<void>;
    processReferralPayment(req: Request, _res: Response): Promise<void>;
    getReferralPrograms(req: Request, res: Response): Promise<void>;
}
export declare const referralAnalyticsController: ReferralAnalyticsController;
//# sourceMappingURL=ReferralAnalyticsController.d.ts.map