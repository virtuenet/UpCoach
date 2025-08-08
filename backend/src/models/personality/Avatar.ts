import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';

export interface AvatarPersonality {
  recommendedFor: {
    traits: Record<string, { min?: number; max?: number }>;
    mbtiTypes?: string[];
    discProfiles?: string[];
  };
  characteristics: string[];
  coachingStyle: {
    approach: string;
    tone: string;
    communication: string;
    motivation: string;
  };
}

export interface AvatarVisuals {
  profileImage: string;
  thumbnailImage: string;
  animationSet: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  expressions: {
    happy: string;
    encouraging: string;
    thinking: string;
    concerned: string;
    excited: string;
  };
}

export interface AvatarVoice {
  voiceId: string;
  language: string;
  accent: string;
  speed: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
  tone: 'warm' | 'professional' | 'energetic' | 'calm';
}

export interface AvatarBehavior {
  greetingStyle: string[];
  encouragementPhrases: string[];
  questioningApproach: string[];
  celebrationStyle: string[];
  supportiveResponses: string[];
  challengingPrompts: string[];
}

export interface AvatarAttributes {
  id: string;
  name: string;
  description: string;
  category: 'mentor' | 'friend' | 'coach' | 'guide' | 'specialist';
  personality: AvatarPersonality;
  visuals: AvatarVisuals;
  voice: AvatarVoice;
  behavior: AvatarBehavior;
  isActive: boolean;
  isPremium: boolean;
  sortOrder: number;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AvatarCreationAttributes 
  extends Optional<AvatarAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'sortOrder'> {}

class Avatar extends Model<AvatarAttributes, AvatarCreationAttributes> implements AvatarAttributes {
  public id!: string;
  public name!: string;
  public description!: string;
  public category!: 'mentor' | 'friend' | 'coach' | 'guide' | 'specialist';
  public personality!: AvatarPersonality;
  public visuals!: AvatarVisuals;
  public voice!: AvatarVoice;
  public behavior!: AvatarBehavior;
  public isActive!: boolean;
  public isPremium!: boolean;
  public sortOrder!: number;
  public createdBy!: string;
  public updatedBy!: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance methods
  public calculateCompatibilityScore(traits: Record<string, number>): number {
    let score = 0;
    let totalCriteria = 0;

    // Check trait compatibility
    for (const [trait, criteria] of Object.entries(this.personality.recommendedFor.traits)) {
      const userValue = traits[trait] || 0;
      totalCriteria++;

      if (criteria.min !== undefined && criteria.max !== undefined) {
        // Range criteria
        if (userValue >= criteria.min && userValue <= criteria.max) {
          score += 1;
        } else {
          // Partial score based on distance from range
          const distance = Math.min(
            Math.abs(userValue - criteria.min),
            Math.abs(userValue - criteria.max)
          );
          score += Math.max(0, 1 - distance / 50); // 50-point tolerance
        }
      } else if (criteria.min !== undefined) {
        // Minimum criteria
        if (userValue >= criteria.min) {
          score += 1;
        } else {
          score += Math.max(0, userValue / criteria.min);
        }
      } else if (criteria.max !== undefined) {
        // Maximum criteria
        if (userValue <= criteria.max) {
          score += 1;
        } else {
          score += Math.max(0, 1 - (userValue - criteria.max) / 50);
        }
      }
    }

    return totalCriteria > 0 ? (score / totalCriteria) * 100 : 0;
  }

