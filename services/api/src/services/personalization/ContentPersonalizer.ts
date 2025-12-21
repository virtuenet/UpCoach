/**
 * Content Personalizer
 * Adapts content based on user preferences, behavior, and context
 */

import { DeepUserEmbeddingService, UserEmbedding } from './DeepUserEmbedding';
import { ContextualBandit, Context, Arm } from './ContextualBandit';

// ==================== Types ====================

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  metadata: ContentMetadata;
  embedding?: number[];
}

export type ContentType =
  | 'article'
  | 'tip'
  | 'exercise'
  | 'meditation'
  | 'video'
  | 'quote'
  | 'challenge'
  | 'lesson'
  | 'reflection_prompt';

export interface ContentMetadata {
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // minutes
  emotionalTone: EmotionalTone;
  readingLevel: number; // 1-10 scale
  interactivity: 'passive' | 'interactive' | 'highly_interactive';
  contentLength: 'short' | 'medium' | 'long';
  visualRichness: 'text_only' | 'light_visuals' | 'rich_visuals';
}

export type EmotionalTone =
  | 'motivational'
  | 'calming'
  | 'energizing'
  | 'reflective'
  | 'educational'
  | 'celebratory'
  | 'supportive';

export interface UserContentPreferences {
  userId: string;
  preferredTypes: ContentType[];
  preferredCategories: string[];
  preferredTones: EmotionalTone[];
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  preferredLength: 'short' | 'medium' | 'long';
  preferredInteractivity: 'passive' | 'interactive' | 'highly_interactive';
  optimalReadingLevel: number;
  consumptionPatterns: ConsumptionPattern;
  topicInterests: Map<string, number>; // topic -> interest score
  recentlyViewed: string[]; // content IDs
  favorites: string[];
  disliked: string[];
}

export interface ConsumptionPattern {
  averageSessionDuration: number; // minutes
  preferredTimeOfDay: number; // hour
  preferredDayOfWeek: number[];
  completionRate: number;
  engagementScore: number;
}

export interface PersonalizedContent extends Content {
  personalizationScore: number;
  relevanceFactors: RelevanceFactor[];
  adaptations: ContentAdaptation[];
}

export interface RelevanceFactor {
  factor: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface ContentAdaptation {
  type: AdaptationType;
  original: string;
  adapted: string;
  reason: string;
}

export type AdaptationType =
  | 'tone_shift'
  | 'length_adjustment'
  | 'complexity_change'
  | 'personalized_example'
  | 'name_insertion'
  | 'context_addition';

export interface ContentRecommendation {
  content: PersonalizedContent;
  rank: number;
  explanations: string[];
  confidence: number;
}

export interface ContentFeedback {
  contentId: string;
  userId: string;
  action: 'viewed' | 'completed' | 'saved' | 'shared' | 'dismissed' | 'rated';
  rating?: number;
  timeSpent?: number;
  timestamp: Date;
}

// ==================== Content Personalizer ====================

export class ContentPersonalizer {
  private embeddingService: DeepUserEmbeddingService;
  private contentBandit: ContextualBandit;
  private userPreferences: Map<string, UserContentPreferences> = new Map();
  private contentLibrary: Map<string, Content> = new Map();
  private contentEmbeddings: Map<string, number[]> = new Map();

  // Weights for scoring
  private readonly scoringWeights = {
    typeMatch: 0.15,
    categoryMatch: 0.15,
    toneMatch: 0.10,
    difficultyMatch: 0.10,
    lengthMatch: 0.08,
    interactivityMatch: 0.07,
    readingLevelMatch: 0.10,
    topicInterest: 0.15,
    novelty: 0.05,
    embeddingSimilarity: 0.05,
  };

  constructor() {
    this.embeddingService = new DeepUserEmbeddingService();
    this.contentBandit = new ContextualBandit({
      algorithm: 'thompson_sampling',
      explorationRate: 0.15,
    });
  }

  // ==================== Core Methods ====================

