"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const User_1 = require("../models/User");
const UserProfile_1 = require("../models/UserProfile");
const Goal_1 = require("../models/Goal");
const logger_1 = require("../utils/logger");
const AnalyticsService_1 = require("../services/analytics/AnalyticsService");
// import emailService from '../services/email/UnifiedEmailService';
const AIService_1 = require("../services/ai/AIService");
const database_1 = require("../config/database");
class OnboardingController {
    // Complete onboarding process
    async completeOnboarding(req, _res) {
        const transaction = await database_1.sequelize.transaction();
        try {
            const userId = req.user.id;
            const onboardingData = req.body;
            // Update user profile
            const user = await User_1.User.findByPk(userId);
            if (!user) {
                await transaction.rollback();
                return _res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            // Update basic user info
            if (onboardingData.profile.name) {
                user.name = onboardingData.profile.name;
            }
            user.onboardingCompleted = true;
            user.onboardingCompletedAt = new Date();
            await user.save({ transaction });
            // Create or update user profile
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
            // Create initial goals
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
            // Generate AI personality based on preferences
            const aiPersonality = await this.generateAIPersonality(onboardingData);
            userProfile.aiPersonalization = aiPersonality;
            await userProfile.save({ transaction });
            // Commit transaction
            await transaction.commit();
            // Trigger post-onboarding actions (outside transaction)
            this.triggerPostOnboardingActions(Number(userId), onboardingData);
            // Track onboarding completion
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
    // Get onboarding status
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
    // Skip onboarding (for returning users)
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
            // Create default profile
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
            // Track skip
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
    // Private helper methods
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
        // Map coaching style to personality traits
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
            // Start onboarding email campaign
            // TODO: Implement email campaign trigger
            // await emailService.triggerCampaign(userId.toString(), 'user_registered');
            // Create initial AI coaching session
            await AIService_1.aiService.createInitialSession(Number(userId), {
                goals: data.goals,
                preferences: data.preferences,
            });
            // Schedule first check-in based on commitment level
            // const checkInDelay = data.availability.commitmentLevel === 'daily' ? 24 : 48; // hours
            // In production, schedule check-in notification using checkInDelay
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
        // Check each step
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
}
exports.OnboardingController = OnboardingController;
exports.default = new OnboardingController();
//# sourceMappingURL=OnboardingController.js.map