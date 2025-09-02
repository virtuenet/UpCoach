import { Request, Response } from 'express';
export declare class EnterpriseController {
    private organizationService;
    private ssoService;
    private teamService;
    constructor();
    createOrganization: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateOrganization: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getOrganizationDetails: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getOrganizationMembers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    inviteMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    acceptInvitation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    removeMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createTeam: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateTeam: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTeams: (req: Request, res: Response, next: import("express").NextFunction) => void;
    addTeamMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    removeTeamMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    configureSSOProvider: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSSOProviders: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateSSOProvider: (req: Request, res: Response, next: import("express").NextFunction) => void;
    initiateSSOLogin: (req: Request, res: Response, next: import("express").NextFunction) => void;
    handleSAMLCallback: (req: Request, res: Response, next: import("express").NextFunction) => void;
    handleOIDCCallback: (req: Request, res: Response, next: import("express").NextFunction) => void;
    ssoLogout: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createPolicy: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPolicies: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAuditLogs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    private generateJWT;
}
//# sourceMappingURL=EnterpriseController.d.ts.map