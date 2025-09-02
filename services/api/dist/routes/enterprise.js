"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EnterpriseController_1 = require("../controllers/EnterpriseController");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const enterpriseController = new EnterpriseController_1.EnterpriseController();
// All routes require authentication
router.use(auth_1.authenticate);
// Organization routes
router.post('/organizations', [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('billingEmail').isEmail(),
    (0, express_validator_1.body)('size').optional().isIn(['small', 'medium', 'large', 'enterprise']),
], validation_1.validateRequest, enterpriseController.createOrganization);
router.put('/organizations/:organizationId', (0, authorize_1.authorize)('organization', 'admin'), enterpriseController.updateOrganization);
router.get('/organizations/:organizationId', (0, authorize_1.authorize)('organization', 'member'), enterpriseController.getOrganizationDetails);
router.get('/organizations/:organizationId/members', (0, authorize_1.authorize)('organization', 'member'), [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
], validation_1.validateRequest, enterpriseController.getOrganizationMembers);
router.post('/organizations/:organizationId/invitations', (0, authorize_1.authorize)('organization', 'admin'), [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('role').isIn(['member', 'manager', 'admin']),
    (0, express_validator_1.body)('teamIds').optional().isArray(),
], validation_1.validateRequest, enterpriseController.inviteMember);
router.post('/invitations/accept', [(0, express_validator_1.body)('token').notEmpty()], validation_1.validateRequest, enterpriseController.acceptInvitation);
router.delete('/organizations/:organizationId/members/:userId', (0, authorize_1.authorize)('organization', 'admin'), enterpriseController.removeMember);
// Team routes
router.post('/organizations/:organizationId/teams', (0, authorize_1.authorize)('organization', 'manager'), [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('department').optional().trim(),
], validation_1.validateRequest, enterpriseController.createTeam);
router.put('/teams/:teamId', (0, authorize_1.authorize)('team', 'lead'), enterpriseController.updateTeam);
router.get('/organizations/:organizationId/teams', (0, authorize_1.authorize)('organization', 'member'), enterpriseController.getTeams);
router.post('/teams/:teamId/members', (0, authorize_1.authorize)('team', 'lead'), [(0, express_validator_1.body)('userId').isInt(), (0, express_validator_1.body)('role').isIn(['member', 'lead', 'admin'])], validation_1.validateRequest, enterpriseController.addTeamMember);
router.delete('/teams/:teamId/members/:userId', (0, authorize_1.authorize)('team', 'lead'), enterpriseController.removeTeamMember);
// SSO routes
router.post('/organizations/:organizationId/sso', (0, authorize_1.authorize)('organization', 'owner'), [
    (0, express_validator_1.body)('provider').isIn(['saml', 'oidc', 'google', 'microsoft', 'okta']),
    (0, express_validator_1.body)('enabled').isBoolean(),
    (0, express_validator_1.body)('allowedDomains').optional().isArray(),
], validation_1.validateRequest, enterpriseController.configureSSOProvider);
router.get('/organizations/:organizationId/sso', (0, authorize_1.authorize)('organization', 'admin'), enterpriseController.getSSOProviders);
router.put('/sso/:configId', (0, authorize_1.authorize)('organization', 'owner'), enterpriseController.updateSSOProvider);
// SSO authentication endpoints (no auth required)
router.get('/sso/login/:configId', enterpriseController.initiateSSOLogin);
router.post('/sso/saml/callback/:configId', enterpriseController.handleSAMLCallback);
router.get('/sso/oidc/callback/:configId', enterpriseController.handleOIDCCallback);
router.post('/sso/logout', auth_1.authenticate, enterpriseController.ssoLogout);
// Enterprise policies
router.post('/organizations/:organizationId/policies', (0, authorize_1.authorize)('organization', 'admin'), [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('type').isIn(['security', 'data_retention', 'access_control', 'compliance']),
    (0, express_validator_1.body)('rules').isObject(),
    (0, express_validator_1.body)('enforcementLevel').isIn(['soft', 'hard']),
], validation_1.validateRequest, enterpriseController.createPolicy);
router.get('/organizations/:organizationId/policies', (0, authorize_1.authorize)('organization', 'member'), enterpriseController.getPolicies);
// TODO: Implement these policy methods
// router.put(
//   '/policies/:policyId',
//   authorize('organization', 'admin'),
//   enterpriseController.updatePolicy
// );
// router.delete(
//   '/policies/:policyId',
//   authorize('organization', 'admin'),
//   enterpriseController.deletePolicy
// );
// router.patch(
//   '/policies/:policyId/toggle',
//   authorize('organization', 'admin'),
//   enterpriseController.togglePolicy
// );
// Audit logs
router.get('/organizations/:organizationId/audit-logs', (0, authorize_1.authorize)('organization', 'admin'), [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
], validation_1.validateRequest, enterpriseController.getAuditLogs);
exports.default = router;
//# sourceMappingURL=enterprise.js.map