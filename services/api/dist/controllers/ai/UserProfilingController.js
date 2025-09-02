"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userProfilingController = exports.UserProfilingController = void 0;
const UserProfilingService_1 = require("../../services/ai/UserProfilingService");
const logger_1 = require("../../utils/logger");
class UserProfilingController {
    async getProfile(req, _res, next) {
        try {
            const userId = req.user?.id || req.params.userId;
            if (!userId) {
                return _res.status(400).json({ error: 'User ID required' });
            }
            const profile = await UserProfilingService_1.userProfilingService.createOrUpdateProfile(userId);
            _res.json({
                success: true,
                profile: {
                    id: profile.id,
                    userId: profile.userId,
                    learningStyle: profile.learningStyle,
                    communicationPreference: profile.communicationPreference,
                    personalityType: profile.personalityType,
                    coachingPreferences: profile.coachingPreferences,
                    behaviorPatterns: profile.behaviorPatterns,
                    progressMetrics: profile.progressMetrics,
                    strengths: profile.strengths,
                    growthAreas: profile.growthAreas,
                    motivators: profile.motivators,
                    obstacles: profile.obstacles,
                    updatedAt: profile.updatedAt,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching user profile:', error);
            next(error);
        }
    }
    async getInsights(req, _res, next) {
        try {
            const userId = req.user?.id || req.params.userId;
            if (!userId) {
                return _res.status(400).json({ error: 'User ID required' });
            }
            const insights = await UserProfilingService_1.userProfilingService.getProfileInsights(userId);
            _res.json({
                success: true,
                insights,
                generatedAt: new Date(),
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating profile insights:', error);
            next(error);
        }
    }
    async getRecommendations(req, _res, next) {
        try {
            const userId = req.user?.id || req.params.userId;
            if (!userId) {
                return _res.status(400).json({ error: 'User ID required' });
            }
            const recommendations = await UserProfilingService_1.userProfilingService.getPersonalizedRecommendations(userId);
            _res.json({
                success: true,
                recommendations,
                generatedAt: new Date(),
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating recommendations:', error);
            next(error);
        }
    }
    async assessReadiness(req, _res, next) {
        try {
            const userId = req.user?.id || req.params.userId;
            if (!userId) {
                return _res.status(400).json({ error: 'User ID required' });
            }
            const assessment = await UserProfilingService_1.userProfilingService.assessReadinessLevel(userId);
            _res.json({
                success: true,
                assessment,
                assessedAt: new Date(),
            });
        }
        catch (error) {
            logger_1.logger.error('Error assessing readiness:', error);
            next(error);
        }
    }
    async updatePreferences(req, _res, next) {
        try {
            const userId = req.user?.id || req.params.userId;
            if (!userId) {
                return _res.status(400).json({ error: 'User ID required' });
            }
            const preferences = req.body;
            // Validate preferences
            const allowedLearningStyles = ['visual', 'auditory', 'kinesthetic', 'reading', 'balanced'];
            const allowedCommunicationPreferences = [
                'supportive',
                'direct',
                'analytical',
                'motivational',
                'empathetic',
            ];
            if (preferences.learningStyle && !allowedLearningStyles.includes(preferences.learningStyle)) {
                return _res.status(400).json({
                    error: 'Invalid learning style. Must be one of: ' + allowedLearningStyles.join(', '),
                });
            }
            if (preferences.communicationPreference &&
                !allowedCommunicationPreferences.includes(preferences.communicationPreference)) {
                return _res.status(400).json({
                    error: 'Invalid communication preference. Must be one of: ' +
                        allowedCommunicationPreferences.join(', '),
                });
            }
            const profile = await UserProfilingService_1.userProfilingService.updateUserPreferences(userId, preferences);
            _res.json({
                success: true,
                message: 'Preferences updated successfully',
                profile: {
                    learningStyle: profile.learningStyle,
                    communicationPreference: profile.communicationPreference,
                    coachingPreferences: profile.coachingPreferences,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating preferences:', error);
            next(error);
        }
    }
    async refreshProfile(req, _res, next) {
        try {
            const userId = req.user?.id || req.params.userId;
            if (!userId) {
                return _res.status(400).json({ error: 'User ID required' });
            }
            // Force refresh by clearing cache and regenerating
            const profile = await UserProfilingService_1.userProfilingService.createOrUpdateProfile(userId);
            _res.json({
                success: true,
                message: 'Profile refreshed successfully',
                profile: {
                    id: profile.id,
                    updatedAt: profile.updatedAt,
                    progressMetrics: profile.progressMetrics,
                    behaviorPatterns: profile.behaviorPatterns,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error refreshing profile:', error);
            next(error);
        }
    }
}
exports.UserProfilingController = UserProfilingController;
exports.userProfilingController = new UserProfilingController();
//# sourceMappingURL=UserProfilingController.js.map