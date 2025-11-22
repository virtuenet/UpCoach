import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      // User authentication
      user?: {
        id: number;
        email: string;
        role: string;
        organizationId?: number;
      };
      userId?: number;
      userRole?: string;
      userPermissions?: string[];
      userContext?: unknown;

      // Organization
      organization?: unknown;
      organizationRole?: string;

      // Session
      id?: string;
      sessionID?: string;

      // Security
      nonce?: string;
      csrfToken?: () => Promise<string>;
      resource?: string;

      // Request tracking
      rawBody?: Buffer;
      startTime?: number;
      metrics?: {
        route?: string;
        statusCode?: number;
      };

      // Allow dynamic properties for validation and other middleware
      [key: string]: unknown;
    }

    interface Response {
      __: (phrase: string, ...replace: unknown[]) => string;
      __n: (singular: string, plural: string, count: number) => string;
    }
  }
}

export type ExpressMiddleware = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => void | Promise<void>;
