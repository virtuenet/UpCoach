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

/**
 * @swagger
 * tags:
 *   - name: Enterprise
 *     description: Enterprise organization, team, SSO, and policy management
 */

/**
 * @swagger
 * /api/enterprise/organizations:
 *   post:
 *     summary: Create organization
 *     description: Create a new enterprise organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - billingEmail
 *             properties:
 *               name:
 *                 type: string
 *                 description: Organization name
 *               billingEmail:
 *                 type: string
 *                 format: email
 *                 description: Billing contact email
 *               size:
 *                 type: string
 *                 enum: [small, medium, large, enterprise]
 *                 description: Organization size
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}:
 *   put:
 *     summary: Update organization
 *     description: Update an existing organization's details
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               billingEmail:
 *                 type: string
 *                 format: email
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Organization updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put(
  '/organizations/:organizationId',
  authorize('organization', 'admin'),
  enterpriseController.updateOrganization
);

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}:
 *   get:
 *     summary: Get organization details
 *     description: Retrieve detailed information about an organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/organizations/:organizationId',
  authorize('organization', 'member'),
  enterpriseController.getOrganizationDetails
);

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/members:
 *   get:
 *     summary: List organization members
 *     description: Get paginated list of organization members
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Members list retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/invitations:
 *   post:
 *     summary: Invite member to organization
 *     description: Send an invitation to join the organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [member, manager, admin]
 *               teamIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Invitation sent
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
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

/**
 * @swagger
 * /api/enterprise/invitations/accept:
 *   post:
 *     summary: Accept organization invitation
 *     description: Accept an invitation to join an organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Invitation token
 *     responses:
 *       200:
 *         description: Invitation accepted
 *       400:
 *         description: Invalid or expired token
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/invitations/accept',
  [body('token').notEmpty()],
  validateRequest,
  enterpriseController.acceptInvitation
);

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/members/{userId}:
 *   delete:
 *     summary: Remove organization member
 *     description: Remove a member from the organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/organizations/:organizationId/members/:userId',
  authorize('organization', 'admin'),
  enterpriseController.removeMember
);

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/teams:
 *   post:
 *     summary: Create team
 *     description: Create a new team within the organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: Team created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
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

/**
 * @swagger
 * /api/enterprise/teams/{teamId}:
 *   put:
 *     summary: Update team
 *     description: Update team details
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Team updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/teams/:teamId', authorize('team', 'lead'), enterpriseController.updateTeam);

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/teams:
 *   get:
 *     summary: List teams
 *     description: Get all teams in the organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teams list retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/organizations/:organizationId/teams',
  authorize('organization', 'member'),
  enterpriseController.getTeams
);

/**
 * @swagger
 * /api/enterprise/teams/{teamId}/members:
 *   post:
 *     summary: Add team member
 *     description: Add a member to the team
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: integer
 *               role:
 *                 type: string
 *                 enum: [member, lead, admin]
 *     responses:
 *       201:
 *         description: Member added to team
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/teams/:teamId/members',
  authorize('team', 'lead'),
  [body('userId').isInt(), body('role').isIn(['member', 'lead', 'admin'])],
  validateRequest,
  enterpriseController.addTeamMember
);

/**
 * @swagger
 * /api/enterprise/teams/{teamId}/members/{userId}:
 *   delete:
 *     summary: Remove team member
 *     description: Remove a member from the team
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed from team
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete(
  '/teams/:teamId/members/:userId',
  authorize('team', 'lead'),
  enterpriseController.removeTeamMember
);

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/sso:
 *   post:
 *     summary: Configure SSO provider
 *     description: Configure Single Sign-On for the organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - enabled
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [saml, oidc, google, microsoft, okta]
 *               enabled:
 *                 type: boolean
 *               allowedDomains:
 *                 type: array
 *                 items:
 *                   type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: SSO configured
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
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

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/sso:
 *   get:
 *     summary: Get SSO providers
 *     description: List configured SSO providers for the organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSO providers retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/organizations/:organizationId/sso',
  authorize('organization', 'admin'),
  enterpriseController.getSSOProviders
);

/**
 * @swagger
 * /api/enterprise/sso/{configId}:
 *   put:
 *     summary: Update SSO configuration
 *     description: Update SSO provider settings
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSO configuration updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put(
  '/sso/:configId',
  authorize('organization', 'owner'),
  enterpriseController.updateSSOProvider
);

/**
 * @swagger
 * /api/enterprise/sso/login/{configId}:
 *   get:
 *     summary: Initiate SSO login
 *     description: Begin SSO authentication flow
 *     tags: [Enterprise]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to identity provider
 */
// SSO authentication endpoints (no auth required)
router.get('/sso/login/:configId', enterpriseController.initiateSSOLogin);

/**
 * @swagger
 * /api/enterprise/sso/saml/callback/{configId}:
 *   post:
 *     summary: SAML callback
 *     description: Handle SAML authentication response
 *     tags: [Enterprise]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.post('/sso/saml/callback/:configId', enterpriseController.handleSAMLCallback);

/**
 * @swagger
 * /api/enterprise/sso/oidc/callback/{configId}:
 *   get:
 *     summary: OIDC callback
 *     description: Handle OpenID Connect authentication response
 *     tags: [Enterprise]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.get('/sso/oidc/callback/:configId', enterpriseController.handleOIDCCallback);

/**
 * @swagger
 * /api/enterprise/sso/logout:
 *   post:
 *     summary: SSO logout
 *     description: Logout from SSO session
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/sso/logout', authenticate, enterpriseController.ssoLogout);

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/policies:
 *   post:
 *     summary: Create policy
 *     description: Create a new enterprise policy
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - rules
 *               - enforcementLevel
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [security, data_retention, access_control, compliance]
 *               rules:
 *                 type: object
 *               enforcementLevel:
 *                 type: string
 *                 enum: [soft, hard]
 *     responses:
 *       201:
 *         description: Policy created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
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

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/policies:
 *   get:
 *     summary: Get policies
 *     description: List all policies for the organization
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Policies retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/organizations/:organizationId/policies',
  authorize('organization', 'member'),
  enterpriseController.getPolicies
);

/**
 * @swagger
 * /api/enterprise/policies/{policyId}:
 *   put:
 *     summary: Update policy
 *     description: Update an existing policy
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [security, data_retention, access_control, compliance]
 *               rules:
 *                 type: object
 *               enforcementLevel:
 *                 type: string
 *                 enum: [soft, hard]
 *               appliesTo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Policy updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
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

/**
 * @swagger
 * /api/enterprise/policies/{policyId}:
 *   delete:
 *     summary: Delete policy
 *     description: Delete a policy
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Policy deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete(
  '/policies/:policyId',
  authorize('organization', 'admin'),
  [
    param('policyId').isInt({ min: 1 }),
  ],
  validateRequest,
  enterpriseController.deletePolicy
);

/**
 * @swagger
 * /api/enterprise/policies/{policyId}/toggle:
 *   patch:
 *     summary: Toggle policy
 *     description: Enable or disable a policy
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Policy toggled
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
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

/**
 * @swagger
 * /api/enterprise/organizations/{organizationId}/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve organization audit logs with filtering
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       action:
 *                         type: string
 *                       actor:
 *                         type: object
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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
