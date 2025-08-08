import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/enterprise/OrganizationService';
import { SSOService } from '../services/enterprise/SSOService';
import { TeamService } from '../services/enterprise/TeamService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import EmailService from '../services/email/EmailService';

export class EnterpriseController {
  private organizationService: OrganizationService;
  private ssoService: SSOService;
  private teamService: TeamService;

  constructor() {
    this.organizationService = new OrganizationService();
    this.ssoService = new SSOService();
    this.teamService = new TeamService();
  }

  // Organization Management
  createOrganization = catchAsync(async (req: Request, res: Response) => {
    const { name, website, industry, size, billingEmail } = req.body;
    const ownerId = req.user!.id;

    const organization = await this.organizationService.createOrganization({
      name,
      website,
      industry,
      size,
      billingEmail,
      ownerId: parseInt(ownerId as string),
    });

    res.status(201).json({
      success: true,
      data: { organization },
    });
  });

  updateOrganization = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const updates = req.body;

    const organization = await this.organizationService.updateOrganization(
      parseInt(organizationId as string),
      updates
    );

    res.json({
      success: true,
      data: { organization },
    });
  });

  getOrganizationDetails = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;

    const [organization, stats] = await Promise.all([
      this.organizationService.getOrganizationById(parseInt(organizationId)),
      this.organizationService.getOrganizationStats(parseInt(organizationId)),
    ]);

    res.json({
      success: true,
      data: { organization, stats },
    });
  });

  getOrganizationMembers = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { page, limit, search, role, teamId } = req.query;

    const result = await this.organizationService.getOrganizationMembers(
      parseInt(organizationId as string),
      {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        role: role as string,
        teamId: teamId ? parseInt(teamId as string) : undefined,
      }
    );

    res.json({
      success: true,
      data: result,
    });
  });

  inviteMember = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { email, role, teamIds } = req.body;
    const invitedBy = req.user!.id;

    const { invitationId, token } = await this.organizationService.inviteMember(
      parseInt(organizationId as string),
      {
        email,
        role,
        teamIds,
        invitedBy: parseInt(invitedBy as string),
      }
    );

    // Get organization details for email
    const organization = await this.organizationService.getOrganizationById(
      parseInt(organizationId)
    );
    
    // Get inviter details
    const inviter = await this.teamService.getUserById(parseInt(invitedBy as string));
    
    // Send invitation email
    await EmailService.sendInvitationEmail(
      email,
      organization!.name,
      inviter.fullName || inviter.email,
      token
    );

    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

    res.status(201).json({
      success: true,
      data: {
        invitationId,
        inviteUrl,
        message: 'Invitation sent successfully',
      },
    });
  });

  acceptInvitation = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.body;
    const userId = req.user!.id;

    await this.organizationService.acceptInvitation(token, parseInt(userId as string));

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
    });
  });

  removeMember = catchAsync(async (req: Request, res: Response) => {
    const { organizationId, userId } = req.params;
    const removedBy = req.user!.id;

    await this.organizationService.removeMember(
      parseInt(organizationId as string),
      parseInt(userId as string),
      parseInt(removedBy as string)
    );

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  });

  // Team Management
  createTeam = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { name, description, department, managerId } = req.body;

    const team = await this.teamService.createTeam({
      organizationId: parseInt(organizationId),
      name,
      description,
      department,
      managerId,
    });

    res.status(201).json({
      success: true,
      data: { team },
    });
  });

  updateTeam = catchAsync(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const updates = req.body;

    const team = await this.teamService.updateTeam(parseInt(teamId), updates);

    res.json({
      success: true,
      data: { team },
    });
  });

  getTeams = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;

    const teams = await this.teamService.getOrganizationTeams(
      parseInt(organizationId)
    );

    res.json({
      success: true,
      data: { teams },
    });
  });

  addTeamMember = catchAsync(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const { userId, role } = req.body;
    const addedBy = req.user!.id;

    await this.teamService.addTeamMember(
      parseInt(teamId as string),
      parseInt(userId as string),
      role,
      parseInt(addedBy as string)
    );

    res.json({
      success: true,
      message: 'Team member added successfully',
    });
  });

  removeTeamMember = catchAsync(async (req: Request, res: Response) => {
    const { teamId, userId } = req.params;

    await this.teamService.removeTeamMember(
      parseInt(teamId as string),
      parseInt(userId)
    );

    res.json({
      success: true,
      message: 'Team member removed successfully',
    });
  });

  // SSO Management
  configureSSOProvider = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const ssoConfig = req.body;

    const configId = await this.ssoService.createSSOConfiguration(
      parseInt(organizationId as string),
      ssoConfig
    );

    res.status(201).json({
      success: true,
      data: {
        configId,
        message: 'SSO configuration created successfully',
      },
    });
  });

  getSSOProviders = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;

    const providers = await this.ssoService.getOrganizationSSOProviders(
      parseInt(organizationId)
    );

    res.json({
      success: true,
      data: { providers },
    });
  });

  updateSSOProvider = catchAsync(async (req: Request, res: Response) => {
    const { configId } = req.params;
    const updates = req.body;

    await this.ssoService.updateSSOConfiguration(parseInt(configId), updates);

    res.json({
      success: true,
      message: 'SSO configuration updated successfully',
    });
  });

  // SSO Authentication Flow
  initiateSSOLogin = catchAsync(async (req: Request, res: Response) => {
    const { configId } = req.params;

    const loginUrl = await this.ssoService.initiateSAMLLogin(parseInt(configId));

    res.redirect(loginUrl);
  });

  handleSAMLCallback = catchAsync(async (req: Request, res: Response) => {
    const { configId } = req.params;
    const { SAMLResponse } = req.body;

    const { user, sessionId } = await this.ssoService.handleSAMLCallback(
      parseInt(configId),
      SAMLResponse
    );

    // Generate JWT token
    const token = this.generateJWT(parseInt(user.id as string), sessionId);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/sso-callback?token=${token}`);
  });

  handleOIDCCallback = catchAsync(async (req: Request, res: Response) => {
    const { configId } = req.params;
    const { code, state } = req.query;

    // Retrieve code verifier from session using state
    const { sessionStore } = require('../services/enterprise/SessionStore');
    const codeVerifier = await sessionStore.getCodeVerifier(state as string);
    
    if (!codeVerifier) {
      throw new AppError('Invalid or expired state parameter', 400);
    }

    const { user, sessionId } = await this.ssoService.handleOIDCCallback(
      parseInt(configId),
      code as string,
      codeVerifier
    );
    
    // Clean up session
    await sessionStore.deleteSession(state as string);

    // Generate JWT token
    const token = this.generateJWT(parseInt(user.id as string), sessionId);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/sso-callback?token=${token}`);
  });

  ssoLogout = catchAsync(async (req: Request, res: Response) => {
    const sessionId = req.headers['x-sso-session'] as string;

    if (sessionId) {
      const logoutUrl = await this.ssoService.initiateSSOLogout(sessionId);
      
      if (logoutUrl) {
        return res.json({
          success: true,
          data: { logoutUrl },
        });
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  // Enterprise Policies
  createPolicy = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { name, type, rules, enforcementLevel, appliesTo } = req.body;
    const createdBy = req.user!.id;

    const policy = await this.teamService.createPolicy({
      organizationId: parseInt(organizationId),
      name,
      type,
      rules,
      enforcementLevel,
      appliesTo,
      createdBy: parseInt(createdBy as string),
    });

    res.status(201).json({
      success: true,
      data: { policy },
    });
  });

  getPolicies = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;

    const policies = await this.teamService.getOrganizationPolicies(
      parseInt(organizationId)
    );

    res.json({
      success: true,
      data: { policies },
    });
  });

  // Enterprise Audit Logs
  getAuditLogs = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { page, limit, action, userId, startDate, endDate } = req.query;

    const logs = await this.teamService.getAuditLogs(
      parseInt(organizationId as string),
      {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
        action: action as string,
        userId: userId ? parseInt(userId as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
      }
    );

    res.json({
      success: true,
      data: logs,
    });
  });

  // Utility methods
  private generateJWT(userId: number, sessionId: string): string {
    const jwt = require('jsonwebtoken');
    
    const payload = {
      userId,
      sessionId,
      type: 'sso',
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '8h', // Match SSO session duration
      issuer: 'upcoach-sso',
    });
  }
}