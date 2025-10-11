/**
 * Local LLM Controller
 * Placeholder implementation for local LLM operations
 */

import { Request, Response } from 'express';

export class LocalLLMController {
  static async processQuery(req: Request, res: Response) {
    res.status(501).json({
      success: false,
      message: 'Local LLM functionality not implemented'
    });
  }

  static async getStatus(req: Request, res: Response) {
    res.json({
      success: true,
      status: 'offline',
      message: 'Local LLM service not configured'
    });
  }
}

export default LocalLLMController;