  /**
   * Get personalized content recommendations
   */
  async getRecommendations(
    userId: string,
    count: number = 5,
    context?: ContentContext
  ): Promise<ContentRecommendation[]> {
    const preferences = await this.getUserPreferences(userId);
    const userEmbedding = await this.embeddingService.generateEmbedding(userId);

    // Get all available content
    const availableContent = this.getAvailableContent(preferences, context);

    // Score each piece of content
    const scoredContent: Array<{
      content: Content;
      score: number;
      factors: RelevanceFactor[];
    }> = [];

    for (const content of availableContent) {
      const { score, factors } = this.scoreContent(
        content,
        preferences,
        userEmbedding,
        context
      );
      scoredContent.push({ content, score, factors });
    }

    // Sort by score
    scoredContent.sort((a, b) => b.score - a.score);

    // Use bandit for exploration-exploitation
    const recommendations: ContentRecommendation[] = [];
    const banditContext = this.buildBanditContext(preferences, context);

    for (let i = 0; i < Math.min(count, scoredContent.length); i++) {
      const { content, score, factors } = scoredContent[i];

      // Apply adaptations
      const adaptations = await this.generateAdaptations(content, preferences, context);

      const personalizedContent: PersonalizedContent = {
        ...content,
        personalizationScore: score,
        relevanceFactors: factors,
        adaptations,
      };

      recommendations.push({
        content: personalizedContent,
        rank: i + 1,
        explanations: this.generateExplanations(factors, preferences),
        confidence: this.calculateConfidence(factors),
      });
    }

    return recommendations;
  }

  /**
   * Adapt content for a specific user
   */
  async adaptContent(
    content: Content,
    userId: string,
    adaptationLevel: 'light' | 'moderate' | 'full' = 'moderate'
  ): Promise<PersonalizedContent> {
    const preferences = await this.getUserPreferences(userId);
    const userEmbedding = await this.embeddingService.generateEmbedding(userId);

    const { score, factors } = this.scoreContent(content, preferences, userEmbedding);
    const adaptations = await this.generateAdaptations(content, preferences, undefined, adaptationLevel);

    return {
      ...content,
      personalizationScore: score,
      relevanceFactors: factors,
      adaptations,
    };
  }

  /**
   * Record content feedback
   */
  async recordFeedback(feedback: ContentFeedback): Promise<void> {
    const preferences = this.userPreferences.get(feedback.userId);
    if (!preferences) return;

    // Update recently viewed
    if (feedback.action === 'viewed' || feedback.action === 'completed') {
      preferences.recentlyViewed.unshift(feedback.contentId);
      if (preferences.recentlyViewed.length > 50) {
        preferences.recentlyViewed.pop();
      }
    }

    // Update favorites
    if (feedback.action === 'saved') {
      if (!preferences.favorites.includes(feedback.contentId)) {
        preferences.favorites.push(feedback.contentId);
      }
    }

    // Update disliked
    if (feedback.action === 'dismissed') {
      if (!preferences.disliked.includes(feedback.contentId)) {
        preferences.disliked.push(feedback.contentId);
      }
    }

    // Update consumption patterns
    if (feedback.timeSpent) {
      preferences.consumptionPatterns.averageSessionDuration =
        preferences.consumptionPatterns.averageSessionDuration * 0.9 +
        feedback.timeSpent * 0.1;
    }

    // Report to bandit
    const content = this.contentLibrary.get(feedback.contentId);
    if (content) {
      const reward = this.calculateReward(feedback);
      this.contentBandit.reportReward({
        armId: content.type,
        reward,
        context: this.buildBanditContext(preferences),
      });
    }

    this.userPreferences.set(feedback.userId, preferences);
  }

  // ==================== Content Library Management ====================

  /**
   * Register content in the library
   */
  registerContent(content: Content): void {
    this.contentLibrary.set(content.id, content);

    // Generate and store embedding
    if (!content.embedding) {
      const embedding = this.generateContentEmbedding(content);
      this.contentEmbeddings.set(content.id, embedding);
    } else {
      this.contentEmbeddings.set(content.id, content.embedding);
    }

    // Register as bandit arm
    this.contentBandit.registerArm({
      id: content.type,
      metadata: { category: content.metadata.category },
    });
  }

  /**
   * Get content by ID
   */
  getContent(contentId: string): Content | undefined {
    return this.contentLibrary.get(contentId);
  }

  // ==================== Private Methods ====================

