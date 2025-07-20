import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Validation middleware to check express-validator results
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
    return;
  }
  
  next();
}; 