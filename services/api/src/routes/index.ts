import { Application } from 'express';

import { authMiddleware } from '../middleware/auth';

import advancedAnalyticsRoutes from './advancedAnalytics';
import aiRoutes from './ai';
import financialRoutes from './financial';
import coachContentRoutes from './coachContent';
import referralRoutes from './referral';
import onboardingRoutes from './onboarding';
import forumRoutes from './forum';
import aiAnalyticsRoutes from './aiAnalytics';
import performanceAnalyticsRoutes from './analytics/performance';
import authRoutes from './auth';
import googleAuthRoutes from './googleAuth';
import chatRoutes from './chat';
import cmsRoutes from './cms';
import coachRoutes from './coach';
import csrfRoutes from './csrf';
import enterpriseRoutes from './enterprise';
import gamificationRoutes from './gamification';
import goalRoutes from './goals';
import moodRoutes from './mood';
import taskRoutes from './tasks';
import twoFactorAuthRoutes from './twoFactorAuth';
import userRoutes from './users';
import voiceJournalRoutes from './voiceJournal';

// API v2 imports
import v2Routes from './v2';


export const setupRoutes = (app: Application): void => {
  const apiPrefix = '/api';

  // API v2 routes (new mobile-optimized endpoints)
  app.use(`${apiPrefix}/v2`, v2Routes);

  // Public routes (no authentication required)
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/auth/google`, googleAuthRoutes);
  app.use(`${apiPrefix}`, csrfRoutes); // CSRF token endpoint

  // Two-Factor Authentication routes (mixed public and protected)
  app.use(`${apiPrefix}/2fa`, twoFactorAuthRoutes);

  // Protected routes (authentication required)
  app.use(`${apiPrefix}/users`, authMiddleware, userRoutes);
  app.use(`${apiPrefix}/tasks`, authMiddleware, taskRoutes);
  app.use(`${apiPrefix}/goals`, authMiddleware, goalRoutes);
  app.use(`${apiPrefix}/mood`, authMiddleware, moodRoutes);
  app.use(`${apiPrefix}/chat`, authMiddleware, chatRoutes);

  // CMS routes (mixed public and protected)
  app.use(`${apiPrefix}/cms`, cmsRoutes);

  // Coach content routes (protected)
  app.use(`${apiPrefix}/coach-content`, authMiddleware, coachContentRoutes);

  // Financial routes (protected)
  app.use(`${apiPrefix}/financial`, authMiddleware, financialRoutes);

  // AI routes (protected)
  app.use(`${apiPrefix}/ai`, authMiddleware, aiRoutes);

  // Voice Journal routes (protected)
  app.use(`${apiPrefix}/voice-journal`, authMiddleware, voiceJournalRoutes);

  // Referral routes (mixed public and protected)
  app.use(`${apiPrefix}/referrals`, referralRoutes);

  // Onboarding routes (protected)
  app.use(`${apiPrefix}/onboarding`, authMiddleware, onboardingRoutes);

  // Forum routes (mixed public and protected)
  app.use(`${apiPrefix}/forum`, forumRoutes);

  // AI Analytics routes (admin only)
  app.use(`${apiPrefix}/analytics`, authMiddleware, aiAnalyticsRoutes);

  // Performance Analytics routes (public for client reporting, admin for dashboard)
  app.use(`${apiPrefix}/analytics`, performanceAnalyticsRoutes);

  // Coach marketplace routes (mixed public and protected)
  app.use(`${apiPrefix}`, coachRoutes);

  // Advanced analytics routes (protected)
  app.use(`${apiPrefix}/advanced-analytics`, advancedAnalyticsRoutes);

  // Gamification routes (protected)
  app.use(`${apiPrefix}/gamification`, gamificationRoutes);

  // Enterprise routes (mixed public and protected)
  app.use(`${apiPrefix}/enterprise`, enterpriseRoutes);

  // API info endpoint
  app.get(`${apiPrefix}`, (_req, res) => {
    (res as any).json({
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
          googleSignIn: 'POST /api/auth/google/signin',
          googleRefresh: 'POST /api/auth/google/refresh',
        },
        v2: {
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
        ai: {
          userProfile: 'GET /api/ai/profile',
          updatePreferences: 'PUT /api/ai/profile/preferences',
          refreshProfile: 'POST /api/ai/profile/refresh',
          insights: 'GET /api/ai/insights',
          recommendations: 'GET /api/ai/recommendations',
          readinessAssessment: 'GET /api/ai/assessment/readiness',
        },
        onboarding: {
          status: 'GET /api/onboarding/status',
          complete: 'POST /api/onboarding/complete',
          skip: 'POST /api/onboarding/skip',
        },
        forum: {
          categories: 'GET /api/forum/categories',
          threads: 'GET /api/forum/threads',
          thread: 'GET /api/forum/threads/:threadId',
          createThread: 'POST /api/forum/threads',
          createPost: 'POST /api/forum/posts',
          votePost: 'POST /api/forum/posts/:postId/vote',
          editPost: 'PUT /api/forum/posts/:postId',
          deletePost: 'DELETE /api/forum/posts/:postId',
        },
      },
      status: 'operational',
      timestamp: new Date().toISOString(),
    });
  });
};
