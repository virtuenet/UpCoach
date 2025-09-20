import { Router } from 'express';
import { body, param, query } from 'express-validator';

import { EnterpriseController } from '../controllers/EnterpriseController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validation';

const router = Router();
const enterpriseController = new EnterpriseController();

// All routes require authentication
router.use(authenticate);

// Organization routes
router.post(
  '/organizations',
  [
    body('name').notEmpty().trim(),
    body('billingEmail').isEmail(),
    body('size').optional().isIn(['small', 'medium', 'large', 'enterprise']),
  ],
  validateRequest,
  enterpriseController.createOrganization
);

router.put(
  '/organizations/:organizationId',
  authorize('organization', 'admin'),
  enterpriseController.updateOrganization
);

router.get(
  '/organizations/:organizationId',
  authorize('organization', 'member'),
  enterpriseController.getOrganizationDetails
);

router.get(
  '/organizations/:organizationId/members',
  authorize('organization', 'member'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  enterpriseController.getOrganizationMembers
);

router.post(
  '/organizations/:organizationId/invitations',
  authorize('organization', 'admin'),
  [
    body('email').isEmail(),
    body('role').isIn(['member', 'manager', 'admin']),
    body('teamIds').optional().isArray(),
  ],
  validateRequest,
  enterpriseController.inviteMember
);

router.post(
  '/invitations/accept',
  [body('token').notEmpty()],
  validateRequest,
  enterpriseController.acceptInvitation
);

router.delete(
  '/organizations/:organizationId/members/:userId',
  authorize('organization', 'admin'),
  enterpriseController.removeMember
);

// Team routes
router.post(
  '/organizations/:organizationId/teams',
  authorize('organization', 'manager'),
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('department').optional().trim(),
  ],
  validateRequest,
  enterpriseController.createTeam
);

router.put('/teams/:teamId', authorize('team', 'lead'), enterpriseController.updateTeam);

router.get(
  '/organizations/:organizationId/teams',
  authorize('organization', 'member'),
  enterpriseController.getTeams
);

router.post(
  '/teams/:teamId/members',
  authorize('team', 'lead'),
  [body('userId').isInt(), body('role').isIn(['member', 'lead', 'admin'])],
  validateRequest,
  enterpriseController.addTeamMember
);

router.delete(
  '/teams/:teamId/members/:userId',
  authorize('team', 'lead'),
  enterpriseController.removeTeamMember
);

// SSO routes
router.post(
  '/organizations/:organizationId/sso',
  authorize('organization', 'owner'),
  [
    body('provider').isIn(['saml', 'oidc', 'google', 'microsoft', 'okta']),
    body('enabled').isBoolean(),
    body('allowedDomains').optional().isArray(),
  ],
  validateRequest,
  enterpriseController.configureSSOProvider
);

router.get(
  '/organizations/:organizationId/sso',
  authorize('organization', 'admin'),
  enterpriseController.getSSOProviders
);

router.put(
  '/sso/:configId',
  authorize('organization', 'owner'),
  enterpriseController.updateSSOProvider
);

// SSO authentication endpoints (no auth required)
router.get('/sso/login/:configId', enterpriseController.initiateSSOLogin);

router.post('/sso/saml/callback/:configId', enterpriseController.handleSAMLCallback);

router.get('/sso/oidc/callback/:configId', enterpriseController.handleOIDCCallback);

router.post('/sso/logout', authenticate, enterpriseController.ssoLogout);

// Enterprise policies
router.post(
  '/organizations/:organizationId/policies',
  authorize('organization', 'admin'),
  [
    body('name').notEmpty().trim(),
    body('type').isIn(['security', 'data_retention', 'access_control', 'compliance']),
    body('rules').isObject(),
    body('enforcementLevel').isIn(['soft', 'hard']),
  ],
  validateRequest,
  enterpriseController.createPolicy
);

router.get(
  '/organizations/:organizationId/policies',
  authorize('organization', 'member'),
  enterpriseController.getPolicies
);

// Policy management routes
router.put(
  '/policies/:policyId',
  authorize('organization', 'admin'),
  [
    body('name').optional().notEmpty().trim(),
    body('type').optional().isIn(['security', 'data_retention', 'access_control', 'compliance']),
    body('rules').optional().isObject(),
    body('enforcementLevel').optional().isIn(['soft', 'hard']),
    body('appliesTo').optional().isObject(),
  ],
  validateRequest,
  enterpriseController.updatePolicy
);

router.delete(
  '/policies/:policyId',
  authorize('organization', 'admin'),
  [
    param('policyId').isInt({ min: 1 }),
  ],
  validateRequest,
  enterpriseController.deletePolicy
);

router.patch(
  '/policies/:policyId/toggle',
  authorize('organization', 'admin'),
  [
    param('policyId').isInt({ min: 1 }),
    body('enabled').optional().isBoolean(),
  ],
  validateRequest,
  enterpriseController.togglePolicy
);

// Audit logs
router.get(
  '/organizations/:organizationId/audit-logs',
  authorize('organization', 'admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  enterpriseController.getAuditLogs
);

export default router;
