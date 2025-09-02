"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalityProfile = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class PersonalityProfile extends sequelize_1.Model {
    id;
    userId;
    assessmentType;
    traits;
    mbtiType;
    discProfile;
    insights;
    confidence;
    assessmentDate;
    questionsAnswered;
    totalQuestions;
    responses;
    version;
    isActive;
    // Instance methods
    getDominantTrait() {
        const traits = this.traits;
        const traitNames = Object.keys(traits);
        return traitNames.reduce((dominant, current) => traits[current] > traits[dominant] ? current : dominant);
    }
    getTraitDescription(trait) {
        const descriptions = {
            openness: this.traits.openness > 50
                ? 'Creative, curious, and open to new experiences'
                : 'Practical, conventional, and prefers routine',
            conscientiousness: this.traits.conscientiousness > 50
                ? 'Organized, disciplined, and goal-oriented'
                : 'Flexible, spontaneous, and adaptable',
            extraversion: this.traits.extraversion > 50
                ? 'Outgoing, energetic, and socially confident'
                : 'Reserved, thoughtful, and prefers smaller groups',
            agreeableness: this.traits.agreeableness > 50
                ? 'Cooperative, trusting, and empathetic'
                : 'Competitive, skeptical, and direct',
            neuroticism: this.traits.neuroticism > 50
                ? 'Sensitive to stress and prone to worry'
                : 'Emotionally stable and resilient',
        };
        return descriptions[trait];
    }
    getRecommendedAvatar() {
        // Logic to recommend avatar based on personality
        const { extraversion, agreeableness, conscientiousness, openness, neuroticism } = this.traits;
        if (extraversion > 70 && agreeableness > 60) {
            return 'energetic-mentor';
        }
        else if (conscientiousness > 70 && openness > 60) {
            return 'wise-guide';
        }
        else if (agreeableness > 70 && neuroticism < 40) {
            return 'supportive-friend';
        }
        else if (openness > 70 && extraversion > 50) {
            return 'creative-innovator';
        }
        else if (conscientiousness > 60) {
            return 'structured-coach';
        }
        else {
            return 'balanced-advisor';
        }
    }
    isCompleteAssessment() {
        return this.questionsAnswered >= this.totalQuestions * 0.8; // 80% completion
    }
    getPersonalityScoreCard() {
        const traits = this.traits;
        return Object.entries(traits).map(([trait, score]) => ({
            trait: trait.charAt(0).toUpperCase() + trait.slice(1),
            score,
            level: score < 33 ? 'low' : score < 67 ? 'moderate' : 'high',
            description: this.getTraitDescription(trait),
        }));
    }
    // Static methods
    static async getActiveProfile(userId) {
        return this.findOne({
            where: {
                userId,
                isActive: true,
            },
            order: [['assessmentDate', 'DESC']],
        });
    }
    static async createFromAssessment(userId, responses, assessmentType = 'big_five') {
        // This would be called after processing assessment responses
        // The actual trait calculation would be done in the PersonalityService
        const traits = await this.calculateTraitsFromResponses(responses, assessmentType);
        const insights = await this.generateInsights(traits);
        // Deactivate previous profiles
        await this.update({ isActive: false }, { where: { userId, isActive: true } });
        return this.create({
            userId,
            assessmentType,
            traits,
            insights,
            confidence: this.calculateConfidence(responses),
            assessmentDate: new Date(),
            questionsAnswered: responses.length,
            totalQuestions: this.getTotalQuestions(assessmentType),
            responses,
            version: '1.0',
            isActive: true,
        });
    }
    static async calculateTraitsFromResponses(responses, assessmentType) {
        // Simplified calculation - in real implementation, this would use
        // validated psychological assessment algorithms
        const scores = {
            openness: 0,
            conscientiousness: 0,
            extraversion: 0,
            agreeableness: 0,
            neuroticism: 0,
        };
        // Process responses based on question mapping
        responses.forEach((response, index) => {
            const value = parseInt(response.value) || 0;
            const questionMap = this.getQuestionMapping(assessmentType);
            const trait = questionMap[index % 5]; // Simplified mapping
            scores[trait] += value;
        });
        // Normalize scores to 0-100 scale
        const maxScore = (responses.length / 5) * 5; // Assuming 5-point scale
        return {
            openness: Math.round((scores.openness / maxScore) * 100),
            conscientiousness: Math.round((scores.conscientiousness / maxScore) * 100),
            extraversion: Math.round((scores.extraversion / maxScore) * 100),
            agreeableness: Math.round((scores.agreeableness / maxScore) * 100),
            neuroticism: Math.round((scores.neuroticism / maxScore) * 100),
        };
    }
    static async generateInsights(traits) {
        const primaryTraits = Object.entries(traits)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([trait]) => trait);
        const strengths = this.getStrengthsForTraits(traits);
        const growthAreas = this.getGrowthAreasForTraits(traits);
        const coachingStyle = this.getCoachingStyle(traits);
        const communicationStyle = this.getCommunicationStyle(traits);
        const motivationFactors = this.getMotivationFactors(traits);
        return {
            primaryTraits,
            strengths,
            growthAreas,
            coachingStyle,
            communicationStyle,
            motivationFactors,
        };
    }
    static getStrengthsForTraits(traits) {
        const strengths = [];
        if (traits.openness > 60)
            strengths.push('Creative thinking', 'Adaptability');
        if (traits.conscientiousness > 60)
            strengths.push('Organization', 'Reliability');
        if (traits.extraversion > 60)
            strengths.push('Leadership', 'Communication');
        if (traits.agreeableness > 60)
            strengths.push('Teamwork', 'Empathy');
        if (traits.neuroticism < 40)
            strengths.push('Emotional stability', 'Stress resilience');
        return strengths.slice(0, 4); // Limit to top 4 strengths
    }
    static getGrowthAreasForTraits(traits) {
        const growthAreas = [];
        if (traits.openness < 40)
            growthAreas.push('Embracing change', 'Creative exploration');
        if (traits.conscientiousness < 40)
            growthAreas.push('Time management', 'Goal setting');
        if (traits.extraversion < 40)
            growthAreas.push('Social confidence', 'Networking');
        if (traits.agreeableness < 40)
            growthAreas.push('Collaboration', 'Conflict resolution');
        if (traits.neuroticism > 60)
            growthAreas.push('Stress management', 'Emotional regulation');
        return growthAreas.slice(0, 3); // Limit to top 3 growth areas
    }
    static getCoachingStyle(traits) {
        return {
            approach: traits.conscientiousness > 60
                ? 'directive'
                : traits.agreeableness > 60
                    ? 'supportive'
                    : 'collaborative',
            feedback: traits.neuroticism > 60 ? 'gentle' : traits.extraversion > 60 ? 'direct' : 'encouraging',
            pace: traits.conscientiousness > 60 ? 'fast' : traits.neuroticism > 60 ? 'slow' : 'moderate',
            structure: traits.conscientiousness > 60 ? 'high' : traits.openness > 60 ? 'low' : 'medium',
        };
    }
    static getCommunicationStyle(traits) {
        return {
            tone: traits.agreeableness > 60
                ? 'warm'
                : traits.conscientiousness > 60
                    ? 'professional'
                    : 'casual',
            detail: traits.conscientiousness > 60
                ? 'detailed'
                : traits.extraversion > 60
                    ? 'brief'
                    : 'moderate',
            examples: traits.openness > 60 ? 'abstract' : 'concrete',
            encouragement: traits.agreeableness > 60 ? 'high' : traits.neuroticism > 60 ? 'high' : 'medium',
        };
    }
    static getMotivationFactors(traits) {
        const factors = [];
        if (traits.extraversion > 60) {
            factors.push({
                factor: 'Social Recognition',
                importance: traits.extraversion,
                description: 'Achievement acknowledgment from others',
            });
        }
        if (traits.conscientiousness > 60) {
            factors.push({
                factor: 'Goal Achievement',
                importance: traits.conscientiousness,
                description: 'Completing objectives and reaching targets',
            });
        }
        if (traits.openness > 60) {
            factors.push({
                factor: 'Learning & Growth',
                importance: traits.openness,
                description: 'Acquiring new skills and knowledge',
            });
        }
        return factors.sort((a, b) => b.importance - a.importance).slice(0, 3);
    }
    static calculateConfidence(responses) {
        // Simple confidence calculation based on response consistency
        const completion = responses.length >= 20 ? 100 : (responses.length / 20) * 100;
        const consistency = this.calculateResponseConsistency(responses);
        return Math.round(completion * 0.6 + consistency * 0.4);
    }
    static calculateResponseConsistency(responses) {
        // Analyze response patterns for consistency
        // This is a simplified implementation
        const values = responses.map(r => parseInt(r.value) || 0);
        const variance = this.calculateVariance(values);
        // Lower variance indicates more consistent responses
        return Math.max(0, 100 - variance * 20);
    }
    static calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }
    static getQuestionMapping(assessmentType) {
        // Map questions to Big Five traits
        return ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    }
    static getTotalQuestions(assessmentType) {
        switch (assessmentType) {
            case 'big_five':
                return 50;
            case 'mbti':
                return 60;
            case 'disc':
                return 40;
            default:
                return 50;
        }
    }
}
exports.PersonalityProfile = PersonalityProfile;
PersonalityProfile.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    assessmentType: {
        type: sequelize_1.DataTypes.ENUM('big_five', 'mbti', 'disc', 'custom'),
        allowNull: false,
        defaultValue: 'big_five',
    },
    traits: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        validate: {
            isValidTraits(value) {
                const requiredTraits = [
                    'openness',
                    'conscientiousness',
                    'extraversion',
                    'agreeableness',
                    'neuroticism',
                ];
                for (const trait of requiredTraits) {
                    if (!(trait in value) ||
                        value[trait] < 0 ||
                        value[trait] > 100) {
                        throw new Error(`Invalid trait value for ${trait}`);
                    }
                }
            },
        },
    },
    mbtiType: {
        type: sequelize_1.DataTypes.STRING(4),
        allowNull: true,
        validate: {
            is: /^[IE][SN][TF][JP]$/,
        },
    },
    discProfile: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: true,
    },
    insights: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    confidence: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            max: 100,
        },
    },
    assessmentDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    questionsAnswered: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    totalQuestions: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
        },
    },
    responses: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    version: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: '1.0',
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'PersonalityProfile',
    tableName: 'personality_profiles',
    timestamps: true,
    indexes: [
        {
            fields: ['userId'],
        },
        {
            fields: ['userId', 'isActive'],
        },
        {
            fields: ['assessmentType'],
        },
        {
            fields: ['assessmentDate'],
        },
    ],
});
//# sourceMappingURL=PersonalityProfile.js.map