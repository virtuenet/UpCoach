import { Request, Response } from 'express';
export declare class OnboardingController {
    completeOnboarding(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    getOnboardingStatus(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    skipOnboarding(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    private calculateTargetDate;
    private generateAIPersonality;
    private triggerPostOnboardingActions;
    private calculateOnboardingProgress;
}
declare const _default: OnboardingController;
export default _default;
//# sourceMappingURL=OnboardingController.d.ts.map