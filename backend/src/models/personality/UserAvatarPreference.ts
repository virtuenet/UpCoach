import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/sequelize';

export interface CustomizationSettings {
  voiceSettings?: {
    speed?: number;
    pitch?: number;
    tone?: string;
  };
  visualSettings?: {
    preferredExpression?: string;
    colorPreference?: string;
  };
  behaviorSettings?: {
    encouragementFrequency?: 'low' | 'medium' | 'high';
    celebrationStyle?: 'subtle' | 'moderate' | 'enthusiastic';
    questioningDepth?: 'surface' | 'moderate' | 'deep';
  };
  communicationSettings?: {
    formality?: 'casual' | 'balanced' | 'formal';
    directness?: 'gentle' | 'balanced' | 'direct';
    supportLevel?: 'independent' | 'balanced' | 'nurturing';
  };
}

export interface InteractionHistory {
  totalInteractions: number;
  averageSessionLength: number; // in minutes
  preferredTimeOfDay: string[];
  commonTopics: string[];
  satisfactionRatings: number[];
  lastInteractionDate: Date;
}

export interface UserAvatarPreferenceAttributes {
  id: string;
  userId: string;
  avatarId: string;
  isActive: boolean;
  selectedAt: Date;
  customizations: CustomizationSettings;
  interactionHistory: InteractionHistory;
  satisfactionScore: number; // 1-10 scale
  feedbackNotes: string;
  compatibilityScore: number; // Calculated personality compatibility
  usageCount: number;
  totalSessionTime: number; // in minutes
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserAvatarPreferenceCreationAttributes
  extends Optional<
    UserAvatarPreferenceAttributes,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'usageCount'
    | 'totalSessionTime'
    | 'satisfactionScore'
    | 'feedbackNotes'
  > {}

class UserAvatarPreference
  extends Model<UserAvatarPreferenceAttributes, UserAvatarPreferenceCreationAttributes>
  implements UserAvatarPreferenceAttributes
{
  public id!: string;
  public userId!: string;
  public avatarId!: string;
  public isActive!: boolean;
  public selectedAt!: Date;
  public customizations!: CustomizationSettings;
  public interactionHistory!: InteractionHistory;
  public satisfactionScore!: number;
  public feedbackNotes!: string;
  public compatibilityScore!: number;
  public usageCount!: number;
  public totalSessionTime!: number;
  public lastUsedAt!: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance methods
  public recordInteraction(sessionLength: number, topics: string[] = [], rating?: number): void {
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

  public getAverageRating(): number {
    const ratings = this.interactionHistory.satisfactionRatings;
    return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
  }

  public isRecentlyUsed(dayThreshold: number = 7): boolean {
    const daysSinceLastUse = (Date.now() - this.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastUse <= dayThreshold;
  }

  public getEngagementLevel(): 'low' | 'medium' | 'high' {
    if (this.usageCount >= 20 && this.totalSessionTime >= 300) return 'high';
    if (this.usageCount >= 5 && this.totalSessionTime >= 60) return 'medium';
    return 'low';
  }

  public updateCustomization(settings: Partial<CustomizationSettings>): void {
    this.customizations = {
      ...this.customizations,
      ...settings,
    };
  }

  public calculateRetentionRisk(): 'low' | 'medium' | 'high' {
    const daysSinceLastUse = (Date.now() - this.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
    const avgRating = this.getAverageRating();

    if (daysSinceLastUse > 14 || avgRating < 6) return 'high';
    if (daysSinceLastUse > 7 || avgRating < 7) return 'medium';
    return 'low';
  }

  // Static methods
  static async getActivePreference(userId: string): Promise<UserAvatarPreference | null> {
    return this.findOne({
      where: {
        userId,
        isActive: true,
      },
      include: ['Avatar'],
    });
  }

  static async setActiveAvatar(userId: string, avatarId: string): Promise<UserAvatarPreference> {
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
    } else {
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

  static async getUserHistory(userId: string): Promise<UserAvatarPreference[]> {
    return this.findAll({
      where: { userId },
      include: ['Avatar'],
      order: [['lastUsedAt', 'DESC']],
    });
  }

  static async getPopularAvatars(limit: number = 10): Promise<
    {
      avatarId: string;
      userCount: number;
      averageRating: number;
      totalUsage: number;
    }[]
  > {
    const preferences = await this.findAll({
      attributes: [
        'avatarId',
        [sequelize.fn('COUNT', sequelize.col('userId')), 'userCount'],
        [sequelize.fn('AVG', sequelize.col('satisfactionScore')), 'averageRating'],
        [sequelize.fn('SUM', sequelize.col('usageCount')), 'totalUsage'],
      ],
      group: ['avatarId'],
      order: [[sequelize.fn('COUNT', sequelize.col('userId')), 'DESC']],
      limit,
      raw: true,
    });

    return preferences.map((p: any) => ({
      avatarId: p.avatarId,
      userCount: parseInt(p.userCount),
      averageRating: parseFloat(p.averageRating) || 0,
      totalUsage: parseInt(p.totalUsage) || 0,
    }));
  }

  static async getAvatarAnalytics(avatarId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    averageRating: number;
    averageSessionTime: number;
    retentionRate: number;
    commonCustomizations: Record<string, any>;
  }> {
    const preferences = await this.findAll({
      where: { avatarId },
    });

    const totalUsers = preferences.length;
    const activeUsers = preferences.filter(p => p.isRecentlyUsed()).length;
    const ratings = preferences.flatMap(p => p.interactionHistory.satisfactionRatings);
    const averageRating =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    const averageSessionTime =
      preferences.reduce((sum, p) => sum + p.interactionHistory.averageSessionLength, 0) /
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

  static async getRecommendationsForUser(userId: string): Promise<{
    suggestedAvatars: string[];
    reasons: string[];
  }> {
    const userHistory = await this.getUserHistory(userId);
    const popularAvatars = await this.getPopularAvatars(5);

    // Get user's personality profile
    const userProfile = await sequelize.models.PersonalityProfile.findOne({
      where: { userId, isActive: true },
    });

    const suggestions: string[] = [];
    const reasons: string[] = [];

    // Based on personality compatibility
    if (userProfile) {
      // Get compatible avatars using the Avatar model's methods
      const { Avatar } = sequelize.models;
      const compatibleAvatars = await (Avatar as any).findByPersonalityType(
        (userProfile as any).traits
      );

      compatibleAvatars.slice(0, 2).forEach((avatar: any) => {
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
        reasons.push(
          `Popular among users with similar preferences (${popular.averageRating.toFixed(1)}/10 rating)`
        );
      }
    });

    return { suggestedAvatars: suggestions, reasons };
  }

  private static analyzeCommonCustomizations(
    customizations: CustomizationSettings[]
  ): Record<string, any> {
    const analysis: Record<string, any> = {};

    // Analyze voice settings
    const voiceSpeeds = customizations
      .map(c => c.voiceSettings?.speed)
      .filter(s => s !== undefined) as number[];

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

  private static getMostCommon<T>(array: T[]): T {
    const frequency: Record<string, number> = {};

    array.forEach(item => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    return array.reduce((a, b) => (frequency[String(a)] > frequency[String(b)] ? a : b));
  }
}

UserAvatarPreference.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    avatarId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'avatars',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    selectedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    customizations: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
    },
    interactionHistory: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    satisfactionScore: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
      },
    },
    feedbackNotes: {
      type: DataTypes.TEXT,
      defaultValue: '',
      allowNull: false,
    },
    compatibilityScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    totalSessionTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  } as any,
  {
    sequelize,
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
  }
);

export { UserAvatarPreference };
