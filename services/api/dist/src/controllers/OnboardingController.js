"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const database_1 = require("../config/database");
const Goal_1 = require("../models/Goal");
const User_1 = require("../models/User");
const UserProfile_1 = require("../models/UserProfile");
const AIService_1 = require("../services/ai/AIService");
const AnalyticsService_1 = require("../services/analytics/AnalyticsService");
const logger_1 = require("../utils/logger");
class OnboardingEmailCampaignService {
    async triggerCampaign(userId, campaignType, userData) {
        try {
            const campaigns = {
                user_registered: {
                    sequence: [
                        { delay: 0, template: 'welcome', subject: 'Welcome to UpCoach!' },
                        { delay: 24, template: 'onboarding_step1', subject: 'Get started with your first session' },
                        { delay: 72, template: 'onboarding_step2', subject: 'Tips to make the most of UpCoach' },
                        { delay: 168, template: 'onboarding_week1', subject: 'How has your first week been?' },
                    ],
                },
                profile_completed: {
                    sequence: [
                        { delay: 0, template: 'profile_complete', subject: 'Your profile is ready!' },
                        { delay: 24, template: 'goal_setting_tips', subject: 'Setting effective goals' },
                    ],
                },
                goal_created: {
                    sequence: [
                        { delay: 0, template: 'goal_confirmation', subject: 'Your goal has been set!' },
                        { delay: 48, template: 'goal_progress_tips', subject: 'Tips for achieving your goal' },
                    ],
                },
                inactive_user: {
                    sequence: [
                        { delay: 0, template: 'come_back', subject: 'We miss you!' },
                        { delay: 48, template: 'success_stories', subject: 'See what others have achieved' },
                        { delay: 168, template: 'final_reminder', subject: 'Last chance to continue your journey' },
                    ],
                },
            };
            const campaign = campaigns[campaignType];
            if (!campaign) {
                logger_1.logger.warn('Unknown campaign type', { campaignType, userId });
                return;
            }
            for (const email of campaign.sequence) {
                await this.scheduleEmail(userId, email, userData);
            }
            await this.logCampaignEvent(userId, campaignType, 'triggered');
            logger_1.logger.info('Email campaign triggered', {
                userId,
                campaignType,
                emailCount: campaign.sequence.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to trigger email campaign', {
                error,
                userId,
                campaignType,
            });
        }
    }
    async scheduleEmail(userId, emailConfig, userData) {
        const scheduledAt = new Date(Date.now() + emailConfig.delay * 60 * 60 * 1000);
        try {
            await database_1.sequelize.query(`INSERT INTO email_queue
         (user_id, template, subject, scheduled_at, data, status, created_at)
         VALUES (:userId, :template, :subject, :scheduledAt, :data, 'pending', NOW())`, {
                replacements: {
                    userId,
                    template: emailConfig.template,
                    subject: emailConfig.subject,
                    scheduledAt,
                    data: JSON.stringify(userData || {}),
                },
            });
            logger_1.logger.debug('Email scheduled', {
                userId,
                template: emailConfig.template,
                scheduledAt,
                delay: emailConfig.delay,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to schedule email', {
                error,
                userId,
                template: emailConfig.template,
            });
        }
    }
    async logCampaignEvent(userId, campaignType, event) {
        try {
            await database_1.sequelize.query(`INSERT INTO email_campaign_events
         (user_id, campaign_type, event, created_at)
         VALUES (:userId, :campaignType, :event, NOW())`, {
                replacements: { userId, campaignType, event },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log campaign event', {
                error,
                userId,
                campaignType,
                event,
            });
        }
    }
    async pauseCampaign(userId, campaignType) {
        try {
            await database_1.sequelize.query(`UPDATE email_queue
         SET status = 'paused', updated_at = NOW()
         WHERE user_id = :userId
         AND template LIKE :campaignPattern
         AND status = 'pending'
         AND scheduled_at > NOW()`, {
                replacements: {
                    userId,
                    campaignPattern: `${campaignType}%`,
                },
            });
            await this.logCampaignEvent(userId, campaignType, 'paused');
            logger_1.logger.info('Email campaign paused', { userId, campaignType });
        }
        catch (error) {
            logger_1.logger.error('Failed to pause email campaign', {
                error,
                userId,
                campaignType,
            });
        }
    }
    async resumeCampaign(userId, campaignType) {
        try {
            await database_1.sequelize.query(`UPDATE email_queue
         SET status = 'pending', updated_at = NOW()
         WHERE user_id = :userId
         AND template LIKE :campaignPattern
         AND status = 'paused'`, {
                replacements: {
                    userId,
                    campaignPattern: `${campaignType}%`,
                },
            });
            await this.logCampaignEvent(userId, campaignType, 'resumed');
            logger_1.logger.info('Email campaign resumed', { userId, campaignType });
        }
        catch (error) {
            logger_1.logger.error('Failed to resume email campaign', {
                error,
                userId,
                campaignType,
            });
        }
    }
    async getCampaignStatus(userId) {
        try {
            const [campaigns] = await database_1.sequelize.query(`SELECT
           campaign_type,
           event,
           created_at
         FROM email_campaign_events
         WHERE user_id = :userId
         ORDER BY created_at DESC`, {
                replacements: { userId },
            });
            return campaigns;
        }
        catch (error) {
            logger_1.logger.error('Failed to get campaign status', { error, userId });
            return [];
        }
    }
}
const emailCampaignService = new OnboardingEmailCampaignService();
class OnboardingController {
    async completeOnboarding(req, _res) {
        const transaction = await database_1.sequelize.transaction();
        try {
            const userId = req.user.id;
            const onboardingData = req.body;
            const user = await User_1.User.findByPk(userId);
            if (!user) {
                await transaction.rollback();
                return _res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            if (onboardingData.profile.name) {
                user.name = onboardingData.profile.name;
            }
            user.onboardingCompleted = true;
            user.onboardingCompletedAt = new Date();
            await user.save({ transaction });
            const [userProfile, created] = await UserProfile_1.UserProfile.findOrCreate({
                where: { userId },
                defaults: {
                    userId,
                    age: onboardingData.profile.age,
                    occupation: onboardingData.profile.occupation,
                    timezone: onboardingData.profile.timezone || 'UTC',
                    coachingStyle: onboardingData.preferences.coachingStyle,
                    sessionFrequency: onboardingData.preferences.sessionFrequency,
                    commitmentLevel: onboardingData.availability.commitmentLevel,
                    preferences: {
                        focusAreas: onboardingData.preferences.focusAreas,
                        challenges: onboardingData.preferences.challenges,
                        preferredDays: onboardingData.availability.preferredDays,
                        preferredTimes: onboardingData.availability.preferredTimes,
                    },
                    aiPersonalization: {},
                },
                transaction,
            });
            if (!created) {
                await userProfile.update({
                    age: onboardingData.profile.age,
                    occupation: onboardingData.profile.occupation,
                    timezone: onboardingData.profile.timezone || userProfile.timezone,
                    coachingStyle: onboardingData.preferences.coachingStyle,
                    sessionFrequency: onboardingData.preferences.sessionFrequency,
                    commitmentLevel: onboardingData.availability.commitmentLevel,
                    preferences: {
                        ...userProfile.preferences,
                        focusAreas: onboardingData.preferences.focusAreas,
                        challenges: onboardingData.preferences.challenges,
                        preferredDays: onboardingData.availability.preferredDays,
                        preferredTimes: onboardingData.availability.preferredTimes,
                    },
                }, { transaction });
            }
            const goalPromises = onboardingData.goals.specificGoals.map(async (goalTitle) => {
                return Goal_1.Goal.create({
                    userId,
                    title: goalTitle,
                    category: onboardingData.goals.primaryGoal,
                    status: 'in_progress',
                    priority: 'high',
                    targetDate: this.calculateTargetDate(onboardingData.goals.timeline),
                    milestones: {
                        createdDuringOnboarding: true,
                        primaryGoal: onboardingData.goals.primaryGoal,
                    },
                }, { transaction });
            });
            await Promise.all(goalPromises);
            const aiPersonality = await this.generateAIPersonality(onboardingData);
            userProfile.aiPersonalization = aiPersonality;
            await userProfile.save({ transaction });
            await transaction.commit();
            this.triggerPostOnboardingActions(Number(userId), onboardingData);
            await emailCampaignService.triggerCampaign(userId.toString(), 'profile_completed', {
                name: onboardingData.profile.name,
                profileCompleteness: '100%',
                goalsCount: onboardingData.goals.specificGoals.length,
            });
            if (onboardingData.goals.specificGoals.length > 0) {
                await emailCampaignService.triggerCampaign(userId.toString(), 'goal_created', {
                    name: onboardingData.profile.name,
                    primaryGoal: onboardingData.goals.primaryGoal,
                    goalsCount: onboardingData.goals.specificGoals.length,
                    timeline: onboardingData.goals.timeline,
                });
            }
            await AnalyticsService_1.analyticsService.identify({
                userId: Number(userId),
                email: user.email,
                name: user.name,
                customTraits: {
                    onboardingCompleted: true,
                    primaryGoal: onboardingData.goals.primaryGoal,
                    coachingStyle: onboardingData.preferences.coachingStyle,
                    commitmentLevel: onboardingData.availability.commitmentLevel,
                },
            });
            await AnalyticsService_1.analyticsService.trackUserAction(Number(userId), 'Onboarding Completed', {
                goalsCount: onboardingData.goals.specificGoals.length,
                timeline: onboardingData.goals.timeline,
                coachingStyle: onboardingData.preferences.coachingStyle,
            });
            _res.json({
                success: true,
                data: {
                    message: 'Onboarding completed successfully',
                    nextSteps: [
                        'Your AI coach is being personalized',
                        'You will receive a welcome message shortly',
                        'Your first coaching session is ready',
                    ],
                },
            });
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to complete onboarding', { error, userId: req.user.id });
            _res.status(500).json({
                success: false,
                error: 'Failed to complete onboarding',
            });
        }
    }
    async getOnboardingStatus(req, _res) {
        try {
            const userId = req.user.id;
            const user = await User_1.User.findByPk(userId, {
                include: [
                    { model: UserProfile_1.UserProfile, as: 'profile' },
                    { model: Goal_1.Goal, as: 'goals' },
                ],
            });
            if (!user) {
                return _res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            const status = {
                completed: user.onboardingCompleted,
                completedAt: user.onboardingCompletedAt,
                hasProfile: !!user.profile,
                hasGoals: user.goals && user.goals.length > 0,
                progress: this.calculateOnboardingProgress(user),
            };
            _res.json({
                success: true,
                data: status,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get onboarding status', { error, userId: req.user.id });
            _res.status(500).json({
                success: false,
                error: 'Failed to get onboarding status',
            });
        }
    }
    async skipOnboarding(req, _res) {
        try {
            const userId = req.user.id;
            const user = await User_1.User.findByPk(userId, {
                include: [
                    { model: UserProfile_1.UserProfile, as: 'profile' },
                    { model: Goal_1.Goal, as: 'goals' },
                ],
            });
            if (!user) {
                return _res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            user.onboardingCompleted = true;
            user.onboardingSkipped = true;
            await user.save();
            await UserProfile_1.UserProfile.findOrCreate({
                where: { userId },
                defaults: {
                    userId,
                    coachingStyle: 'supportive',
                    commitmentLevel: 'regular',
                    preferences: {},
                    aiPersonalization: {},
                },
            });
            await AnalyticsService_1.analyticsService.trackUserAction(Number(userId), 'Onboarding Skipped');
            _res.json({
                success: true,
                data: {
                    message: 'Onboarding skipped',
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to skip onboarding', { error, userId: req.user.id });
            _res.status(500).json({
                success: false,
                error: 'Failed to skip onboarding',
            });
        }
    }
    calculateTargetDate(timeline) {
        const date = new Date();
        switch (timeline) {
            case '1-3 months':
                date.setMonth(date.getMonth() + 2);
                break;
            case '3-6 months':
                date.setMonth(date.getMonth() + 4);
                break;
            case '6-12 months':
                date.setMonth(date.getMonth() + 9);
                break;
            case '1+ years':
                date.setFullYear(date.getFullYear() + 1);
                break;
            default:
                date.setMonth(date.getMonth() + 3);
        }
        return date;
    }
    async generateAIPersonality(data) {
        const personality = {
            style: data.preferences.coachingStyle,
            traits: [],
            communication: {
                tone: '',
                approach: '',
                frequency: data.availability.commitmentLevel,
            },
            focusAreas: data.preferences.focusAreas,
        };
        switch (data.preferences.coachingStyle) {
            case 'supportive':
                personality.traits = ['empathetic', 'encouraging', 'patient'];
                personality.communication.tone = 'warm and supportive';
                personality.communication.approach = 'gentle guidance';
                break;
            case 'challenging':
                personality.traits = ['direct', 'motivating', 'results-oriented'];
                personality.communication.tone = 'direct and assertive';
                personality.communication.approach = 'challenge-focused';
                break;
            case 'analytical':
                personality.traits = ['logical', 'data-driven', 'strategic'];
                personality.communication.tone = 'professional and analytical';
                personality.communication.approach = 'evidence-based';
                break;
            case 'holistic':
                personality.traits = ['balanced', 'mindful', 'comprehensive'];
                personality.communication.tone = 'thoughtful and inclusive';
                personality.communication.approach = 'whole-person focused';
                break;
        }
        return personality;
    }
    async triggerPostOnboardingActions(userId, data) {
        try {
            await emailCampaignService.triggerCampaign(userId.toString(), 'user_registered', {
                name: data.profile.name,
                goals: data.goals?.specificGoals?.join(', ') || data.goals?.primaryGoal || 'general improvement',
                coachingStyle: data.preferences?.coachingStyle || 'balanced',
                commitmentLevel: data.availability?.commitmentLevel || 'moderate',
            });
            await AIService_1.aiService.createInitialSession(Number(userId), {
                goals: data.goals,
                preferences: data.preferences,
            });
            logger_1.logger.info('Post-onboarding actions triggered', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to trigger post-onboarding actions', { error, userId });
        }
    }
    calculateOnboardingProgress(user) {
        let progress = 0;
        const steps = 5;
        let completedSteps = 0;
        if (user.name)
            completedSteps++;
        if (user.profile)
            completedSteps++;
        if (user.goals && user.goals.length > 0)
            completedSteps++;
        if (user.profile?.coachingStyle)
            completedSteps++;
        if (user.profile?.commitmentLevel)
            completedSteps++;
        progress = (completedSteps / steps) * 100;
        return Math.round(progress);
    }
    async pauseEmailCampaign(req, _res) {
        try {
            const userId = req.user.id;
            const { campaignType } = req.body;
            if (!campaignType) {
                return _res.status(400).json({
                    success: false,
                    error: 'Campaign type is required',
                });
            }
            await emailCampaignService.pauseCampaign(userId.toString(), campaignType);
            _res.json({
                success: true,
                message: `${campaignType} campaign paused successfully`,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to pause email campaign', { error, userId: req.user.id });
            _res.status(500).json({
                success: false,
                error: 'Failed to pause email campaign',
            });
        }
    }
    async resumeEmailCampaign(req, _res) {
        try {
            const userId = req.user.id;
            const { campaignType } = req.body;
            if (!campaignType) {
                return _res.status(400).json({
                    success: false,
                    error: 'Campaign type is required',
                });
            }
            await emailCampaignService.resumeCampaign(userId.toString(), campaignType);
            _res.json({
                success: true,
                message: `${campaignType} campaign resumed successfully`,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to resume email campaign', { error, userId: req.user.id });
            _res.status(500).json({
                success: false,
                error: 'Failed to resume email campaign',
            });
        }
    }
    async getEmailCampaignStatus(req, _res) {
        try {
            const userId = req.user.id;
            const campaigns = await emailCampaignService.getCampaignStatus(userId.toString());
            _res.json({
                success: true,
                data: { campaigns },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get email campaign status', { error, userId: req.user.id });
            _res.status(500).json({
                success: false,
                error: 'Failed to get email campaign status',
            });
        }
    }
    async triggerReengagementCampaign(req, _res) {
        try {
            const userId = req.user.id;
            const user = await User_1.User.findByPk(userId, {
                include: [{ model: UserProfile_1.UserProfile, as: 'profile' }],
            });
            if (!user) {
                return _res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            await emailCampaignService.triggerCampaign(userId.toString(), 'inactive_user', {
                name: user.name,
                lastActiveDate: user.lastLoginAt?.toLocaleDateString() || 'recently',
                profileComplete: !!user.profile,
            });
            _res.json({
                success: true,
                message: 'Re-engagement campaign triggered successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to trigger re-engagement campaign', { error, userId: req.user.id });
            _res.status(500).json({
                success: false,
                error: 'Failed to trigger re-engagement campaign',
            });
        }
    }
}
exports.OnboardingController = OnboardingController;
exports.default = new OnboardingController();
//# sourceMappingURL=OnboardingController.js.map