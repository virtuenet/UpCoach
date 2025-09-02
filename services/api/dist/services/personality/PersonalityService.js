"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalityService = void 0;
const PersonalityProfile_1 = require("../../models/personality/PersonalityProfile");
const Avatar_1 = require("../../models/personality/Avatar");
const UserAvatarPreference_1 = require("../../models/personality/UserAvatarPreference");
class PersonalityService {
    static BIG_FIVE_QUESTIONS = [
        // Openness questions
        {
            id: 'o1',
            question: 'I enjoy trying new and different activities.',
            trait: 'openness',
            isReversed: false,
            scale: {
                min: 1,
                max: 5,
                labels: [
                    { value: 1, label: 'Strongly Disagree' },
                    { value: 2, label: 'Disagree' },
                    { value: 3, label: 'Neutral' },
                    { value: 4, label: 'Agree' },
                    { value: 5, label: 'Strongly Agree' },
                ],
            },
            category: 'creativity',
        },
        {
            id: 'o2',
            question: 'I prefer routine and familiar experiences.',
            trait: 'openness',
            isReversed: true,
            scale: {
                min: 1,
                max: 5,
                labels: [
                    { value: 1, label: 'Strongly Disagree' },
                    { value: 2, label: 'Disagree' },
                    { value: 3, label: 'Neutral' },
                    { value: 4, label: 'Agree' },
                    { value: 5, label: 'Strongly Agree' },
                ],
            },
            category: 'routine',
        },
        // Conscientiousness questions
        {
            id: 'c1',
            question: 'I am always prepared and organized.',
            trait: 'conscientiousness',
            isReversed: false,
            scale: {
                min: 1,
                max: 5,
                labels: [
                    { value: 1, label: 'Strongly Disagree' },
                    { value: 2, label: 'Disagree' },
                    { value: 3, label: 'Neutral' },
                    { value: 4, label: 'Agree' },
                    { value: 5, label: 'Strongly Agree' },
                ],
            },
            category: 'organization',
        },
        {
            id: 'c2',
            question: 'I tend to be disorganized and scattered.',
            trait: 'conscientiousness',
            isReversed: true,
            scale: {
                min: 1,
                max: 5,
                labels: [
                    { value: 1, label: 'Strongly Disagree' },
                    { value: 2, label: 'Disagree' },
                    { value: 3, label: 'Neutral' },
                    { value: 4, label: 'Agree' },
                    { value: 5, label: 'Strongly Agree' },
                ],
            },
            category: 'organization',
        },
        // Add more questions for complete assessment...
    ];
    /**
     * Get assessment questions based on type
     */
    static getAssessmentQuestions(assessmentType = 'big_five') {
        switch (assessmentType) {
            case 'short':
                return this.BIG_FIVE_QUESTIONS.slice(0, 20); // Quick 20-question version
            case 'comprehensive':
                return this.BIG_FIVE_QUESTIONS; // Full 50-question version
            default:
                return this.BIG_FIVE_QUESTIONS.slice(0, 30); // Standard 30-question version
        }
    }
    /**
     * Process assessment responses and create personality profile
     */
    static async processAssessment(userId, responses, assessmentType = 'big_five') {
        // Calculate personality traits from responses
        const traits = await this.calculateTraits(responses, assessmentType);
        // Create or update personality profile
        const profile = await PersonalityProfile_1.PersonalityProfile.createFromAssessment(userId, responses.map(r => ({ questionId: r.questionId, value: r.value, timeSpent: r.timeSpent })), assessmentType);
        // Get avatar recommendations
        const avatarRecommendations = await this.getAvatarRecommendations(traits, profile);
        // Generate insights
        const insights = await this.generatePersonalizedInsights(profile);
        return {
            profile,
            recommendedAvatars: avatarRecommendations,
            insights,
        };
    }
    /**
     * Calculate Big Five traits from assessment responses
     */
    static async calculateTraits(responses, assessmentType) {
        const questions = this.getAssessmentQuestions(assessmentType);
        const traitScores = {
            openness: [],
            conscientiousness: [],
            extraversion: [],
            agreeableness: [],
            neuroticism: [],
        };
        // Process each response
        responses.forEach(response => {
            const question = questions.find(q => q.id === response.questionId);
            if (!question)
                return;
            let score = response.value;
            // Reverse score if needed
            if (question.isReversed) {
                score = question.scale.max + 1 - score;
            }
            traitScores[question.trait].push(score);
        });
        // Calculate averages and convert to 0-100 scale
        const traits = {
            openness: this.calculateTraitScore(traitScores.openness, 5),
            conscientiousness: this.calculateTraitScore(traitScores.conscientiousness, 5),
            extraversion: this.calculateTraitScore(traitScores.extraversion, 5),
            agreeableness: this.calculateTraitScore(traitScores.agreeableness, 5),
            neuroticism: this.calculateTraitScore(traitScores.neuroticism, 5),
        };
        return traits;
    }
    /**
     * Calculate individual trait score
     */
    static calculateTraitScore(scores, maxScale) {
        if (scores.length === 0)
            return 50; // Default to middle
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return Math.round(((average - 1) / (maxScale - 1)) * 100);
    }
    /**
     * Get avatar recommendations based on personality traits
     */
    static async getAvatarRecommendations(traits, _profile) {
        const traitRecord = {
            openness: traits.openness,
            conscientiousness: traits.conscientiousness,
            extraversion: traits.extraversion,
            agreeableness: traits.agreeableness,
            neuroticism: traits.neuroticism,
        };
        const avatarRecommendations = await Avatar_1.Avatar.getRecommendedAvatars(traitRecord, 5);
        return avatarRecommendations.map(({ avatar, compatibilityScore }) => ({
            avatar,
            compatibilityScore,
            reasons: this.generateCompatibilityReasons(traits, avatar, compatibilityScore),
        }));
    }
    /**
     * Generate reasons for avatar compatibility
     */
    static generateCompatibilityReasons(traits, avatar, compatibilityScore) {
        const reasons = [];
        // Add specific reasons based on trait compatibility
        if (traits.extraversion > 70 && avatar.personality.characteristics.includes('Energetic')) {
            reasons.push('Matches your outgoing and energetic personality');
        }
        if (traits.conscientiousness > 70 &&
            avatar.personality.characteristics.includes('Goal-oriented')) {
            reasons.push('Aligns with your organized and goal-focused approach');
        }
        if (traits.agreeableness > 70 && avatar.personality.characteristics.includes('Supportive')) {
            reasons.push('Provides the warm, supportive environment you prefer');
        }
        if (traits.openness > 70 && avatar.personality.characteristics.includes('Creative')) {
            reasons.push('Complements your creative and open-minded nature');
        }
        if (traits.neuroticism > 60 && avatar.personality.characteristics.includes('Patient')) {
            reasons.push('Offers the patient, understanding approach you need');
        }
        // Add coaching style compatibility
        const coachingStyle = avatar.personality.coachingStyle.approach;
        if (traits.conscientiousness > 60 && coachingStyle.includes('methodical')) {
            reasons.push('Uses a structured approach that suits your style');
        }
        // Add general compatibility reason if specific reasons are few
        if (reasons.length === 0) {
            if (compatibilityScore > 80) {
                reasons.push('Highly compatible with your overall personality profile');
            }
            else if (compatibilityScore > 60) {
                reasons.push('Good match for your personality traits');
            }
            else {
                reasons.push('Could offer a fresh perspective on your growth');
            }
        }
        return reasons.slice(0, 3); // Limit to 3 reasons
    }
    /**
     * Get dominant personality trait
     */
    static getDominantTrait(traits) {
        return Object.entries(traits).reduce((a, b) => traits[a[0]] > traits[b[0]] ? a : b)[0];
    }
    /**
     * Generate personalized insights
     */
    static async generatePersonalizedInsights(profile) {
        const traits = profile.traits;
        const dominantTrait = this.getDominantTrait(traits);
        // Generate summary
        const summary = this.generatePersonalitySummary(traits, dominantTrait);
        // Get strengths and growth areas from profile
        const strengths = profile.insights.strengths;
        const growthAreas = profile.insights.growthAreas;
        // Generate coaching recommendations
        const coachingRecommendations = this.generateCoachingRecommendations(traits);
        return {
            summary,
            strengths,
            growthAreas,
            coachingRecommendations,
        };
    }
    /**
     * Generate personality summary
     */
    static generatePersonalitySummary(traits, dominantTrait) {
        const traitDescriptions = {
            openness: 'creative and open to new experiences',
            conscientiousness: 'organized and goal-oriented',
            extraversion: 'outgoing and energetic',
            agreeableness: 'cooperative and empathetic',
            neuroticism: 'sensitive and emotionally aware',
        };
        const primaryDescription = traitDescriptions[dominantTrait];
        const secondaryTraits = Object.entries(traits)
            .sort(([, a], [, b]) => b - a)
            .slice(1, 3)
            .map(([trait]) => trait);
        return `You are primarily ${primaryDescription}, with strong tendencies toward ${secondaryTraits.join(' and ')}. This combination suggests you thrive in environments that balance ${this.getEnvironmentPreference(dominantTrait)} with opportunities for ${this.getGrowthPreference(secondaryTraits)}.`;
    }
    /**
     * Generate coaching recommendations
     */
    static generateCoachingRecommendations(traits) {
        const recommendations = [];
        if (traits.conscientiousness > 70) {
            recommendations.push('Set clear, specific goals with measurable milestones');
            recommendations.push('Use structured planning and tracking tools');
        }
        if (traits.extraversion > 70) {
            recommendations.push('Engage in group activities and peer accountability');
            recommendations.push('Share your progress publicly for motivation');
        }
        if (traits.openness > 70) {
            recommendations.push('Explore creative approaches to problem-solving');
            recommendations.push('Try new techniques and methods regularly');
        }
        if (traits.agreeableness > 70) {
            recommendations.push('Focus on how your growth impacts others positively');
            recommendations.push('Seek collaborative learning opportunities');
        }
        if (traits.neuroticism > 60) {
            recommendations.push('Practice stress management and emotional regulation');
            recommendations.push('Start with small, manageable changes');
        }
        return recommendations.slice(0, 4); // Limit to 4 recommendations
    }
    /**
     * Get environment preference based on dominant trait
     */
    static getEnvironmentPreference(dominantTrait) {
        const preferences = {
            openness: 'creativity and exploration',
            conscientiousness: 'structure and achievement',
            extraversion: 'social interaction and energy',
            agreeableness: 'collaboration and harmony',
            neuroticism: 'understanding and support',
        };
        return preferences[dominantTrait];
    }
    /**
     * Get growth preference based on secondary traits
     */
    static getGrowthPreference(secondaryTraits) {
        const growthAreas = {
            openness: 'learning and discovery',
            conscientiousness: 'goal achievement',
            extraversion: 'social connection',
            agreeableness: 'helping others',
            neuroticism: 'emotional growth',
        };
        return secondaryTraits
            .map(trait => growthAreas[trait])
            .join(' and ');
    }
    /**
     * Get personality profile for user
     */
    static async getUserProfile(userId) {
        return PersonalityProfile_1.PersonalityProfile.getActiveProfile(userId);
    }
    /**
     * Update user's avatar selection
     */
    static async selectAvatar(userId, avatarId, customizations) {
        const preference = await UserAvatarPreference_1.UserAvatarPreference.setActiveAvatar(userId, avatarId);
        if (customizations) {
            preference.updateCustomization(customizations);
            await preference.save();
        }
        // Calculate compatibility score if user has personality profile
        const profile = await this.getUserProfile(userId);
        if (profile) {
            const avatar = await Avatar_1.Avatar.findByPk(avatarId);
            if (avatar) {
                const traitRecord = {
                    openness: profile.traits.openness,
                    conscientiousness: profile.traits.conscientiousness,
                    extraversion: profile.traits.extraversion,
                    agreeableness: profile.traits.agreeableness,
                    neuroticism: profile.traits.neuroticism,
                };
                const compatibilityScore = avatar.calculateCompatibilityScore(traitRecord);
                preference.compatibilityScore = compatibilityScore;
                await preference.save();
            }
        }
        return preference;
    }
    /**
     * Record interaction with avatar
     */
    static async recordInteraction(userId, sessionLength, topics = [], rating) {
        const preference = await UserAvatarPreference_1.UserAvatarPreference.getActivePreference(userId);
        if (preference) {
            preference.recordInteraction(sessionLength, topics, rating);
            await preference.save();
        }
    }
    /**
     * Get avatar analytics for admin
     */
    static async getAvatarAnalytics(avatarId) {
        return UserAvatarPreference_1.UserAvatarPreference.getAvatarAnalytics(avatarId);
    }
    /**
     * Get user recommendations
     */
    static async getUserRecommendations(userId) {
        return UserAvatarPreference_1.UserAvatarPreference.getRecommendationsForUser(userId);
    }
}
exports.PersonalityService = PersonalityService;
exports.default = PersonalityService;
//# sourceMappingURL=PersonalityService.js.map