import express from 'express';
import { body, param, query } from 'express-validator';
import ExperimentsController from '../controllers/experiments/ExperimentsController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();
const experimentsController = new ExperimentsController();

// Validation middleware
const experimentValidation = [
  body('name')
    .notEmpty()
    .withMessage('Experiment name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),

  body('description').notEmpty().withMessage('Description is required'),

  body('variants')
    .isArray({ min: 2 })
    .withMessage('Must have at least 2 variants')
    .custom(variants => {
      const totalAllocation = variants.reduce(
        (sum: number, variant: any) => sum + variant.allocation,
        0
      );
      if (Math.abs(totalAllocation - 100) > 0.01) {
        throw new Error('Variant allocations must sum to 100%');
      }

      const controlVariants = variants.filter((v: any) => v.isControl);
      if (controlVariants.length !== 1) {
        throw new Error('Must have exactly one control variant');
      }

      return true;
    }),

  body('trafficAllocation')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Traffic allocation must be between 1 and 100'),

  body('startDate').isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (endDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('targetMetric').notEmpty().withMessage('Target metric is required'),

  body('successCriteria')
    .isObject()
    .withMessage('Success criteria must be an object')
    .custom(criteria => {
      if (
        !criteria.primaryMetric ||
        !criteria.minimumDetectableEffect ||
        !criteria.confidenceLevel
      ) {
        throw new Error(
          'Success criteria must include primaryMetric, minimumDetectableEffect, and confidenceLevel'
        );
      }
      if (criteria.confidenceLevel < 80 || criteria.confidenceLevel > 99) {
        throw new Error('Confidence level must be between 80 and 99');
      }
      return true;
    }),
];

const conversionValidation = [
  body('eventType').notEmpty().withMessage('Event type is required'),

  body('eventValue').optional().isNumeric().withMessage('Event value must be a number'),

  body('properties').optional().isObject().withMessage('Properties must be an object'),
];

// Admin routes (require admin role)
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'manager']),
  experimentValidation,
  experimentsController.createExperiment.bind(experimentsController)
);

router.get(
  '/',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    query('status').optional().isIn(['draft', 'active', 'paused', 'completed', 'archived']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['name', 'status', 'createdAt', 'startDate']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
  ],
  experimentsController.getExperiments.bind(experimentsController)
);

router.get(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [param('id').isUUID().withMessage('Invalid experiment ID')],
  experimentsController.getExperiment.bind(experimentsController)
);

router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [param('id').isUUID().withMessage('Invalid experiment ID')],
  experimentValidation,
  experimentsController.updateExperiment.bind(experimentsController)
);

router.post(
  '/:id/start',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [param('id').isUUID().withMessage('Invalid experiment ID')],
  experimentsController.startExperiment.bind(experimentsController)
);

router.post(
  '/:id/stop',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [param('id').isUUID().withMessage('Invalid experiment ID')],
  experimentsController.stopExperiment.bind(experimentsController)
);

router.get(
  '/:id/analytics',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [param('id').isUUID().withMessage('Invalid experiment ID')],
  experimentsController.getAnalytics.bind(experimentsController)
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  [param('id').isUUID().withMessage('Invalid experiment ID')],
  experimentsController.deleteExperiment.bind(experimentsController)
);

// User-facing routes (for getting variants and tracking conversions)
router.get(
  '/:experimentId/variant',
  authenticateToken,
  [param('experimentId').isUUID().withMessage('Invalid experiment ID')],
  experimentsController.getVariant.bind(experimentsController)
);

router.post(
  '/:experimentId/track',
  authenticateToken,
  [param('experimentId').isUUID().withMessage('Invalid experiment ID')],
  conversionValidation,
  experimentsController.trackConversion.bind(experimentsController)
);

// Health check endpoint
router.get('/health', (req, res) => {
  (res as any).json({
    success: true,
    service: 'ab-testing',
    timestamp: new Date().toISOString(),
  });
});

export default router;
