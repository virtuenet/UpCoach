import { Application } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import taskRoutes from './tasks';
import goalRoutes from './goals';
import moodRoutes from './mood';
import chatRoutes from './chat';
import cmsRoutes from './cms';
import financialRoutes from './financial';
import { authMiddleware } from '../middleware/auth';

export const setupRoutes = (app: Application): void => {
  const apiPrefix = '/api';

  // Public routes (no authentication required)
  app.use(`${apiPrefix}/auth`, authRoutes);

  // Protected routes (authentication required)
  app.use(`${apiPrefix}/users`, authMiddleware, userRoutes);
  app.use(`${apiPrefix}/tasks`, authMiddleware, taskRoutes);
  app.use(`${apiPrefix}/goals`, authMiddleware, goalRoutes);
  app.use(`${apiPrefix}/mood`, authMiddleware, moodRoutes);
  app.use(`${apiPrefix}/chat`, authMiddleware, chatRoutes);
  
  // CMS routes (mixed public and protected)
  app.use(`${apiPrefix}/cms`, cmsRoutes);
  
  // Financial routes (protected)
  app.use(`${apiPrefix}/financial`, authMiddleware, financialRoutes);

  // API info endpoint
  app.get(`${apiPrefix}`, (req, res) => {
    res.json({
      name: 'UpCoach Backend API',
      version: '1.0.0',
      description: 'Personal coaching and development platform API',
      documentation: 'https://github.com/your-repo/upcoach-api',
      endpoints: {
        authentication: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register',
          refresh: 'POST /api/auth/refresh',
          logout: 'POST /api/auth/logout',
        },
        users: {
          profile: 'GET /api/users/profile',
          updateProfile: 'PUT /api/users/profile',
          changePassword: 'POST /api/users/change-password',
          statistics: 'GET /api/users/statistics',
          deleteAccount: 'DELETE /api/users/account',
        },
        tasks: {
          list: 'GET /api/tasks',
          create: 'POST /api/tasks',
          get: 'GET /api/tasks/:id',
          update: 'PUT /api/tasks/:id',
          delete: 'DELETE /api/tasks/:id',
          complete: 'POST /api/tasks/:id/complete',
        },
        goals: {
          list: 'GET /api/goals',
          create: 'POST /api/goals',
          get: 'GET /api/goals/:id',
          update: 'PUT /api/goals/:id',
          delete: 'DELETE /api/goals/:id',
          milestones: 'GET /api/goals/:id/milestones',
          addMilestone: 'POST /api/goals/:id/milestones',
          updateMilestone: 'PUT /api/goals/:goalId/milestones/:id',
          deleteMilestone: 'DELETE /api/goals/:goalId/milestones/:id',
        },
        mood: {
          list: 'GET /api/mood',
          create: 'POST /api/mood',
          get: 'GET /api/mood/:id',
          update: 'PUT /api/mood/:id',
          delete: 'DELETE /api/mood/:id',
          insights: 'GET /api/mood/insights',
        },
        chat: {
          conversations: 'GET /api/chat/conversations',
          createConversation: 'POST /api/chat/conversations',
          getConversation: 'GET /api/chat/conversations/:id',
          sendMessage: 'POST /api/chat/conversations/:id/messages',
          getMessages: 'GET /api/chat/conversations/:id/messages',
        },
      },
      status: 'operational',
      timestamp: new Date().toISOString(),
    });
  });
};