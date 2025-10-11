/**
 * Local LLM Routes
 * Placeholder routes for local LLM functionality
 */

import { Router } from 'express';
import LocalLLMController from '../controllers/ai/LocalLLMController';

const router = Router();

// Process query with local LLM
router.post('/query', LocalLLMController.processQuery);

// Get local LLM status
router.get('/status', LocalLLMController.getStatus);

export default router;