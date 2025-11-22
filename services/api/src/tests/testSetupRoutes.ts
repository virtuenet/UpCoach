/**
 * Test-specific route setup
 * Loads routes needed for integration tests
 */

import { Application } from 'express';
import { authMiddleware } from '../middleware/auth';
import authRoutes from '../routes/auth';
import goalRoutes from '../routes/goals';
import habitRoutes from '../routes/habits';
import uploadRoutes from '../routes/upload';
import userRoutes from '../routes/users';
import userProfileRoutes from '../routes/user';

export const setupTestRoutes = (app: Application): void => {
  const apiPrefix = '/api'; // Match current route configuration

  // Public routes
  app.use(`${apiPrefix}/auth`, authRoutes);

  // Protected routes
  app.use(`${apiPrefix}/user`, authMiddleware, userProfileRoutes);
  app.use(`${apiPrefix}/users`, authMiddleware, userRoutes);
  app.use(`${apiPrefix}/goals`, authMiddleware, goalRoutes);
  app.use(`${apiPrefix}/habits`, authMiddleware, habitRoutes);
  app.use(`${apiPrefix}/upload`, uploadRoutes);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
};
