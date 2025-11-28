/**
 * Local LLM Routes
 * Routes for on-device AI inference using local LLM models
 */

import { Router } from 'express';
import LocalLLMController from '../controllers/ai/LocalLLMController';

const router = Router();

// Process query with local LLM
router.post('/query', LocalLLMController.processQuery);

// Get local LLM status
router.get('/status', LocalLLMController.getStatus);

// Health check endpoint
router.get('/health', LocalLLMController.healthCheck);

// Load model endpoint
router.post('/load', LocalLLMController.loadModel);

// Unload model endpoint
router.post('/unload', LocalLLMController.unloadModel);

export default router;