  private async getUserPreferences(userId: string): Promise<UserContentPreferences> {
    let preferences = this.userPreferences.get(userId);

    if (!preferences) {
      // Create default preferences
      preferences = {
        userId,
        preferredTypes: ['tip', 'exercise', 'quote'],
        preferredCategories: ['habits', 'productivity', 'mindfulness'],
        preferredTones: ['motivational', 'supportive'],
        preferredDifficulty: 'intermediate',
        preferredLength: 'medium',
        preferredInteractivity: 'interactive',
        optimalReadingLevel: 6,
        consumptionPatterns: {
          averageSessionDuration: 5,
          preferredTimeOfDay: 9,
          preferredDayOfWeek: [1, 2, 3, 4, 5],
          completionRate: 0.7,
          engagementScore: 0.6,
        },
        topicInterests: new Map([
          ['habits', 0.8],
          ['goals', 0.7],
          ['mindfulness', 0.6],
        ]),
        recentlyViewed: [],
        favorites: [],
        disliked: [],
      };
      this.userPreferences.set(userId, preferences);
    }

    return preferences;
  }

  private getAvailableContent(
    preferences: UserContentPreferences,
    context?: ContentContext
  ): Content[] {
    const available: Content[] = [];

    for (const [id, content] of this.contentLibrary) {
      // Filter out disliked content
      if (preferences.disliked.includes(id)) continue;

      // Filter out recently viewed (avoid repetition)
      if (preferences.recentlyViewed.slice(0, 10).includes(id)) continue;

      // Filter by context if provided
      if (context?.requiredType && content.type !== context.requiredType) continue;
      if (context?.requiredCategory && content.metadata.category !== context.requiredCategory) continue;

      available.push(content);
    }

    return available;
  }

  private scoreContent(
    content: Content,
    preferences: UserContentPreferences,
    userEmbedding: UserEmbedding,
    context?: ContentContext
  ): { score: number; factors: RelevanceFactor[] } {
    const factors: RelevanceFactor[] = [];

    // Type match
    const typeMatch = preferences.preferredTypes.includes(content.type) ? 1.0 : 0.3;
    factors.push({
      factor: 'type_match',
      score: typeMatch,
      weight: this.scoringWeights.typeMatch,
      contribution: typeMatch * this.scoringWeights.typeMatch,
    });

    // Category match
    const categoryMatch = preferences.preferredCategories.includes(content.metadata.category) ? 1.0 : 0.3;
    factors.push({
      factor: 'category_match',
      score: categoryMatch,
      weight: this.scoringWeights.categoryMatch,
      contribution: categoryMatch * this.scoringWeights.categoryMatch,
    });

    // Tone match
    const toneMatch = preferences.preferredTones.includes(content.metadata.emotionalTone) ? 1.0 : 0.4;
    factors.push({
      factor: 'tone_match',
      score: toneMatch,
      weight: this.scoringWeights.toneMatch,
      contribution: toneMatch * this.scoringWeights.toneMatch,
    });

    // Difficulty match
    const difficultyScore = this.scoreDifficultyMatch(content.metadata.difficulty, preferences.preferredDifficulty);
    factors.push({
      factor: 'difficulty_match',
      score: difficultyScore,
      weight: this.scoringWeights.difficultyMatch,
      contribution: difficultyScore * this.scoringWeights.difficultyMatch,
    });

    // Length match
    const lengthMatch = content.metadata.contentLength === preferences.preferredLength ? 1.0 : 0.5;
    factors.push({
      factor: 'length_match',
      score: lengthMatch,
      weight: this.scoringWeights.lengthMatch,
      contribution: lengthMatch * this.scoringWeights.lengthMatch,
    });

    // Interactivity match
    const interactivityMatch = content.metadata.interactivity === preferences.preferredInteractivity ? 1.0 : 0.5;
    factors.push({
      factor: 'interactivity_match',
      score: interactivityMatch,
      weight: this.scoringWeights.interactivityMatch,
      contribution: interactivityMatch * this.scoringWeights.interactivityMatch,
    });

    // Reading level match
    const readingLevelDiff = Math.abs(content.metadata.readingLevel - preferences.optimalReadingLevel);
    const readingLevelMatch = Math.max(0, 1 - readingLevelDiff / 5);
    factors.push({
      factor: 'reading_level_match',
      score: readingLevelMatch,
      weight: this.scoringWeights.readingLevelMatch,
      contribution: readingLevelMatch * this.scoringWeights.readingLevelMatch,
    });

    // Topic interest
    let topicInterest = 0.3;
    for (const tag of content.metadata.tags) {
      const interest = preferences.topicInterests.get(tag) ?? 0;
      topicInterest = Math.max(topicInterest, interest);
    }
    factors.push({
      factor: 'topic_interest',
      score: topicInterest,
      weight: this.scoringWeights.topicInterest,
      contribution: topicInterest * this.scoringWeights.topicInterest,
    });

    // Novelty (not in favorites, recently viewed less)
    const noveltyScore = preferences.favorites.includes(content.id) ? 0.5 : 1.0;
    factors.push({
      factor: 'novelty',
      score: noveltyScore,
      weight: this.scoringWeights.novelty,
      contribution: noveltyScore * this.scoringWeights.novelty,
    });

    // Embedding similarity
    const contentEmbedding = this.contentEmbeddings.get(content.id);
    let embeddingSimilarity = 0.5;
    if (contentEmbedding && userEmbedding.embedding) {
      embeddingSimilarity = this.cosineSimilarity(contentEmbedding, userEmbedding.embedding);
    }
    factors.push({
      factor: 'embedding_similarity',
      score: embeddingSimilarity,
      weight: this.scoringWeights.embeddingSimilarity,
      contribution: embeddingSimilarity * this.scoringWeights.embeddingSimilarity,
    });

    // Calculate total score
    const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);

