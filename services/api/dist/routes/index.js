"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const auth_1 = require("../middleware/auth");
const advancedAnalytics_1 = __importDefault(require("./advancedAnalytics"));
const ai_1 = __importDefault(require("./ai"));
const financial_1 = __importDefault(require("./financial"));
const coachContent_1 = __importDefault(require("./coachContent"));
const referral_1 = __importDefault(require("./referral"));
const onboarding_1 = __importDefault(require("./onboarding"));
const forum_1 = __importDefault(require("./forum"));
const aiAnalytics_1 = __importDefault(require("./aiAnalytics"));
const auth_2 = __importDefault(require("./auth"));
const chat_1 = __importDefault(require("./chat"));
const cms_1 = __importDefault(require("./cms"));
const coach_1 = __importDefault(require("./coach"));
const csrf_1 = __importDefault(require("./csrf"));
const enterprise_1 = __importDefault(require("./enterprise"));
const gamification_1 = __importDefault(require("./gamification"));
const goals_1 = __importDefault(require("./goals"));
const mood_1 = __importDefault(require("./mood"));
const tasks_1 = __importDefault(require("./tasks"));
const twoFactorAuth_1 = __importDefault(require("./twoFactorAuth"));
const users_1 = __importDefault(require("./users"));
const setupRoutes = (app) => {
    const apiPrefix = '/api';
    app.use(`${apiPrefix}/auth`, auth_2.default);
    app.use(`${apiPrefix}`, csrf_1.default);
    app.use(`${apiPrefix}/2fa`, twoFactorAuth_1.default);
    app.use(`${apiPrefix}/users`, auth_1.authMiddleware, users_1.default);
    app.use(`${apiPrefix}/tasks`, auth_1.authMiddleware, tasks_1.default);
    app.use(`${apiPrefix}/goals`, auth_1.authMiddleware, goals_1.default);
    app.use(`${apiPrefix}/mood`, auth_1.authMiddleware, mood_1.default);
    app.use(`${apiPrefix}/chat`, auth_1.authMiddleware, chat_1.default);
    app.use(`${apiPrefix}/cms`, cms_1.default);
    app.use(`${apiPrefix}/coach-content`, auth_1.authMiddleware, coachContent_1.default);
    app.use(`${apiPrefix}/financial`, auth_1.authMiddleware, financial_1.default);
    app.use(`${apiPrefix}/ai`, auth_1.authMiddleware, ai_1.default);
    app.use(`${apiPrefix}/referrals`, referral_1.default);
    app.use(`${apiPrefix}/onboarding`, auth_1.authMiddleware, onboarding_1.default);
    app.use(`${apiPrefix}/forum`, forum_1.default);
    app.use(`${apiPrefix}/analytics`, auth_1.authMiddleware, aiAnalytics_1.default);
    app.use(`${apiPrefix}`, coach_1.default);
    app.use(`${apiPrefix}/advanced-analytics`, advancedAnalytics_1.default);
    app.use(`${apiPrefix}/gamification`, gamification_1.default);
    app.use(`${apiPrefix}/enterprise`, enterprise_1.default);
    app.get(`${apiPrefix}`, (_req, res) => {
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
exports.setupRoutes = setupRoutes;
//# sourceMappingURL=index.js.map