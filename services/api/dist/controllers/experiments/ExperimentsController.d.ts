import { Request, Response } from 'express';
export declare class ExperimentsController {
    private abTestingService;
    constructor();
    createExperiment(req: Request, _res: Response): Promise<void>;
    getExperiments(req: Request, _res: Response): Promise<void>;
    getExperiment(req: Request, _res: Response): Promise<void>;
    updateExperiment(req: Request, _res: Response): Promise<void>;
    startExperiment(req: Request, _res: Response): Promise<void>;
    stopExperiment(req: Request, _res: Response): Promise<void>;
    getVariant(req: Request, _res: Response): Promise<void>;
    trackConversion(req: Request, _res: Response): Promise<void>;
    getAnalytics(req: Request, _res: Response): Promise<void>;
    deleteExperiment(req: Request, _res: Response): Promise<void>;
}
export default ExperimentsController;
//# sourceMappingURL=ExperimentsController.d.ts.map