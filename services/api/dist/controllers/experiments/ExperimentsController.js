"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentsController = void 0;
const Experiment_1 = require("../../models/experiments/Experiment");
const ABTestingService_1 = require("../../services/ab-testing/ABTestingService");
const express_validator_1 = require("express-validator");
const logger_1 = require("../../utils/logger");
class ExperimentsController {
    abTestingService;
    constructor() {
        this.abTestingService = new ABTestingService_1.ABTestingService();
    }
    /**
     * Create a new experiment
     */
    async createExperiment(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
                return;
            }
            const { name, description, variants, trafficAllocation = 100, startDate, endDate, targetMetric, successCriteria, segmentation, } = req.body;
            const experiment = await Experiment_1.Experiment.create({
                name,
                description,
                variants,
                trafficAllocation,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : undefined,
                targetMetric,
                successCriteria,
                segmentation,
                createdBy: req.user.id,
                updatedBy: req.user.id,
                status: 'draft',
            });
            _res.status(201).json({
                success: true,
                data: experiment,
                message: 'Experiment created successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating experiment:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to create experiment',
                message: error?.message || 'Unknown error',
            });
        }
    }
    /**
     * Get all experiments
     */
    async getExperiments(req, _res) {
        try {
            const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
            const whereClause = {};
            if (status) {
                whereClause.status = status;
            }
            const offset = (Number(page) - 1) * Number(limit);
            const { rows: experiments, count: total } = await Experiment_1.Experiment.findAndCountAll({
                where: whereClause,
                limit: Number(limit),
                offset,
                order: [[sortBy, sortOrder]],
            });
            _res.json({
                success: true,
                data: {
                    experiments,
                    pagination: {
                        current: Number(page),
                        total: Math.ceil(total / Number(limit)),
                        count: experiments.length,
                        totalRecords: total,
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching experiments:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to fetch experiments',
            });
        }
    }
    /**
     * Get experiment by ID
     */
    async getExperiment(req, _res) {
        try {
            const { id } = req.params;
            const experiment = await Experiment_1.Experiment.findByPk(id);
            if (!experiment) {
                _res.status(404).json({
                    success: false,
                    error: 'Experiment not found',
                });
                return;
            }
            _res.json({
                success: true,
                data: experiment,
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching experiment:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to fetch experiment',
            });
        }
    }
    /**
     * Update experiment
     */
    async updateExperiment(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
                return;
            }
            const { id } = req.params;
            const updateData = { ...req.body, updatedBy: req.user.id };
            const experiment = await Experiment_1.Experiment.findByPk(id);
            if (!experiment) {
                _res.status(404).json({
                    success: false,
                    error: 'Experiment not found',
                });
                return;
            }
            // Prevent modification of active experiments
            if (experiment.status === 'active' &&
                updateData.status !== 'paused' &&
                updateData.status !== 'completed') {
                _res.status(400).json({
                    success: false,
                    error: 'Cannot modify active experiment configuration. Pause experiment first.',
                });
                return;
            }
            await experiment.update(updateData);
            _res.json({
                success: true,
                data: experiment,
                message: 'Experiment updated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating experiment:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to update experiment',
                message: error?.message || 'Unknown error',
            });
        }
    }
    /**
     * Start experiment
     */
    async startExperiment(req, _res) {
        try {
            const { id } = req.params;
            const experiment = await Experiment_1.Experiment.findByPk(id);
            if (!experiment) {
                _res.status(404).json({
                    success: false,
                    error: 'Experiment not found',
                });
                return;
            }
            if (experiment.status !== 'draft' && experiment.status !== 'paused') {
                _res.status(400).json({
                    success: false,
                    error: `Cannot start experiment with status: ${experiment.status}`,
                });
                return;
            }
            // Validate experiment configuration
            if (!experiment.validateVariantAllocations()) {
                _res.status(400).json({
                    success: false,
                    error: 'Invalid variant allocations. Must sum to 100%',
                });
                return;
            }
            await experiment.update({
                status: 'active',
                startDate: new Date(),
                updatedBy: req.user.id,
            });
            _res.json({
                success: true,
                data: experiment,
                message: 'Experiment started successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error starting experiment:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to start experiment',
            });
        }
    }
    /**
     * Stop experiment
     */
    async stopExperiment(req, _res) {
        try {
            const { id } = req.params;
            const experiment = await Experiment_1.Experiment.findByPk(id);
            if (!experiment) {
                _res.status(404).json({
                    success: false,
                    error: 'Experiment not found',
                });
                return;
            }
            if (experiment.status !== 'active' && experiment.status !== 'paused') {
                _res.status(400).json({
                    success: false,
                    error: `Cannot stop experiment with status: ${experiment.status}`,
                });
                return;
            }
            await experiment.update({
                status: 'completed',
                endDate: new Date(),
                updatedBy: req.user.id,
            });
            _res.json({
                success: true,
                data: experiment,
                message: 'Experiment stopped successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error stopping experiment:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to stop experiment',
            });
        }
    }
    /**
     * Get variant for user
     */
    async getVariant(req, _res) {
        try {
            const { experimentId } = req.params;
            const userId = req.user.id;
            const context = req.body.context || {};
            const variant = await this.abTestingService.getVariant(userId, experimentId, context);
            _res.json({
                success: true,
                data: variant,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting variant:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to get variant assignment',
            });
        }
    }
    /**
     * Track conversion event
     */
    async trackConversion(req, _res) {
        try {
            const { experimentId } = req.params;
            const { eventType, eventValue, properties } = req.body;
            const userId = req.user.id;
            const success = await this.abTestingService.trackConversion(userId, experimentId, eventType, eventValue, properties);
            _res.json({
                success,
                message: success ? 'Conversion tracked successfully' : 'Failed to track conversion',
            });
        }
        catch (error) {
            logger_1.logger.error('Error tracking conversion:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to track conversion',
            });
        }
    }
    /**
     * Get experiment analytics
     */
    async getAnalytics(req, _res) {
        try {
            const { id } = req.params;
            const analytics = await this.abTestingService.getExperimentAnalytics(id);
            if (!analytics) {
                _res.status(404).json({
                    success: false,
                    error: 'Experiment not found or analytics not available',
                });
                return;
            }
            _res.json({
                success: true,
                data: analytics,
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching analytics:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to fetch experiment analytics',
            });
        }
    }
    /**
     * Delete experiment (only drafts)
     */
    async deleteExperiment(req, _res) {
        try {
            const { id } = req.params;
            const experiment = await Experiment_1.Experiment.findByPk(id);
            if (!experiment) {
                _res.status(404).json({
                    success: false,
                    error: 'Experiment not found',
                });
                return;
            }
            if (experiment.status !== 'draft') {
                _res.status(400).json({
                    success: false,
                    error: 'Can only delete draft experiments',
                });
                return;
            }
            await experiment.destroy();
            _res.json({
                success: true,
                message: 'Experiment deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting experiment:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to delete experiment',
            });
        }
    }
}
exports.ExperimentsController = ExperimentsController;
exports.default = ExperimentsController;
//# sourceMappingURL=ExperimentsController.js.map