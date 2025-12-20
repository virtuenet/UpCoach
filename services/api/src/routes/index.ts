import { Application } from 'express';

import { authMiddleware } from '../middleware/auth';
import { tenantContextMiddleware } from '../middleware/tenantContext';

import advancedAnalyticsRoutes from './advancedAnalytics';
import aiRoutes from './ai';
import financialRoutes from './financial';
import coachContentRoutes from './coachContent';
import referralRoutes from './referral';
import onboardingRoutes from './onboarding';
import forumRoutes from './forum';
import aiAnalyticsRoutes from './aiAnalytics';
import performanceAnalyticsRoutes from './analytics/performance';
import analyticsV2Routes from './analyticsV2';
import authRoutes from './auth';
import googleAuthRoutes from './googleAuth';
import chatRoutes from './chat';
import cmsRoutes from './cms';
import coachRoutes from './coach';
import csrfRoutes from './csrf';
import enterpriseRoutes from './enterprise';
import gamificationRoutes from './gamification';
import progressRoutes from './progress';
import goalRoutes from './goals';
import habitRoutes from './habits';
import moodRoutes from './mood';
import taskRoutes from './tasks';
import twoFactorAuthRoutes from './twoFactorAuth';
import uploadRoutes from './upload';
import userRoutes from './users';
import userProfileRoutes from './user';
import voiceJournalRoutes from './voiceJournal';
import localLLMRouter from './localLLM';
import publicLandingRoutes from './public/landing';
import publicMobileContentRoutes from './public/mobile';
import larkRoutes from './lark';
import intelligenceRoutes from './intelligence';

// API v2 imports
import v2Routes from './v2';

// Mobile-specific imports
import mobileRoutes from './mobile';

export const setupRoutes = (app: Application): void => {
  const apiPrefix = '/api';

  // API v2 routes (new mobile-optimized endpoints)
  app.use(`${apiPrefix}/v2`, v2Routes);

  // Mobile-specific routes
  app.use(`${apiPrefix}/mobile`, mobileRoutes);

  // Public routes (no authentication required)
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/auth/google`, googleAuthRoutes);
  app.use(`${apiPrefix}`, csrfRoutes); // CSRF token endpoint
  app.use(`${apiPrefix}/public/landing`, publicLandingRoutes);
  app.use(`${apiPrefix}/public/mobile`, publicMobileContentRoutes);

  // Two-Factor Authentication routes (mixed public and protected)
  app.use(`${apiPrefix}/2fa`, twoFactorAuthRoutes);

  // Protected routes (authentication required)
  app.use(`${apiPrefix}/users`, authMiddleware, tenantContextMiddleware, userRoutes);
  app.use(`${apiPrefix}/user`, authMiddleware, tenantContextMiddleware, userProfileRoutes);
  app.use(`${apiPrefix}/tasks`, authMiddleware, tenantContextMiddleware, taskRoutes);
  app.use(`${apiPrefix}/goals`, authMiddleware, tenantContextMiddleware, goalRoutes);
  app.use(`${apiPrefix}/habits`, authMiddleware, tenantContextMiddleware, habitRoutes);
  app.use(`${apiPrefix}/mood`, authMiddleware, tenantContextMiddleware, moodRoutes);
  app.use(`${apiPrefix}/chat`, authMiddleware, tenantContextMiddleware, chatRoutes);
  app.use(`${apiPrefix}/upload`, uploadRoutes);

  // CMS routes (mixed public and protected)
  app.use(`${apiPrefix}/cms`, cmsRoutes);

  // Coach content routes (protected)
  app.use(`${apiPrefix}/coach-content`, authMiddleware, tenantContextMiddleware, coachContentRoutes);

  // Financial routes (protected)
  app.use(`${apiPrefix}/financial`, authMiddleware, tenantContextMiddleware, financialRoutes);

  // AI routes (protected)
  app.use(`${apiPrefix}/ai`, authMiddleware, tenantContextMiddleware, aiRoutes);

  // Local LLM routes (protected)
  app.use(`${apiPrefix}/local-llm`, authMiddleware, tenantContextMiddleware, localLLMRouter);

  // Voice Journal routes (protected)
  app.use(`${apiPrefix}/voice-journal`, authMiddleware, tenantContextMiddleware, voiceJournalRoutes);

  // Referral routes (mixed public and protected)
  app.use(`${apiPrefix}/referrals`, referralRoutes);

  // Onboarding routes (protected)
  app.use(`${apiPrefix}/onboarding`, authMiddleware, tenantContextMiddleware, onboardingRoutes);

  // Forum routes (mixed public and protected)
  app.use(`${apiPrefix}/forum`, forumRoutes);

  // AI Analytics routes (admin only)
  app.use(`${apiPrefix}/analytics`, authMiddleware, tenantContextMiddleware, aiAnalyticsRoutes);

  // Performance Analytics routes (public for client reporting, admin for dashboard)
  app.use(`${apiPrefix}/analytics`, performanceAnalyticsRoutes);
  app.use(`${apiPrefix}/analytics/v2`, authMiddleware, tenantContextMiddleware, analyticsV2Routes);

  // Coach marketplace routes (mixed public and protected)
  app.use(`${apiPrefix}`, coachRoutes);

  // Advanced analytics routes (protected)
  app.use(`${apiPrefix}/advanced-analytics`, advancedAnalyticsRoutes);

  // Gamification routes (protected)
  app.use(`${apiPrefix}/gamification`, gamificationRoutes);
  app.use(`${apiPrefix}/progress`, authMiddleware, tenantContextMiddleware, progressRoutes);

  // Enterprise routes (mixed public and protected)
  app.use(`${apiPrefix}/enterprise`, enterpriseRoutes);

  // Lark integration routes (webhook is public, others protected)
  app.use(`${apiPrefix}/lark`, larkRoutes);

  // Intelligence routes (anomaly detection, NL queries)
  app.use(`${apiPrefix}/intelligence`, authMiddleware, tenantContextMiddleware, intelligenceRoutes);

  // API info endpoint
  app.get(`${apiPrefix}`, (_req, res) => {
    (res as unknown).json({
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
