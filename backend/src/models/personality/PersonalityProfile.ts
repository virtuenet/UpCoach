import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';

export interface PersonalityTraits {
  openness: number;        // 0-100 scale
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface PersonalityInsights {
  primaryTraits: string[];
  strengths: string[];
  growthAreas: string[];
  coachingStyle: CoachingStylePreference;
  communicationStyle: CommunicationStyle;
  motivationFactors: MotivationFactor[];
}

export interface CoachingStylePreference {
  approach: 'directive' | 'collaborative' | 'supportive' | 'challenging';
  feedback: 'direct' | 'gentle' | 'encouraging' | 'analytical';
  pace: 'fast' | 'moderate' | 'slow';
  structure: 'high' | 'medium' | 'low';
}

export interface CommunicationStyle {
  tone: 'formal' | 'casual' | 'warm' | 'professional';
  detail: 'brief' | 'moderate' | 'detailed';
  examples: 'abstract' | 'concrete' | 'mixed';
  encouragement: 'high' | 'medium' | 'low';
}

export interface MotivationFactor {
  factor: string;
  importance: number; // 0-100
  description: string;
}

export interface PersonalityProfileAttributes {
  id: string;
  userId: string;
  assessmentType: 'big_five' | 'mbti' | 'disc' | 'custom';
  traits: PersonalityTraits;
  mbtiType?: string;
  discProfile?: string;
  insights: PersonalityInsights;
  confidence: number; // 0-100, confidence in assessment accuracy
  assessmentDate: Date;
  questionsAnswered: number;
  totalQuestions: number;
  responses: Record<string, any>[]; // Raw question responses
  version: string; // Assessment version for future compatibility
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PersonalityProfileCreationAttributes 
  extends Optional<PersonalityProfileAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> {}

class PersonalityProfile extends Model<PersonalityProfileAttributes, PersonalityProfileCreationAttributes> 
  implements PersonalityProfileAttributes {
  
  public id!: string;
  public userId!: string;
  public assessmentType!: 'big_five' | 'mbti' | 'disc' | 'custom';
  public traits!: PersonalityTraits;
  public mbtiType?: string;
  public discProfile?: string;
  public insights!: PersonalityInsights;
  public confidence!: number;
  public assessmentDate!: Date;
  public questionsAnswered!: number;
  public totalQuestions!: number;
  public responses!: Record<string, any>[];
  public version!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getDominantTrait(): string {
    const traits = this.traits;
    const traitNames = Object.keys(traits) as (keyof PersonalityTraits)[];
    
    return traitNames.reduce((dominant, current) => 
      traits[current] > traits[dominant] ? current : dominant
    );
  }

  public getTraitDescription(trait: keyof PersonalityTraits): string {
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
        : 'Emotionally stable and resilient'
    };
    
    return descriptions[trait];
  }

  public getRecommendedAvatar(): string {
    // Logic to recommend avatar based on personality
    const { extraversion, agreeableness, conscientiousness, openness, neuroticism } = this.traits;
    
    if (extraversion > 70 && agreeableness > 60) {
      return 'energetic-mentor';
    } else if (conscientiousness > 70 && openness > 60) {
      return 'wise-guide';
    } else if (agreeableness > 70 && neuroticism < 40) {
      return 'supportive-friend';
    } else if (openness > 70 && extraversion > 50) {
      return 'creative-innovator';
    } else if (conscientiousness > 60) {
      return 'structured-coach';
    } else {
      return 'balanced-advisor';
    }
  }

  public isCompleteAssessment(): boolean {
    return this.questionsAnswered >= this.totalQuestions * 0.8; // 80% completion
  }

  public getPersonalityScoreCard(): {
    trait: string;
    score: number;
    level: 'low' | 'moderate' | 'high';
    description: string;
  }[] {
    const traits = this.traits;
    
    return Object.entries(traits).map(([trait, score]) => ({
      trait: trait.charAt(0).toUpperCase() + trait.slice(1),
      score,
      level: score < 33 ? 'low' : score < 67 ? 'moderate' : 'high',
      description: this.getTraitDescription(trait as keyof PersonalityTraits)
    }));
  }

  // Static methods
  static async getActiveProfile(userId: string): Promise<PersonalityProfile | null> {
    return this.findOne({
      where: {
        userId,
        isActive: true,
      },
      order: [['assessmentDate', 'DESC']],
    });
  }

  static async createFromAssessment(
    userId: string,
    responses: Record<string, any>[],
    assessmentType: 'big_five' | 'mbti' | 'disc' | 'custom' = 'big_five'
  ): Promise<PersonalityProfile> {
    // This would be called after processing assessment responses
    // The actual trait calculation would be done in the PersonalityService
    
    const traits = await this.calculateTraitsFromResponses(responses, assessmentType);
    const insights = await this.generateInsights(traits);
    
    // Deactivate previous profiles
    await this.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );
    
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

  private static async calculateTraitsFromResponses(
    responses: Record<string, any>[],
    assessmentType: string
  ): Promise<PersonalityTraits> {
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
      
      scores[trait as keyof PersonalityTraits] += value;
    });

    // Normalize scores to 0-100 scale
    const maxScore = responses.length / 5 * 5; // Assuming 5-point scale
    
