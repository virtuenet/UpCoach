import 'express';

declare module 'express' {
  interface Request {
    session?: {
      csrfToken?: string;
      [key: string]: any;
    };
  }
}
