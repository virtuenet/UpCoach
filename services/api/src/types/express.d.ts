import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        organizationId?: number;
      };
      organization?: any;
      organizationRole?: string;
      id?: string;
      rawBody?: Buffer;
      startTime?: number;
      nonce?: string;
      metrics?: {
        route?: string;
        statusCode?: number;
      };
    }

    interface Response {
      __: (phrase: string, ...replace: any[]) => string;
      __n: (singular: string, plural: string, count: number) => string;
    }
  }
}

export type ExpressMiddleware = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => void | Promise<void>;
