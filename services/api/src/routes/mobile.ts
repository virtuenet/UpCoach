/**
 * Mobile API Routes
 * Placeholder routes for mobile-specific functionality
 */

import { Router } from 'express';

const router = Router();

// Mobile app configuration
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      version: '1.0.0',
      features: {
        pushNotifications: true,
        biometricAuth: false,
        darkMode: true
      }
    }
  });
});

// Mobile device registration
router.post('/register-device', (req, res) => {
  res.json({
    success: true,
    message: 'Device registered successfully'
  });
});

export default router;