    return {
      openness: Math.round((scores.openness / maxScore) * 100),
      conscientiousness: Math.round((scores.conscientiousness / maxScore) * 100),
      extraversion: Math.round((scores.extraversion / maxScore) * 100),
      agreeableness: Math.round((scores.agreeableness / maxScore) * 100),
      neuroticism: Math.round((scores.neuroticism / maxScore) * 100),
    };
  }

  private static async generateInsights(traits: PersonalityTraits): Promise<PersonalityInsights> {
    const primaryTraits = Object.entries(traits)
      .sort(([,a], [,b]) => b - a)
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

  private static getStrengthsForTraits(traits: PersonalityTraits): string[] {
    const strengths: string[] = [];
    
    if (traits.openness > 60) strengths.push('Creative thinking', 'Adaptability');
    if (traits.conscientiousness > 60) strengths.push('Organization', 'Reliability');
    if (traits.extraversion > 60) strengths.push('Leadership', 'Communication');
    if (traits.agreeableness > 60) strengths.push('Teamwork', 'Empathy');
    if (traits.neuroticism < 40) strengths.push('Emotional stability', 'Stress resilience');
    
    return strengths.slice(0, 4); // Limit to top 4 strengths
  }

  private static getGrowthAreasForTraits(traits: PersonalityTraits): string[] {
    const growthAreas: string[] = [];
    
    if (traits.openness < 40) growthAreas.push('Embracing change', 'Creative exploration');
    if (traits.conscientiousness < 40) growthAreas.push('Time management', 'Goal setting');
    if (traits.extraversion < 40) growthAreas.push('Social confidence', 'Networking');
    if (traits.agreeableness < 40) growthAreas.push('Collaboration', 'Conflict resolution');
    if (traits.neuroticism > 60) growthAreas.push('Stress management', 'Emotional regulation');
    
    return growthAreas.slice(0, 3); // Limit to top 3 growth areas
  }

  private static getCoachingStyle(traits: PersonalityTraits): CoachingStylePreference {
    return {
      approach: traits.conscientiousness > 60 ? 'directive' : 
                traits.agreeableness > 60 ? 'supportive' : 'collaborative',
      feedback: traits.neuroticism > 60 ? 'gentle' : 
                traits.extraversion > 60 ? 'direct' : 'encouraging',
      pace: traits.conscientiousness > 60 ? 'fast' : 
            traits.neuroticism > 60 ? 'slow' : 'moderate',
      structure: traits.conscientiousness > 60 ? 'high' : 
                 traits.openness > 60 ? 'low' : 'medium',
    };
  }

  private static getCommunicationStyle(traits: PersonalityTraits): CommunicationStyle {
    return {
      tone: traits.agreeableness > 60 ? 'warm' : 
            traits.conscientiousness > 60 ? 'professional' : 'casual',
      detail: traits.conscientiousness > 60 ? 'detailed' : 
              traits.extraversion > 60 ? 'brief' : 'moderate',
      examples: traits.openness > 60 ? 'abstract' : 'concrete',
      encouragement: traits.agreeableness > 60 ? 'high' : 
                     traits.neuroticism > 60 ? 'high' : 'medium',
    };
  }

  private static getMotivationFactors(traits: PersonalityTraits): MotivationFactor[] {
    const factors: MotivationFactor[] = [];
    
    if (traits.extraversion > 60) {
      factors.push({
        factor: 'Social Recognition',
        importance: traits.extraversion,
        description: 'Achievement acknowledgment from others'
      });
    }
    
    if (traits.conscientiousness > 60) {
      factors.push({
        factor: 'Goal Achievement',
        importance: traits.conscientiousness,
        description: 'Completing objectives and reaching targets'
      });
    }
    
    if (traits.openness > 60) {
      factors.push({
        factor: 'Learning & Growth',
        importance: traits.openness,
        description: 'Acquiring new skills and knowledge'
      });
    }

    return factors.sort((a, b) => b.importance - a.importance).slice(0, 3);
  }

  private static calculateConfidence(responses: Record<string, any>[]): number {
    // Simple confidence calculation based on response consistency
    const completion = responses.length >= 20 ? 100 : (responses.length / 20) * 100;
    const consistency = this.calculateResponseConsistency(responses);
    
    return Math.round((completion * 0.6) + (consistency * 0.4));
  }

  private static calculateResponseConsistency(responses: Record<string, any>[]): number {
    // Analyze response patterns for consistency
    // This is a simplified implementation
    const values = responses.map(r => parseInt(r.value) || 0);
    const variance = this.calculateVariance(values);
    
    // Lower variance indicates more consistent responses
    return Math.max(0, 100 - variance * 20);
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private static getQuestionMapping(assessmentType: string): string[] {
    // Map questions to Big Five traits
    return ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  }

  private static getTotalQuestions(assessmentType: string): number {
    switch (assessmentType) {
      case 'big_five': return 50;
      case 'mbti': return 60;
      case 'disc': return 40;
      default: return 50;
    }
  }
}

PersonalityProfile.init(
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
    assessmentType: {
      type: DataTypes.ENUM('big_five', 'mbti', 'disc', 'custom'),
      allowNull: false,
      defaultValue: 'big_five',
    },
    traits: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidTraits(value: PersonalityTraits) {
          const requiredTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
          for (const trait of requiredTraits) {
            if (!(trait in value) || value[trait as keyof PersonalityTraits] < 0 || value[trait as keyof PersonalityTraits] > 100) {
              throw new Error(`Invalid trait value for ${trait}`);
            }
          }
        },
      },
    },
    mbtiType: {
      type: DataTypes.STRING(4),
      allowNull: true,
      validate: {
        is: /^[IE][SN][TF][JP]$/,
      },
    },
    discProfile: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    insights: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    confidence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    assessmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    questionsAnswered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    responses: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '1.0',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  } as any,
  {
    sequelize,
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
  }
);

export { PersonalityProfile }; 