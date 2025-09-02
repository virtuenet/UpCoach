"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAvatarPreference = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class UserAvatarPreference extends sequelize_1.Model {
    id;
    userId;
    avatarId;
    isActive;
    selectedAt;
    customizations;
    interactionHistory;
    satisfactionScore;
    feedbackNotes;
    compatibilityScore;
    usageCount;
    totalSessionTime;
    lastUsedAt;
    // Instance methods
    recordInteraction(sessionLength, topics = [], rating) {
        this.usageCount += 1;
        this.totalSessionTime += sessionLength;
        this.lastUsedAt = new Date();
        // Update interaction history
        this.interactionHistory.totalInteractions += 1;
        // Update average session length
        this.interactionHistory.averageSessionLength =
            (this.interactionHistory.averageSessionLength *
                (this.interactionHistory.totalInteractions - 1) +
                sessionLength) /
                this.interactionHistory.totalInteractions;
        // Add topics to common topics
        topics.forEach(topic => {
            if (!this.interactionHistory.commonTopics.includes(topic)) {
                this.interactionHistory.commonTopics.push(topic);
            }
        });
        // Record satisfaction rating if provided
        if (rating) {
            this.interactionHistory.satisfactionRatings.push(rating);
            // Update overall satisfaction score (weighted average)
            const ratings = this.interactionHistory.satisfactionRatings;
            this.satisfactionScore = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        }
        // Update last interaction date
        this.interactionHistory.lastInteractionDate = new Date();
    }
    getAverageRating() {
        const ratings = this.interactionHistory.satisfactionRatings;
        return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    }
    isRecentlyUsed(dayThreshold = 7) {
        const daysSinceLastUse = (Date.now() - this.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastUse <= dayThreshold;
    }
    getEngagementLevel() {
        if (this.usageCount >= 20 && this.totalSessionTime >= 300)
            return 'high';
        if (this.usageCount >= 5 && this.totalSessionTime >= 60)
            return 'medium';
        return 'low';
    }
    updateCustomization(settings) {
        this.customizations = {
            ...this.customizations,
            ...settings,
        };
    }
    calculateRetentionRisk() {
        const daysSinceLastUse = (Date.now() - this.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
        const avgRating = this.getAverageRating();
        if (daysSinceLastUse > 14 || avgRating < 6)
            return 'high';
        if (daysSinceLastUse > 7 || avgRating < 7)
            return 'medium';
        return 'low';
    }
    // Static methods
    static async getActivePreference(userId) {
        return this.findOne({
            where: {
                userId,
                isActive: true,
            },
            include: ['Avatar'],
        });
    }
    static async setActiveAvatar(userId, avatarId) {
        // Deactivate current active avatar
        await this.update({ isActive: false }, { where: { userId, isActive: true } });
        // Check if user has used this avatar before
        const existingPreference = await this.findOne({
            where: { userId, avatarId },
        });
        if (existingPreference) {
            // Reactivate existing preference
            await existingPreference.update({
                isActive: true,
                selectedAt: new Date(),
            });
            return existingPreference;
        }
        else {
            // Create new preference
            return this.create({
                userId,
                avatarId,
                isActive: true,
                selectedAt: new Date(),
                customizations: {},
                interactionHistory: {
                    totalInteractions: 0,
                    averageSessionLength: 0,
                    preferredTimeOfDay: [],
                    commonTopics: [],
                    satisfactionRatings: [],
                    lastInteractionDate: new Date(),
                },
                compatibilityScore: 0, // Will be calculated based on personality
                usageCount: 0,
                totalSessionTime: 0,
                lastUsedAt: new Date(),
                satisfactionScore: 0,
                feedbackNotes: '',
            });
        }
    }
    static async getUserHistory(userId) {
        return this.findAll({
            where: { userId },
            include: ['Avatar'],
            order: [['lastUsedAt', 'DESC']],
        });
    }
    static async getPopularAvatars(limit = 10) {
        const preferences = await this.findAll({
            attributes: [
                'avatarId',
                [sequelize_2.sequelize.fn('COUNT', sequelize_2.sequelize.col('userId')), 'userCount'],
                [sequelize_2.sequelize.fn('AVG', sequelize_2.sequelize.col('satisfactionScore')), 'averageRating'],
                [sequelize_2.sequelize.fn('SUM', sequelize_2.sequelize.col('usageCount')), 'totalUsage'],
            ],
            group: ['avatarId'],
            order: [[sequelize_2.sequelize.fn('COUNT', sequelize_2.sequelize.col('userId')), 'DESC']],
            limit,
            raw: true,
        });
        return preferences.map((p) => ({
            avatarId: p.avatarId,
            userCount: parseInt(p.userCount),
            averageRating: parseFloat(p.averageRating) || 0,
            totalUsage: parseInt(p.totalUsage) || 0,
        }));
    }
    static async getAvatarAnalytics(avatarId) {
        const preferences = await this.findAll({
            where: { avatarId },
        });
        const totalUsers = preferences.length;
        const activeUsers = preferences.filter(p => p.isRecentlyUsed()).length;
        const ratings = preferences.flatMap(p => p.interactionHistory.satisfactionRatings);
        const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
        const averageSessionTime = preferences.reduce((sum, p) => sum + p.interactionHistory.averageSessionLength, 0) /
            totalUsers;
        const retentionRate = activeUsers / totalUsers;
        // Analyze common customizations
        const customizations = preferences.map(p => p.customizations);
        const commonCustomizations = this.analyzeCommonCustomizations(customizations);
        return {
            totalUsers,
            activeUsers,
            averageRating,
            averageSessionTime,
            retentionRate,
            commonCustomizations,
        };
    }
    static async getRecommendationsForUser(userId) {
        const userHistory = await this.getUserHistory(userId);
        const popularAvatars = await this.getPopularAvatars(5);
        // Get user's personality profile
        const userProfile = await sequelize_2.sequelize.models.PersonalityProfile.findOne({
            where: { userId, isActive: true },
        });
        const suggestions = [];
        const reasons = [];
        // Based on personality compatibility
        if (userProfile) {
            // Get compatible avatars using the Avatar model's methods
            const { Avatar } = sequelize_2.sequelize.models;
            const compatibleAvatars = await Avatar.findByPersonalityType(userProfile.traits);
            compatibleAvatars.slice(0, 2).forEach((avatar) => {
                if (!userHistory.some(h => h.avatarId === avatar.id)) {
                    suggestions.push(avatar.id);
                    reasons.push(`Highly compatible with your personality traits`);
                }
            });
        }
        // Based on popularity among similar users
        popularAvatars.forEach(popular => {
            if (suggestions.length < 3 && !userHistory.some(h => h.avatarId === popular.avatarId)) {
                suggestions.push(popular.avatarId);
                reasons.push(`Popular among users with similar preferences (${popular.averageRating.toFixed(1)}/10 rating)`);
            }
        });
        return { suggestedAvatars: suggestions, reasons };
    }
    static analyzeCommonCustomizations(customizations) {
        const analysis = {};
        // Analyze voice settings
        const voiceSpeeds = customizations
            .map(c => c.voiceSettings?.speed)
            .filter(s => s !== undefined);
        if (voiceSpeeds.length > 0) {
            analysis.averageVoiceSpeed = voiceSpeeds.reduce((sum, s) => sum + s, 0) / voiceSpeeds.length;
        }
        // Analyze behavior settings
        const encouragementFreqs = customizations
            .map(c => c.behaviorSettings?.encouragementFrequency)
            .filter(f => f !== undefined);
        if (encouragementFreqs.length > 0) {
            analysis.mostCommonEncouragementFrequency = this.getMostCommon(encouragementFreqs);
        }
        return analysis;
    }
    static getMostCommon(array) {
        const frequency = {};
        array.forEach(item => {
            const key = String(item);
            frequency[key] = (frequency[key] || 0) + 1;
        });
        return array.reduce((a, b) => (frequency[String(a)] > frequency[String(b)] ? a : b));
    }
}
exports.UserAvatarPreference = UserAvatarPreference;
UserAvatarPreference.init({
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
    avatarId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'avatars',
            key: 'id',
        },
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    selectedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    customizations: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {},
        allowNull: false,
    },
    interactionHistory: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    satisfactionScore: {
        type: sequelize_1.DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
        allowNull: false,
        validate: {
            min: 0,
            max: 10,
        },
    },
    feedbackNotes: {
        type: sequelize_1.DataTypes.TEXT,
        defaultValue: '',
        allowNull: false,
    },
    compatibilityScore: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        allowNull: false,
        validate: {
            min: 0,
            max: 100,
        },
    },
    usageCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    totalSessionTime: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    lastUsedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'UserAvatarPreference',
    tableName: 'user_avatar_preferences',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'avatarId'],
        },
        {
            fields: ['userId', 'isActive'],
        },
        {
            fields: ['avatarId'],
        },
        {
            fields: ['lastUsedAt'],
        },
        {
            fields: ['satisfactionScore'],
        },
    ],
});
//# sourceMappingURL=UserAvatarPreference.js.map