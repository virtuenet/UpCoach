"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalizationEngine = exports.PersonalizationEngine = void 0;
const logger_1 = require("../../utils/logger");
class PersonalizationEngine {
    userProfiles = new Map();
    userBehaviors = new Map();
    constructor() {
        logger_1.logger.info('PersonalizationEngine initialized');
    }
    async getUserPreferences(userId) {
        try {
            if (this.userProfiles.has(userId)) {
                return this.userProfiles.get(userId);
            }
            const defaultPreferences = {
                communicationStyle: 'friendly',
                coachingStyle: 'balanced',
                learningStyle: 'visual',
                motivationType: 'achievement',
                feedbackFrequency: 'daily',
                contentTypes: ['articles', 'exercises', 'videos'],
                topics: ['personal development', 'goal setting', 'productivity'],
                goals: [],
                reminders: true,
                privacy: 'private'
            };
            this.userProfiles.set(userId, defaultPreferences);
            return defaultPreferences;
        }
        catch (error) {
            logger_1.logger.error('Error getting user preferences:', error);
            throw error;
        }
    }
    async updateUserProfile(userId, updates) {
        try {
            if (updates.preferences) {
                const currentPrefs = await this.getUserPreferences(userId);
                const updatedPrefs = { ...currentPrefs, ...updates.preferences };
                this.userProfiles.set(userId, updatedPrefs);
            }
            if (updates.behavior) {
                const currentBehavior = this.userBehaviors.get(userId) || {
                    loginFrequency: 0,
                    sessionDuration: 0,
                    featuresUsed: [],
                    contentInteractions: [],
                    goalProgress: []
                };
                const updatedBehavior = { ...currentBehavior, ...updates.behavior };
                this.userBehaviors.set(userId, updatedBehavior);
            }
            logger_1.logger.info(`Updated profile for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error updating user profile:', error);
            throw error;
        }
    }
    async getPersonalizedContent(userId, contentType, limit) {
        try {
            const preferences = await this.getUserPreferences(userId);
            const behavior = this.userBehaviors.get(userId);
            const mockContent = [
                {
                    id: 'content-1',
                    type: contentType || 'article',
                    title: 'Personalized Goal Setting Strategy',
                    description: 'A tailored approach to setting and achieving your personal goals',
                    relevanceScore: 0.95,
                    personalizedReason: `Based on your ${preferences.learningStyle} learning style and ${preferences.motivationType} motivation`,
                    estimatedDuration: 15,
                    difficulty: 'medium'
                },
                {
                    id: 'content-2',
                    type: contentType || 'exercise',
                    title: 'Daily Reflection Practice',
                    description: 'A personalized reflection exercise tailored to your communication style',
                    relevanceScore: 0.88,
                    personalizedReason: `Matches your ${preferences.communicationStyle} communication preference`,
                    estimatedDuration: 10,
                    difficulty: 'easy'
                },
                {
                    id: 'content-3',
                    type: contentType || 'video',
                    title: 'Productivity Techniques for Your Style',
                    description: 'Video content adapted to your learning and coaching preferences',
                    relevanceScore: 0.82,
                    personalizedReason: `Aligned with your ${preferences.coachingStyle} coaching style preference`,
                    estimatedDuration: 20,
                    difficulty: 'medium'
                }
            ];
            return mockContent.slice(0, limit);
        }
        catch (error) {
            logger_1.logger.error('Error getting personalized content:', error);
            throw error;
        }
    }
    async generateCoachingStrategy(userId) {
        try {
            const preferences = await this.getUserPreferences(userId);
            const behavior = this.userBehaviors.get(userId);
            const strategy = {
                approach: this.getCoachingApproach(preferences),
                techniques: this.getRecommendedTechniques(preferences, behavior),
                communicationStyle: preferences.communicationStyle,
                motivationTactics: this.getMotivationTactics(preferences.motivationType),
                adaptations: this.getAdaptations(preferences, behavior)
            };
            return strategy;
        }
        catch (error) {
            logger_1.logger.error('Error generating coaching strategy:', error);
            throw error;
        }
    }
    getCoachingApproach(preferences) {
        switch (preferences.coachingStyle) {
            case 'supportive':
                return 'Emphasis on encouragement, positive reinforcement, and emotional support';
            case 'challenging':
                return 'Focus on pushing boundaries, setting stretch goals, and constructive challenge';
            case 'balanced':
            default:
                return 'Balanced approach combining support with appropriate challenge';
        }
    }
    getRecommendedTechniques(preferences, behavior) {
        const techniques = [];
        if (preferences.learningStyle === 'visual') {
            techniques.push('Visual goal tracking', 'Infographic summaries', 'Progress charts');
        }
        else if (preferences.learningStyle === 'auditory') {
            techniques.push('Audio feedback', 'Verbal affirmations', 'Discussion-based exercises');
        }
        else if (preferences.learningStyle === 'kinesthetic') {
            techniques.push('Hands-on activities', 'Movement-based exercises', 'Practical applications');
        }
        if (preferences.feedbackFrequency === 'immediate') {
            techniques.push('Real-time notifications', 'Instant feedback loops');
        }
        return techniques;
    }
    getMotivationTactics(motivationType) {
        switch (motivationType) {
            case 'achievement':
                return ['Goal completion rewards', 'Progress milestones', 'Personal bests tracking'];
            case 'affiliation':
                return ['Community engagement', 'Peer support', 'Social sharing features'];
            case 'power':
                return ['Leadership challenges', 'Influence metrics', 'Decision-making exercises'];
            case 'autonomy':
                return ['Self-directed learning', 'Choice in activities', 'Flexible scheduling'];
            default:
                return ['Balanced motivational approach'];
        }
    }
    getAdaptations(preferences, behavior) {
        const adaptations = [];
        if (behavior?.loginFrequency < 3) {
            adaptations.push('Engagement reminders', 'Simpler onboarding');
        }
        if (behavior?.sessionDuration < 10) {
            adaptations.push('Bite-sized content', 'Quick wins focus');
        }
        return adaptations;
    }
}
exports.PersonalizationEngine = PersonalizationEngine;
exports.personalizationEngine = new PersonalizationEngine();
//# sourceMappingURL=PersonalizationEngine.js.map