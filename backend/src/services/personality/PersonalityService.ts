import { PersonalityProfile, PersonalityTraits } from '../../models/personality/PersonalityProfile';
import { Avatar } from '../../models/personality/Avatar';
import { UserAvatarPreference } from '../../models/personality/UserAvatarPreference';

export interface AssessmentQuestion {
  id: string;
  question: string;
  trait: keyof PersonalityTraits;
  isReversed: boolean;
  scale: {
    min: number;
    max: number;
    labels: { value: number; label: string }[];
  };
  category: string;
}

export interface AssessmentResponse {
  questionId: string;
  value: number;
  timeSpent: number; // seconds
  confidence: number; // 1-5 scale
}

export interface PersonalityAssessmentResult {
  profile: PersonalityProfile;
  recommendedAvatars: { avatar: Avatar; compatibilityScore: number; reasons: string[] }[];
  insights: {
    summary: string;
    strengths: string[];
    growthAreas: string[];
    coachingRecommendations: string[];
  };
}

export class PersonalityService {
  private static readonly BIG_FIVE_QUESTIONS: AssessmentQuestion[] = [
    // Openness questions
    {
      id: 'o1',
      question: 'I enjoy trying new and different activities.',
      trait: 'openness',
      isReversed: false,
      scale: { min: 1, max: 5, labels: [
        { value: 1, label: 'Strongly Disagree' },
        { value: 2, label: 'Disagree' },
        { value: 3, label: 'Neutral' },
        { value: 4, label: 'Agree' },
        { value: 5, label: 'Strongly Agree' }
      ]},
      category: 'creativity'
    },
    {
      id: 'o2',
      question: 'I prefer routine and familiar experiences.',
      trait: 'openness',
      isReversed: true,
      scale: { min: 1, max: 5, labels: [
        { value: 1, label: 'Strongly Disagree' },
        { value: 2, label: 'Disagree' },
        { value: 3, label: 'Neutral' },
        { value: 4, label: 'Agree' },
        { value: 5, label: 'Strongly Agree' }
      ]},
      category: 'routine'
    },
    // Conscientiousness questions
    {
      id: 'c1',
      question: 'I am always prepared and organized.',
      trait: 'conscientiousness',
      isReversed: false,
      scale: { min: 1, max: 5, labels: [
        { value: 1, label: 'Strongly Disagree' },
        { value: 2, label: 'Disagree' },
        { value: 3, label: 'Neutral' },
        { value: 4, label: 'Agree' },
        { value: 5, label: 'Strongly Agree' }
      ]},
      category: 'organization'
    },
    {
      id: 'c2',
      question: 'I tend to be disorganized and scattered.',
      trait: 'conscientiousness',
      isReversed: true,
      scale: { min: 1, max: 5, labels: [
        { value: 1, label: 'Strongly Disagree' },
        { value: 2, label: 'Disagree' },
        { value: 3, label: 'Neutral' },
        { value: 4, label: 'Agree' },
        { value: 5, label: 'Strongly Agree' }
      ]},
      category: 'organization'
    },
    // Add more questions for complete assessment...
  ];

