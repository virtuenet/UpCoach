import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { initializeDatabase } from '../helpers/database.helper';
import { errorMiddleware } from '../../middleware/error';
import authRoutes from '../../routes/auth';
import userRoutes from '../../routes/users';
import { logger } from '../../utils/logger';

export async function createTestApp(): Promise<Express> {
  const app: Express = express();

  // Initialize database for testing
  await initializeDatabase();

  // Disable rate limiting in test environment
  app.set('trust proxy', 1);

  // Basic middleware
  app.use(cors());
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);

  // Health check for tests
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', environment: 'test' });
  });

  // Error handling
  app.use(errorMiddleware);

  return app;
}

export function createMockResponse() {
  const res: unknown = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

export function createMockRequest(overrides: unknown = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  };
}