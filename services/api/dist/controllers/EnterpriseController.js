"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseController = void 0;
const OrganizationService_1 = require("../services/enterprise/OrganizationService");
const SSOService_1 = require("../services/enterprise/SSOService");
const TeamService_1 = require("../services/enterprise/TeamService");
const catchAsync_1 = require("../utils/catchAsync");
const errors_1 = require("../utils/errors");
const UnifiedEmailService_1 = __importDefault(require("../services/email/UnifiedEmailService"));
class EnterpriseController {
    organizationService;
    ssoService;
    teamService;
    constructor() {
        this.organizationService = new OrganizationService_1.OrganizationService();
        this.ssoService = new SSOService_1.SSOService();
        this.teamService = new TeamService_1.TeamService();
    }
    // Organization Management
    createOrganization = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { name, website, industry, size, billingEmail } = req.body;
        const ownerId = req.user.id;
        const organization = await this.organizationService.createOrganization({
            name,
            website,
            industry,
            size,
            billingEmail,
            ownerId: parseInt(ownerId),
        });
        _res.status(201).json({
            success: true,
            data: { organization },
        });
    });
    updateOrganization = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const updates = req.body;
        const organization = await this.organizationService.updateOrganization(parseInt(organizationId), updates);
        _res.json({
            success: true,
            data: { organization },
        });
    });
    getOrganizationDetails = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const [organization, stats] = await Promise.all([
            this.organizationService.getOrganizationById(parseInt(organizationId)),
            this.organizationService.getOrganizationStats(parseInt(organizationId)),
        ]);
        _res.json({
            success: true,
            data: { organization, stats },
        });
    });
    getOrganizationMembers = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const { page, limit, search, role, teamId } = req.query;
        const result = await this.organizationService.getOrganizationMembers(parseInt(organizationId), {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            search: search,
            role: role,
            teamId: teamId ? parseInt(teamId) : undefined,
        });
        _res.json({
            success: true,
            data: result,
        });
    });
    inviteMember = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const { email, role, teamIds } = req.body;
        const invitedBy = req.user.id;
        const { invitationId, token } = await this.organizationService.inviteMember(parseInt(organizationId), {
            email,
            role,
            teamIds,
            invitedBy: parseInt(invitedBy),
        });
        // Get organization details for email
        const organization = await this.organizationService.getOrganizationById(parseInt(organizationId));
        // Get inviter details
        const inviter = await this.teamService.getUserById(parseInt(invitedBy));
        // Send invitation email
        await UnifiedEmailService_1.default.send({
            to: email,
            subject: `Invitation to join ${organization.name}`,
            template: 'team-invitation',
            data: {
                organizationName: organization.name,
                inviterName: inviter.fullName || inviter.email,
                invitationToken: token,
            },
        });
        const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
        _res.status(201).json({
            success: true,
            data: {
                invitationId,
                inviteUrl,
                message: 'Invitation sent successfully',
            },
        });
    });
    acceptInvitation = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { token } = req.body;
        const userId = req.user.id;
        await this.organizationService.acceptInvitation(token, parseInt(userId));
        _res.json({
            success: true,
            message: 'Invitation accepted successfully',
        });
    });
    removeMember = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId, userId } = req.params;
        const removedBy = req.user.id;
        await this.organizationService.removeMember(parseInt(organizationId), parseInt(userId), parseInt(removedBy));
        _res.json({
            success: true,
            message: 'Member removed successfully',
        });
    });
    // Team Management
    createTeam = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const { name, description, department, managerId } = req.body;
        const team = await this.teamService.createTeam({
            organizationId: parseInt(organizationId),
            name,
            description,
            department,
            managerId,
        });
        _res.status(201).json({
            success: true,
            data: { team },
        });
    });
    updateTeam = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { teamId } = req.params;
        const updates = req.body;
        const team = await this.teamService.updateTeam(parseInt(teamId), updates);
        _res.json({
            success: true,
            data: { team },
        });
    });
    getTeams = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const teams = await this.teamService.getOrganizationTeams(parseInt(organizationId));
        _res.json({
            success: true,
            data: { teams },
        });
    });
    addTeamMember = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { teamId } = req.params;
        const { userId, role } = req.body;
        const addedBy = req.user.id;
        await this.teamService.addTeamMember(parseInt(teamId), parseInt(userId), role, parseInt(addedBy));
        _res.json({
            success: true,
            message: 'Team member added successfully',
        });
    });
    removeTeamMember = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { teamId, userId } = req.params;
        await this.teamService.removeTeamMember(parseInt(teamId), parseInt(userId));
        _res.json({
            success: true,
            message: 'Team member removed successfully',
        });
    });
    // SSO Management
    configureSSOProvider = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const ssoConfig = req.body;
        const configId = await this.ssoService.createSSOConfiguration(parseInt(organizationId), ssoConfig);
        _res.status(201).json({
            success: true,
            data: {
                configId,
                message: 'SSO configuration created successfully',
            },
        });
    });
    getSSOProviders = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const providers = await this.ssoService.getOrganizationSSOProviders(parseInt(organizationId));
        _res.json({
            success: true,
            data: { providers },
        });
    });
    updateSSOProvider = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { configId } = req.params;
        const updates = req.body;
        await this.ssoService.updateSSOConfiguration(parseInt(configId), updates);
        _res.json({
            success: true,
            message: 'SSO configuration updated successfully',
        });
    });
    // SSO Authentication Flow
    initiateSSOLogin = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { configId } = req.params;
        const loginUrl = await this.ssoService.initiateSAMLLogin(parseInt(configId));
        _res.redirect(loginUrl);
    });
    handleSAMLCallback = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { configId } = req.params;
        const { SAMLResponse } = req.body;
        const { user, sessionId } = await this.ssoService.handleSAMLCallback(parseInt(configId), SAMLResponse);
        // Generate JWT token
        const token = this.generateJWT(parseInt(user.id), sessionId);
        // Redirect to frontend with token
        _res.redirect(`${process.env.FRONTEND_URL}/sso-callback?token=${token}`);
    });
    handleOIDCCallback = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { configId } = req.params;
        const { code, state } = req.query;
        // Retrieve code verifier from session using state
        const { sessionStore } = require('../services/enterprise/SessionStore');
        const codeVerifier = await sessionStore.getCodeVerifier(state);
        if (!codeVerifier) {
            throw new errors_1.AppError('Invalid or expired state parameter', 400);
        }
        const { user, sessionId } = await this.ssoService.handleOIDCCallback(parseInt(configId), code, codeVerifier);
        // Clean up session
        await sessionStore.deleteSession(state);
        // Generate JWT token
        const token = this.generateJWT(parseInt(user.id), sessionId);
        // Redirect to frontend with token
        _res.redirect(`${process.env.FRONTEND_URL}/sso-callback?token=${token}`);
    });
    ssoLogout = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const sessionId = req.headers['x-sso-session'];
        if (sessionId) {
            const logoutUrl = await this.ssoService.initiateSSOLogout(sessionId);
            if (logoutUrl) {
                return _res.json({
                    success: true,
                    data: { logoutUrl },
                });
            }
        }
        _res.json({
            success: true,
            message: 'Logged out successfully',
        });
    });
    // Enterprise Policies
    createPolicy = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const { name, type, rules, enforcementLevel, appliesTo } = req.body;
        const createdBy = req.user.id;
        const policy = await this.teamService.createPolicy({
            organizationId: parseInt(organizationId),
            name,
            type,
            rules,
            enforcementLevel,
            appliesTo,
            createdBy: parseInt(createdBy),
        });
        _res.status(201).json({
            success: true,
            data: { policy },
        });
    });
    getPolicies = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const policies = await this.teamService.getOrganizationPolicies(parseInt(organizationId));
        _res.json({
            success: true,
            data: { policies },
        });
    });
    // Enterprise Audit Logs
    getAuditLogs = (0, catchAsync_1.catchAsync)(async (req, _res) => {
        const { organizationId } = req.params;
        const { page, limit, action, userId, startDate, endDate } = req.query;
        const logs = await this.teamService.getAuditLogs(parseInt(organizationId), {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            action: action,
            userId: userId ? parseInt(userId) : undefined,
            startDate: startDate,
            endDate: endDate,
        });
        _res.json({
            success: true,
            data: logs,
        });
    });
    // Utility methods
    generateJWT(userId, sessionId) {
        const jwt = require('jsonwebtoken');
        const payload = {
            userId,
            sessionId,
            type: 'sso',
        };
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '8h', // Match SSO session duration
            issuer: 'upcoach-sso',
        });
    }
}
exports.EnterpriseController = EnterpriseController;
//# sourceMappingURL=EnterpriseController.js.map