import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, _res: Response): void => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
  });

  _res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint was not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
}; 