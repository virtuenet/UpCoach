import { Router } from 'express';
import googleRouter from './google';

const router = Router();

// Mount Google authentication routes
router.use('/google', googleRouter);

// Health check for v2 auth endpoints
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth v2 API is healthy',
    version: '2.0.0',
    endpoints: {
      google: {
        signin: 'POST /api/v2/auth/google/signin',
        refresh: 'POST /api/v2/auth/google/refresh',
        session: 'GET /api/v2/auth/google/session',
        link: 'POST /api/v2/auth/google/link',
        unlink: 'DELETE /api/v2/auth/google/unlink',
        status: 'GET /api/v2/auth/google/status',
        revoke: 'POST /api/v2/auth/google/revoke',
      },
    },
  });
});

export default router;