  public getRandomGreeting(): string {
    const greetings = this.behavior.greetingStyle;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  public getRandomEncouragement(): string {
    const encouragements = this.behavior.encouragementPhrases;
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  public getRandomCelebration(): string {
    const celebrations = this.behavior.celebrationStyle;
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  }

  public getExpressionForMood(mood: number): string {
    if (mood >= 8) return this.visuals.expressions.excited;
    if (mood >= 6) return this.visuals.expressions.happy;
    if (mood >= 4) return this.visuals.expressions.encouraging;
    if (mood >= 2) return this.visuals.expressions.concerned;
    return this.visuals.expressions.thinking;
  }

  public isCompatibleWithMBTI(mbtiType: string): boolean {
    return this.personality.recommendedFor.mbtiTypes?.includes(mbtiType) || false;
  }

  public isCompatibleWithDISC(discProfile: string): boolean {
    return this.personality.recommendedFor.discProfiles?.includes(discProfile) || false;
  }

  // Static methods
  static async getActiveAvatars(): Promise<Avatar[]> {
    return this.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }

  static async getRecommendedAvatars(
    traits: Record<string, number>,
    limit: number = 3
  ): Promise<{ avatar: Avatar; compatibilityScore: number }[]> {
    const avatars = await this.getActiveAvatars();
    
    const recommendations = avatars.map(avatar => ({
      avatar,
      compatibilityScore: avatar.calculateCompatibilityScore(traits),
    }));

    return recommendations
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);
  }

  static async findByPersonalityType(
    traits: Record<string, number>,
    mbtiType?: string,
    discProfile?: string
  ): Promise<Avatar[]> {
    const avatars = await this.getActiveAvatars();
    
    return avatars.filter(avatar => {
      // Check MBTI compatibility
      if (mbtiType && !avatar.isCompatibleWithMBTI(mbtiType)) {
        return false;
      }
      
      // Check DISC compatibility
      if (discProfile && !avatar.isCompatibleWithDISC(discProfile)) {
        return false;
      }
      
      // Check trait compatibility (minimum score threshold)
      const compatibilityScore = avatar.calculateCompatibilityScore(traits);
      return compatibilityScore >= 60; // 60% compatibility threshold
    });
  }

  static async getPopularAvatars(limit: number = 5): Promise<Avatar[]> {
    // This would typically join with user_avatar_preferences or usage statistics
    // For now, return avatars sorted by creation date as a placeholder
    return this.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  static async seedDefaultAvatars(): Promise<void> {
    const defaultAvatars = [
      {
        name: 'Alex the Energetic Mentor',
        description: 'An enthusiastic and motivating coach who loves to celebrate your wins and push you towards your goals.',
        category: 'mentor' as const,
        personality: {
          recommendedFor: {
            traits: {
              extraversion: { min: 60 },
              agreeableness: { min: 50 },
              conscientiousness: { min: 40 },
            },
            mbtiTypes: ['ENFJ', 'ENFP', 'ESFJ', 'ESFP'],
          },
          characteristics: ['Energetic', 'Motivating', 'Supportive', 'Goal-oriented'],
          coachingStyle: {
            approach: 'Encouraging and high-energy',
            tone: 'Enthusiastic and warm',
            communication: 'Direct with lots of positive reinforcement',
            motivation: 'Achievement-focused with celebration',
          },
        },
        visuals: {
          profileImage: '/avatars/alex/profile.png',
          thumbnailImage: '/avatars/alex/thumbnail.png',
          animationSet: ['/avatars/alex/idle.gif', '/avatars/alex/talking.gif'],
          colorScheme: {
            primary: '#FF6B35',
            secondary: '#F7931E',
            accent: '#FFD23F',
          },
          expressions: {
            happy: '/avatars/alex/happy.png',
            encouraging: '/avatars/alex/encouraging.png',
            thinking: '/avatars/alex/thinking.png',
            concerned: '/avatars/alex/concerned.png',
            excited: '/avatars/alex/excited.png',
          },
        },
        voice: {
          voiceId: 'en-US-energetic-1',
          language: 'en-US',
          accent: 'American',
          speed: 1.1,
          pitch: 1.1,
          tone: 'energetic' as const,
        },
        behavior: {
          greetingStyle: [
            "Hey there, champion! Ready to conquer the day?",
            "What's up, superstar? Let's make some magic happen!",
            "Hello, my friend! I'm excited to see what we'll achieve today!",
          ],
          encouragementPhrases: [
            "You've got this! I believe in you 100%!",
            "Amazing progress! You're on fire today!",
            "That's the spirit! Keep that momentum going!",
          ],
          questioningApproach: [
            "What's one thing that would make today absolutely amazing?",
            "How can we turn this challenge into your greatest opportunity?",
            "What would success look like for you right now?",
          ],
          celebrationStyle: [
            "🎉 BOOM! You just crushed it! That's what I'm talking about!",
            "YES! Another victory in the books! You're unstoppable!",
            "Incredible! Look at you making dreams happen!",
          ],
          supportiveResponses: [
            "I hear you, and that sounds really challenging. Let's figure this out together.",
            "It's totally normal to feel that way. What's one small step we could take?",
            "You're not alone in this. Every champion faces obstacles.",
          ],
          challengingPrompts: [
            "I know you can do better than that. What would 'going all in' look like?",
            "Let's raise the bar a little. What if we aimed 20% higher?",
            "That's good, but I sense there's more potential here. Want to explore it?",
          ],
        },
        isActive: true,
        isPremium: false,
        sortOrder: 1,
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        name: 'Sam the Wise Guide',
        description: 'A thoughtful and analytical coach who helps you think deeply and make well-informed decisions.',
        category: 'guide' as const,
        personality: {
          recommendedFor: {
            traits: {
              openness: { min: 60 },
              conscientiousness: { min: 60 },
              extraversion: { max: 60 },
            },
            mbtiTypes: ['INTJ', 'INFJ', 'INTP', 'INFP'],
          },
          characteristics: ['Thoughtful', 'Analytical', 'Patient', 'Insightful'],
          coachingStyle: {
            approach: 'Reflective and methodical',
            tone: 'Calm and wise',
            communication: 'Thoughtful questions and deep insights',
            motivation: 'Growth-focused with understanding',
          },
        },
        visuals: {
          profileImage: '/avatars/sam/profile.png',
          thumbnailImage: '/avatars/sam/thumbnail.png',
          animationSet: ['/avatars/sam/idle.gif', '/avatars/sam/talking.gif'],
          colorScheme: {
            primary: '#2E86AB',
            secondary: '#A23B72',
            accent: '#F18F01',
          },
          expressions: {
            happy: '/avatars/sam/content.png',
            encouraging: '/avatars/sam/nodding.png',
            thinking: '/avatars/sam/contemplating.png',
            concerned: '/avatars/sam/thoughtful.png',
            excited: '/avatars/sam/inspired.png',
          },
        },
        voice: {
          voiceId: 'en-US-calm-1',
          language: 'en-US',
          accent: 'American',
          speed: 0.9,
          pitch: 0.9,
          tone: 'calm' as const,
        },
        behavior: {
          greetingStyle: [
            "Hello there. I'm glad you're here. What's on your mind today?",
            "Good to see you. Take a moment to settle in. What would you like to explore?",
            "Welcome. I sense you have something important to work through today.",
          ],
          encouragementPhrases: [
            "That's a really thoughtful insight. You're growing in wisdom.",
            "I can see you're putting in the deep work. That takes courage.",
            "Your reflection shows real maturity. Keep exploring that thought.",
          ],
          questioningApproach: [
            "What patterns do you notice when you step back and observe?",
            "If you imagine yourself five years from now, what would that person advise?",
            "What's the deeper question underneath this challenge?",
          ],
          celebrationStyle: [
            "This is a meaningful breakthrough. Honor this moment of growth.",
            "You've gained real wisdom here. That's something to treasure.",
            "The clarity you've found is beautiful. Well done on this inner work.",
          ],
          supportiveResponses: [
            "That sounds like a complex situation with many layers. Let's unpack it slowly.",
            "I can sense the weight of this decision. What values want to guide you here?",
            "Sometimes the path forward isn't clear immediately, and that's okay.",
          ],
          challengingPrompts: [
            "I wonder if there's another perspective we haven't considered yet?",
            "What would happen if you questioned that assumption?",
            "Is there a part of this story you might be avoiding?",
          ],
        },
        isActive: true,
        isPremium: false,
        sortOrder: 2,
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        name: 'Riley the Supportive Friend',
        description: 'A warm and empathetic companion who creates a safe space for you to share and grow.',
        category: 'friend' as const,
        personality: {
          recommendedFor: {
            traits: {
              agreeableness: { min: 70 },
              neuroticism: { min: 40 },
              extraversion: { min: 30, max: 70 },
            },
            mbtiTypes: ['ISFJ', 'ISFP', 'ESFJ', 'ESFP'],
          },
          characteristics: ['Empathetic', 'Warm', 'Supportive', 'Understanding'],
          coachingStyle: {
            approach: 'Gentle and nurturing',
            tone: 'Warm and caring',
            communication: 'Empathetic listening with gentle guidance',
            motivation: 'Relationship-focused with emotional support',
          },
        },
        visuals: {
          profileImage: '/avatars/riley/profile.png',
          thumbnailImage: '/avatars/riley/thumbnail.png',
          animationSet: ['/avatars/riley/idle.gif', '/avatars/riley/talking.gif'],
          colorScheme: {
            primary: '#E07A5F',
            secondary: '#81B29A',
            accent: '#F2CC8F',
          },
          expressions: {
            happy: '/avatars/riley/smiling.png',
            encouraging: '/avatars/riley/supportive.png',
            thinking: '/avatars/riley/listening.png',
            concerned: '/avatars/riley/caring.png',
            excited: '/avatars/riley/joyful.png',
          },
        },
        voice: {
          voiceId: 'en-US-warm-1',
          language: 'en-US',
          accent: 'American',
          speed: 1.0,
          pitch: 1.0,
          tone: 'warm' as const,
        },
        behavior: {
          greetingStyle: [
            "Hi honey, how are you feeling today? I'm here for you.",
            "Hey there, beautiful soul. What's in your heart right now?",
            "Hello, my dear friend. I can sense you might need some support today.",
          ],
          encouragementPhrases: [
            "You're being so brave by facing this. I'm proud of you.",
            "Your heart is in the right place. Trust yourself.",
            "It's okay to feel whatever you're feeling. You're safe here.",
          ],
          questioningApproach: [
            "How does your heart feel about this situation?",
            "What do you need most from yourself right now?",
            "If your best friend were going through this, what would you tell them?",
          ],
          celebrationStyle: [
            "Oh, this makes my heart so happy! You deserve all this goodness!",
            "I'm literally beaming with pride for you right now! 💕",
            "Your growth is so beautiful to witness. Celebrate yourself!",
          ],
          supportiveResponses: [
            "I'm holding space for you right now. You don't have to carry this alone.",
            "That sounds really hard. Would it help to talk through what you're feeling?",
            "You're allowed to struggle. You're allowed to not be okay. I'm here.",
          ],
          challengingPrompts: [
            "I believe in you so much. What would self-love look like here?",
            "You're stronger than you know. What would courage whisper to you?",
            "What would honoring your authentic self mean in this moment?",
          ],
        },
        isActive: true,
        isPremium: false,
        sortOrder: 3,
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    for (const avatarData of defaultAvatars) {
      await this.findOrCreate({
        where: { name: avatarData.name },
        defaults: avatarData as any,
      });
    }
  }
}

Avatar.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('mentor', 'friend', 'coach', 'guide', 'specialist'),
      allowNull: false,
    },
    personality: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    visuals: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    voice: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    behavior: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  } as any,
  {
    sequelize,
    modelName: 'Avatar',
    tableName: 'avatars',
    timestamps: true,
    indexes: [
      {
        fields: ['isActive'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['isPremium'],
      },
      {
        fields: ['sortOrder'],
      },
    ],
  }
);

export { Avatar }; 