    // Apply context boost
    let contextMultiplier = 1.0;
    if (context) {
      if (context.userMood && this.matchesMood(content.metadata.emotionalTone, context.userMood)) {
        contextMultiplier *= 1.2;
      }
      if (context.timeOfDay) {
        const timeMatch = this.matchesTimeOfDay(content, context.timeOfDay);
        contextMultiplier *= timeMatch;
      }
    }

    return {
      score: Math.min(1, totalScore * contextMultiplier),
      factors,
    };
  }

  private scoreDifficultyMatch(
    contentDifficulty: string,
    userDifficulty: string
  ): number {
    const levels = { beginner: 1, intermediate: 2, advanced: 3 };
    const contentLevel = levels[contentDifficulty as keyof typeof levels] ?? 2;
    const userLevel = levels[userDifficulty as keyof typeof levels] ?? 2;
    const diff = Math.abs(contentLevel - userLevel);
    return diff === 0 ? 1.0 : diff === 1 ? 0.6 : 0.3;
  }

  private matchesMood(tone: EmotionalTone, mood: string): boolean {
    const moodToTone: Record<string, EmotionalTone[]> = {
      happy: ['celebratory', 'energizing'],
      stressed: ['calming', 'supportive'],
      unmotivated: ['motivational', 'energizing'],
      reflective: ['reflective', 'educational'],
      neutral: ['educational', 'motivational'],
    };
    return moodToTone[mood]?.includes(tone) ?? false;
  }

  private matchesTimeOfDay(content: Content, hour: number): number {
    // Morning (6-12): energizing, educational
    // Afternoon (12-18): educational, interactive
    // Evening (18-22): calming, reflective
    // Night (22-6): calming, short

    const tone = content.metadata.emotionalTone;
    const length = content.metadata.contentLength;

    if (hour >= 6 && hour < 12) {
      if (['energizing', 'motivational'].includes(tone)) return 1.2;
    } else if (hour >= 12 && hour < 18) {
      if (content.metadata.interactivity === 'interactive') return 1.1;
    } else if (hour >= 18 && hour < 22) {
      if (['calming', 'reflective'].includes(tone)) return 1.2;
    } else {
      if (length === 'short' && ['calming'].includes(tone)) return 1.3;
    }

    return 1.0;
  }

  private async generateAdaptations(
    content: Content,
    preferences: UserContentPreferences,
    context?: ContentContext,
    level: 'light' | 'moderate' | 'full' = 'moderate'
  ): Promise<ContentAdaptation[]> {
    const adaptations: ContentAdaptation[] = [];

    // Tone adjustment
    if (level !== 'light') {
      const preferredTone = preferences.preferredTones[0];
      if (preferredTone && preferredTone !== content.metadata.emotionalTone) {
        adaptations.push({
          type: 'tone_shift',
          original: content.metadata.emotionalTone,
          adapted: preferredTone,
          reason: `Adjusted tone to match user preference for ${preferredTone} content`,
        });
      }
    }

    // Length adjustment
    if (content.metadata.contentLength !== preferences.preferredLength) {
      adaptations.push({
        type: 'length_adjustment',
        original: content.metadata.contentLength,
        adapted: preferences.preferredLength,
        reason: `Content length adjusted to user's preference for ${preferences.preferredLength} content`,
      });
    }

    // Complexity change
    if (level === 'full') {
      const readingDiff = content.metadata.readingLevel - preferences.optimalReadingLevel;
      if (Math.abs(readingDiff) > 2) {
        adaptations.push({
          type: 'complexity_change',
          original: `Reading level ${content.metadata.readingLevel}`,
          adapted: `Reading level ${preferences.optimalReadingLevel}`,
          reason: 'Adjusted complexity to match user reading level',
        });
      }
    }

    // Context-based additions
    if (context?.userGoal) {
      adaptations.push({
        type: 'context_addition',
        original: '',
        adapted: `This relates to your goal: "${context.userGoal}"`,
        reason: 'Added personalized context linking to user goal',
      });
    }

    return adaptations;
  }