  /**
   * Get assessment questions based on type
   */
  static getAssessmentQuestions(
    assessmentType: 'big_five' | 'short' | 'comprehensive' = 'big_five'
  ): AssessmentQuestion[] {
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
  static async processAssessment(
    userId: string,
    responses: AssessmentResponse[],
    assessmentType: 'big_five' | 'mbti' | 'disc' | 'custom' = 'big_five'
  ): Promise<PersonalityAssessmentResult> {
    // Calculate personality traits from responses
    const traits = await this.calculateTraits(responses, assessmentType);
    
    // Create or update personality profile
    const profile = await PersonalityProfile.createFromAssessment(
      userId,
      responses.map(r => ({ questionId: r.questionId, value: r.value, timeSpent: r.timeSpent })),
      assessmentType
    );

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
  private static async calculateTraits(
    responses: AssessmentResponse[],
    assessmentType: string
  ): Promise<PersonalityTraits> {
    const questions = this.getAssessmentQuestions(assessmentType as any);
    const traitScores: Record<string, number[]> = {
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      neuroticism: [],
    };

    // Process each response
    responses.forEach(response => {
      const question = questions.find(q => q.id === response.questionId);
      if (!question) return;

      let score = response.value;
      
      // Reverse score if needed
      if (question.isReversed) {
        score = question.scale.max + 1 - score;
      }

      traitScores[question.trait].push(score);
    });

    // Calculate averages and convert to 0-100 scale
    const traits: PersonalityTraits = {
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
  private static calculateTraitScore(scores: number[], maxScale: number): number {
    if (scores.length === 0) return 50; // Default to middle

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(((average - 1) / (maxScale - 1)) * 100);
  }

  /**
   * Get avatar recommendations based on personality traits
   */
  private static async getAvatarRecommendations(
    traits: PersonalityTraits,
    profile: PersonalityProfile
  ): Promise<{ avatar: Avatar; compatibilityScore: number; reasons: string[] }[]> {
    const avatarRecommendations = await Avatar.getRecommendedAvatars(traits, 5);
    
    return avatarRecommendations.map(({ avatar, compatibilityScore }) => ({
      avatar,
      compatibilityScore,
      reasons: this.generateCompatibilityReasons(traits, avatar, compatibilityScore),
    }));
  }

  /**
   * Generate reasons for avatar compatibility
   */
  private static generateCompatibilityReasons(
    traits: PersonalityTraits,
    avatar: Avatar,
    compatibilityScore: number
  ): string[] {
    const reasons: string[] = [];
    const dominantTrait = this.getDominantTrait(traits);
    
    // Add specific reasons based on trait compatibility
    if (traits.extraversion > 70 && avatar.personality.characteristics.includes('Energetic')) {
      reasons.push('Matches your outgoing and energetic personality');
    }
    
    if (traits.conscientiousness > 70 && avatar.personality.characteristics.includes('Goal-oriented')) {
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
      } else if (compatibilityScore > 60) {
        reasons.push('Good match for your personality traits');
      } else {
        reasons.push('Could offer a fresh perspective on your growth');
      }
    }

    return reasons.slice(0, 3); // Limit to 3 reasons
  }

  /**
   * Get dominant personality trait
   */
  private static getDominantTrait(traits: PersonalityTraits): keyof PersonalityTraits {
    return Object.entries(traits).reduce((a, b) => 
      traits[a[0] as keyof PersonalityTraits] > traits[b[0] as keyof PersonalityTraits] ? a : b
    )[0] as keyof PersonalityTraits;
  }

  /**
   * Generate personalized insights
   */
  private static async generatePersonalizedInsights(
    profile: PersonalityProfile
  ): Promise<{
    summary: string;
    strengths: string[];
    growthAreas: string[];
    coachingRecommendations: string[];
  }> {
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
  private static generatePersonalitySummary(
    traits: PersonalityTraits,
    dominantTrait: keyof PersonalityTraits
  ): string {
    const traitDescriptions = {
      openness: 'creative and open to new experiences',
      conscientiousness: 'organized and goal-oriented',
      extraversion: 'outgoing and energetic',
      agreeableness: 'cooperative and empathetic',
      neuroticism: 'sensitive and emotionally aware',
    };

    const primaryDescription = traitDescriptions[dominantTrait];
    const secondaryTraits = Object.entries(traits)
      .sort(([,a], [,b]) => b - a)
      .slice(1, 3)
      .map(([trait]) => trait);

    return `You are primarily ${primaryDescription}, with strong tendencies toward ${secondaryTraits.join(' and ')}. This combination suggests you thrive in environments that balance ${this.getEnvironmentPreference(dominantTrait)} with opportunities for ${this.getGrowthPreference(secondaryTraits)}.`;
  }

  /**
   * Generate coaching recommendations
   */
  private static generateCoachingRecommendations(traits: PersonalityTraits): string[] {
    const recommendations: string[] = [];

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
  private static getEnvironmentPreference(dominantTrait: keyof PersonalityTraits): string {
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
  private static getGrowthPreference(secondaryTraits: string[]): string {
    const growthAreas = {
      openness: 'learning and discovery',
      conscientiousness: 'goal achievement',
      extraversion: 'social connection',
      agreeableness: 'helping others',
      neuroticism: 'emotional growth',
    };

    return secondaryTraits
      .map(trait => growthAreas[trait as keyof PersonalityTraits])
      .join(' and ');
  }

  /**
   * Get personality profile for user
   */
  static async getUserProfile(userId: string): Promise<PersonalityProfile | null> {
    return PersonalityProfile.getActiveProfile(userId);
  }

  /**
   * Update user's avatar selection
   */
  static async selectAvatar(
    userId: string,
    avatarId: string,
    customizations?: any
  ): Promise<UserAvatarPreference> {
    const preference = await UserAvatarPreference.setActiveAvatar(userId, avatarId);
    
    if (customizations) {
      preference.updateCustomization(customizations);
      await preference.save();
    }

    // Calculate compatibility score if user has personality profile
    const profile = await this.getUserProfile(userId);
    if (profile) {
      const avatar = await Avatar.findByPk(avatarId);
      if (avatar) {
        const compatibilityScore = avatar.calculateCompatibilityScore(profile.traits);
        preference.compatibilityScore = compatibilityScore;
        await preference.save();
      }
    }

    return preference;
  }

  /**
   * Record interaction with avatar
   */
  static async recordInteraction(
    userId: string,
    sessionLength: number,
    topics: string[] = [],
    rating?: number
  ): Promise<void> {
    const preference = await UserAvatarPreference.getActivePreference(userId);
    if (preference) {
      preference.recordInteraction(sessionLength, topics, rating);
      await preference.save();
    }
  }

  /**
   * Get avatar analytics for admin
   */
  static async getAvatarAnalytics(avatarId: string) {
    return UserAvatarPreference.getAvatarAnalytics(avatarId);
  }

  /**
   * Get user recommendations
   */
  static async getUserRecommendations(userId: string) {
    return UserAvatarPreference.getRecommendationsForUser(userId);
  }
}

export default PersonalityService; 