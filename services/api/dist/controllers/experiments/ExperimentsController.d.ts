import { Request, Response } from 'express';
export declare class ExperimentsController {
    private abTestingService;
    constructor();
    /**
     * Create a new experiment
     */
    createExperiment(req: Request, _res: Response): Promise<void>;
    /**
     * Get all experiments
     */
    getExperiments(req: Request, _res: Response): Promise<void>;
    /**
     * Get experiment by ID
     */
    getExperiment(req: Request, _res: Response): Promise<void>;
    /**
     * Update experiment
     */
    updateExperiment(req: Request, _res: Response): Promise<void>;
    /**
     * Start experiment
     */
    startExperiment(req: Request, _res: Response): Promise<void>;
    /**
     * Stop experiment
     */
    stopExperiment(req: Request, _res: Response): Promise<void>;
    /**
     * Get variant for user
     */
    getVariant(req: Request, _res: Response): Promise<void>;
    /**
     * Track conversion event
     */
    trackConversion(req: Request, _res: Response): Promise<void>;
    /**
     * Get experiment analytics
     */
    getAnalytics(req: Request, _res: Response): Promise<void>;
    /**
     * Delete experiment (only drafts)
     */
    deleteExperiment(req: Request, _res: Response): Promise<void>;
}
export default ExperimentsController;
//# sourceMappingURL=ExperimentsController.d.ts.map