  private generateExplanations(
    factors: RelevanceFactor[],
    preferences: UserContentPreferences
  ): string[] {
    const explanations: string[] = [];

    // Sort factors by contribution
    const topFactors = [...factors]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);

    for (const factor of topFactors) {
      switch (factor.factor) {
        case 'type_match':
          explanations.push('Matches your preferred content type');
          break;
        case 'category_match':
          explanations.push('In a category you enjoy');
          break;
        case 'tone_match':
          explanations.push('Has the emotional tone you prefer');
          break;
        case 'topic_interest':
          explanations.push('Covers topics you\'re interested in');
          break;
        case 'embedding_similarity':
          explanations.push('Similar to content you\'ve engaged with');
          break;
      }
    }

    return explanations;
  }

  private calculateConfidence(factors: RelevanceFactor[]): number {
    // Higher confidence when multiple factors score well
    const highScoreCount = factors.filter(f => f.score > 0.7).length;
    return Math.min(0.95, 0.5 + highScoreCount * 0.05);
  }

  private calculateReward(feedback: ContentFeedback): number {
    switch (feedback.action) {
      case 'completed':
        return 1.0;
      case 'saved':
        return 0.9;
      case 'shared':
        return 0.95;
      case 'rated':
        return feedback.rating ? feedback.rating / 5 : 0.6;
      case 'viewed':
        return 0.4;
      case 'dismissed':
        return 0.0;
      default:
        return 0.3;
    }
  }

  private buildBanditContext(
    preferences: UserContentPreferences,
    context?: ContentContext
  ): Context {
    return {
      userId: preferences.userId,
      features: {
        engagement_score: preferences.consumptionPatterns.engagementScore,
        completion_rate: preferences.consumptionPatterns.completionRate,
        preferred_length: preferences.preferredLength,
        hour_of_day: context?.timeOfDay ?? new Date().getHours(),
        user_mood: context?.userMood ?? 'neutral',
      },
    };
  }

  private generateContentEmbedding(content: Content): number[] {
    // Simplified content embedding based on metadata
    const embedding = new Array(64).fill(0);

    // Encode content type
    const typeIndex = ['article', 'tip', 'exercise', 'meditation', 'video', 'quote', 'challenge', 'lesson', 'reflection_prompt']
      .indexOf(content.type);
    if (typeIndex >= 0 && typeIndex < 16) {
      embedding[typeIndex] = 1;
    }

    // Encode emotional tone
    const toneIndex = ['motivational', 'calming', 'energizing', 'reflective', 'educational', 'celebratory', 'supportive']
      .indexOf(content.metadata.emotionalTone);
    if (toneIndex >= 0) {
      embedding[16 + toneIndex] = 1;
    }

    // Encode difficulty
    embedding[24] = content.metadata.difficulty === 'beginner' ? 0.33 :
                   content.metadata.difficulty === 'intermediate' ? 0.66 : 1.0;

    // Encode reading level
    embedding[25] = content.metadata.readingLevel / 10;

    // Hash tags into embedding dimensions
    for (const tag of content.metadata.tags) {
      const hash = this.hashString(tag);
      const dim = 32 + (hash % 32);
      embedding[dim] = Math.min(1, embedding[dim] + 0.5);
    }

    return embedding;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ==================== Content Context ====================

export interface ContentContext {
  userMood?: string;
  userGoal?: string;
  timeOfDay?: number;
  dayOfWeek?: number;
  sessionType?: string;
  requiredType?: ContentType;
  requiredCategory?: string;
  excludeIds?: string[];
}

// ==================== Factory ====================

export function createContentPersonalizer(): ContentPersonalizer {
  return new ContentPersonalizer();
}

export default ContentPersonalizer;
