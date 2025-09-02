"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const ExperimentsController_1 = __importDefault(require("../controllers/experiments/ExperimentsController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const experimentsController = new ExperimentsController_1.default();
// Validation middleware
const experimentValidation = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Experiment name is required')
        .isLength({ min: 1, max: 255 })
        .withMessage('Name must be between 1 and 255 characters'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('variants')
        .isArray({ min: 2 })
        .withMessage('Must have at least 2 variants')
        .custom(variants => {
        const totalAllocation = variants.reduce((sum, variant) => sum + variant.allocation, 0);
        if (Math.abs(totalAllocation - 100) > 0.01) {
            throw new Error('Variant allocations must sum to 100%');
        }
        const controlVariants = variants.filter((v) => v.isControl);
        if (controlVariants.length !== 1) {
            throw new Error('Must have exactly one control variant');
        }
        return true;
    }),
    (0, express_validator_1.body)('trafficAllocation')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Traffic allocation must be between 1 and 100'),
    (0, express_validator_1.body)('startDate').isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date')
        .custom((endDate, { req }) => {
        if (endDate && new Date(endDate) <= new Date(req.body.startDate)) {
            throw new Error('End date must be after start date');
        }
        return true;
    }),
    (0, express_validator_1.body)('targetMetric').notEmpty().withMessage('Target metric is required'),
    (0, express_validator_1.body)('successCriteria')
        .isObject()
        .withMessage('Success criteria must be an object')
        .custom(criteria => {
        if (!criteria.primaryMetric ||
            !criteria.minimumDetectableEffect ||
            !criteria.confidenceLevel) {
            throw new Error('Success criteria must include primaryMetric, minimumDetectableEffect, and confidenceLevel');
        }
        if (criteria.confidenceLevel < 80 || criteria.confidenceLevel > 99) {
            throw new Error('Confidence level must be between 80 and 99');
        }
        return true;
    }),
];
const conversionValidation = [
    (0, express_validator_1.body)('eventType').notEmpty().withMessage('Event type is required'),
    (0, express_validator_1.body)('eventValue').optional().isNumeric().withMessage('Event value must be a number'),
    (0, express_validator_1.body)('properties').optional().isObject().withMessage('Properties must be an object'),
];
// Admin routes (require admin role)
router.post('/', auth_1.authMiddleware, (0, auth_1.requireRole)(['admin', 'manager']), experimentValidation, experimentsController.createExperiment.bind(experimentsController));
router.get('/', auth_1.authMiddleware, (0, auth_1.requireRole)(['admin', 'manager']), [
    (0, express_validator_1.query)('status').optional().isIn(['draft', 'active', 'paused', 'completed', 'archived']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('sortBy').optional().isIn(['name', 'status', 'createdAt', 'startDate']),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['ASC', 'DESC']),
], experimentsController.getExperiments.bind(experimentsController));
router.get('/:id', auth_1.authMiddleware, (0, auth_1.requireRole)(['admin', 'manager']), [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid experiment ID')], experimentsController.getExperiment.bind(experimentsController));
router.put('/:id', auth_1.authMiddleware, (0, auth_1.requireRole)(['admin', 'manager']), [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid experiment ID')], experimentValidation, experimentsController.updateExperiment.bind(experimentsController));
router.post('/:id/start', auth_1.authMiddleware, (0, auth_1.requireRole)(['admin', 'manager']), [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid experiment ID')], experimentsController.startExperiment.bind(experimentsController));
router.post('/:id/stop', auth_1.authMiddleware, (0, auth_1.requireRole)(['admin', 'manager']), [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid experiment ID')], experimentsController.stopExperiment.bind(experimentsController));
router.get('/:id/analytics', auth_1.authMiddleware, (0, auth_1.requireRole)(['admin', 'manager']), [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid experiment ID')], experimentsController.getAnalytics.bind(experimentsController));
router.delete('/:id', auth_1.authMiddleware, (0, auth_1.requireRole)(['admin']), [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid experiment ID')], experimentsController.deleteExperiment.bind(experimentsController));
// User-facing routes (for getting variants and tracking conversions)
router.get('/:experimentId/variant', auth_1.authMiddleware, [(0, express_validator_1.param)('experimentId').isUUID().withMessage('Invalid experiment ID')], experimentsController.getVariant.bind(experimentsController));
router.post('/:experimentId/track', auth_1.authMiddleware, [(0, express_validator_1.param)('experimentId').isUUID().withMessage('Invalid experiment ID')], conversionValidation, experimentsController.trackConversion.bind(experimentsController));
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'ab-testing',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=experiments.js.map