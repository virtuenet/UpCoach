/**
 * Coaching Style Adapter
 * Dynamically adapts coaching approach based on user preferences and context
 */

import { DeepUserEmbeddingService, UserEmbedding } from './DeepUserEmbedding';
import { ContextualBandit, Context } from './ContextualBandit';

// ==================== Types ====================

export type CoachingStyle =
  | 'motivator'      // High energy, celebration-focused
  | 'analytical'     // Data-driven, logical
  | 'supportive'     // Empathetic, nurturing
  | 'challenger'     // Push boundaries, direct feedback
  | 'mentor'         // Wisdom-sharing, experience-based
  | 'collaborative'; // Partnership, co-creation

export interface StyleProfile {
  style: CoachingStyle;
  traits: StyleTrait[];
  communicationPatterns: CommunicationPattern[];
  responseTemplates: Map<MessageType, string[]>;
  toneDescriptors: string[];
  energyLevel: 'low' | 'medium' | 'high';
}

export interface StyleTrait {
  trait: string;
  intensity: number; // 0-1
  examples: string[];
}

export interface CommunicationPattern {
  pattern: string;
  frequency: 'always' | 'often' | 'sometimes' | 'rarely';
  examples: string[];
}

export type MessageType =
  | 'greeting'
  | 'encouragement'
  | 'feedback_positive'
  | 'feedback_constructive'
  | 'reminder'
  | 'celebration'
  | 'challenge'
  | 'reflection'
  | 'goal_setting'
  | 'habit_prompt'
  | 'check_in';

export interface UserStylePreference {
  userId: string;
  primaryStyle: CoachingStyle;
  secondaryStyle?: CoachingStyle;
  styleWeights: Map<CoachingStyle, number>;
  dislikedStyles: CoachingStyle[];
  feedbackPreference: 'direct' | 'gentle' | 'balanced';
  motivationStyle: 'extrinsic' | 'intrinsic' | 'mixed';
  accountabilityLevel: 'light' | 'moderate' | 'strict';
  communicationFrequency: 'minimal' | 'regular' | 'frequent';
  adaptationHistory: StyleAdaptation[];
}

export interface StyleAdaptation {
  fromStyle: CoachingStyle;
  toStyle: CoachingStyle;
  timestamp: Date;
  reason: string;
  effectiveness: number;
}

export interface AdaptedMessage {
  originalMessage: string;
  adaptedMessage: string;
  style: CoachingStyle;
  adaptations: MessageAdaptation[];
  confidence: number;
}

export interface MessageAdaptation {
  type: 'tone' | 'structure' | 'vocabulary' | 'length' | 'emoji' | 'emphasis';
  before: string;
  after: string;
  reason: string;
}

export interface CoachingContext {
  currentMood?: string;
  recentProgress?: 'improving' | 'stable' | 'declining';
  timeOfDay?: number;
  daysSinceLastInteraction?: number;
  currentStreak?: number;
  recentCompletionRate?: number;
  upcomingDeadlines?: number;
  stressLevel?: 'low' | 'medium' | 'high';
}

// ==================== Style Profiles ====================

const STYLE_PROFILES: Map<CoachingStyle, StyleProfile> = new Map([
  ['motivator', {
    style: 'motivator',
    traits: [
      { trait: 'enthusiasm', intensity: 0.9, examples: ['You\'re crushing it!', 'Incredible progress!'] },
      { trait: 'celebration', intensity: 0.85, examples: ['Time to celebrate!', '🎉 What an achievement!'] },
      { trait: 'energy', intensity: 0.9, examples: ['Let\'s go!', 'Keep that momentum!'] },
    ],
    communicationPatterns: [
      { pattern: 'exclamation_marks', frequency: 'often', examples: ['Amazing!', 'You did it!'] },
      { pattern: 'positive_affirmations', frequency: 'always', examples: ['You\'ve got this!', 'I believe in you!'] },
      { pattern: 'emoji_usage', frequency: 'often', examples: ['🔥', '💪', '🌟'] },
    ],
    responseTemplates: new Map([
      ['greeting', ['Hey champion! Ready to make today amazing?', 'Welcome back, superstar! 🌟']],
      ['encouragement', ['You\'re doing incredible! Keep pushing!', 'That\'s the spirit! Nothing can stop you!']],
      ['celebration', ['🎉 AMAZING! You absolutely crushed that!', 'What a win! You should be SO proud!']],
    ]),
    toneDescriptors: ['enthusiastic', 'energetic', 'uplifting', 'celebratory'],
    energyLevel: 'high',
  }],

  ['analytical', {
    style: 'analytical',
    traits: [
      { trait: 'data-focused', intensity: 0.9, examples: ['Your completion rate increased by 15%', 'Based on your patterns...'] },
      { trait: 'logical', intensity: 0.85, examples: ['Here\'s what the data shows', 'Let\'s analyze this together'] },
      { trait: 'precise', intensity: 0.8, examples: ['Specifically, you completed 4 out of 5 habits', 'Your streak is at 12 days'] },
    ],
    communicationPatterns: [
      { pattern: 'statistics', frequency: 'often', examples: ['Your success rate: 85%', '3 out of 4 goals completed'] },
      { pattern: 'comparisons', frequency: 'often', examples: ['Compared to last week...', 'Your trend shows...'] },
      { pattern: 'structured_lists', frequency: 'always', examples: ['1. First...', 'Key observations:'] },
    ],
    responseTemplates: new Map([
      ['greeting', ['Good to see you. Let\'s review your progress.', 'Welcome back. Here\'s your current status.']],
      ['encouragement', ['The data shows steady improvement. Continue this approach.', 'Your consistency is measurable and improving.']],
      ['feedback_positive', ['Analysis shows: 15% improvement in completion rate. Well done.', 'Your metrics indicate strong progress.']],
    ]),
    toneDescriptors: ['logical', 'precise', 'data-driven', 'objective'],
    energyLevel: 'medium',
  }],

  ['supportive', {
    style: 'supportive',
    traits: [
      { trait: 'empathy', intensity: 0.95, examples: ['I understand how you feel', 'That sounds challenging'] },
      { trait: 'nurturing', intensity: 0.9, examples: ['Take your time', 'Every small step matters'] },
      { trait: 'patience', intensity: 0.85, examples: ['There\'s no rush', 'Progress isn\'t always linear'] },
    ],
    communicationPatterns: [
      { pattern: 'validation', frequency: 'always', examples: ['Your feelings are valid', 'It\'s okay to feel this way'] },
      { pattern: 'gentle_encouragement', frequency: 'always', examples: ['You\'re doing great', 'I\'m here for you'] },
      { pattern: 'soft_reminders', frequency: 'often', examples: ['When you\'re ready...', 'If you\'d like...'] },
    ],
    responseTemplates: new Map([
      ['greeting', ['Hi there! How are you feeling today?', 'Welcome back. I hope you\'re being kind to yourself.']],
      ['encouragement', ['You\'re making progress, even when it doesn\'t feel like it.', 'Remember, every step forward counts.']],
      ['feedback_constructive', ['I noticed you missed a few habits. That\'s perfectly okay - would you like to talk about what got in the way?']],
    ]),
    toneDescriptors: ['warm', 'understanding', 'patient', 'nurturing'],
    energyLevel: 'low',
  }],

  ['challenger', {
    style: 'challenger',
    traits: [
      { trait: 'direct', intensity: 0.9, examples: ['Let\'s be honest here', 'The truth is...'] },
      { trait: 'pushing_limits', intensity: 0.85, examples: ['You can do better', 'Raise the bar'] },
      { trait: 'accountability', intensity: 0.9, examples: ['You committed to this', 'No excuses'] },
    ],
    communicationPatterns: [
      { pattern: 'direct_feedback', frequency: 'always', examples: ['Here\'s the reality...', 'Straight talk:'] },
      { pattern: 'challenges', frequency: 'often', examples: ['I challenge you to...', 'Let\'s push harder'] },
      { pattern: 'high_expectations', frequency: 'always', examples: ['I know you can do more', 'Don\'t settle'] },
    ],
    responseTemplates: new Map([
      ['greeting', ['Ready to push yourself today?', 'Let\'s make today count.']],
      ['encouragement', ['Good start. Now let\'s go further.', 'You\'re capable of more. Show me.']],
      ['feedback_constructive', ['You missed your targets. What happened, and what\'s your plan to fix it?']],
    ]),
    toneDescriptors: ['direct', 'challenging', 'honest', 'demanding'],
    energyLevel: 'high',
  }],

  ['mentor', {
    style: 'mentor',
    traits: [
      { trait: 'wisdom', intensity: 0.9, examples: ['In my experience...', 'Here\'s what I\'ve learned'] },
      { trait: 'guidance', intensity: 0.85, examples: ['Consider this approach', 'Let me share a perspective'] },
      { trait: 'storytelling', intensity: 0.8, examples: ['This reminds me of...', 'There\'s a lesson here'] },
    ],
    communicationPatterns: [
      { pattern: 'advice_giving', frequency: 'often', examples: ['My suggestion would be...', 'Consider this...'] },
      { pattern: 'experience_sharing', frequency: 'often', examples: ['I\'ve seen this pattern before', 'What often works is...'] },
      { pattern: 'questioning', frequency: 'always', examples: ['What do you think?', 'Have you considered...'] },
    ],
    responseTemplates: new Map([
      ['greeting', ['Good to connect again. What\'s on your mind today?', 'Welcome. Let\'s reflect on your journey.']],
      ['encouragement', ['You\'re on the right path. Trust the process.', 'Growth takes time. You\'re building something meaningful.']],
      ['reflection', ['Looking at your progress, what patterns do you notice?', 'What lessons have emerged for you this week?']],
    ]),
    toneDescriptors: ['wise', 'thoughtful', 'experienced', 'guiding'],
    energyLevel: 'medium',
  }],

  ['collaborative', {
    style: 'collaborative',
    traits: [
      { trait: 'partnership', intensity: 0.9, examples: ['Let\'s figure this out together', 'We\'re in this together'] },
      { trait: 'co-creation', intensity: 0.85, examples: ['What ideas do you have?', 'Let\'s brainstorm'] },
      { trait: 'equality', intensity: 0.8, examples: ['Your input matters', 'I value your perspective'] },
    ],
    communicationPatterns: [
      { pattern: 'inclusive_language', frequency: 'always', examples: ['We can...', 'Let\'s...', 'Together we...'] },
      { pattern: 'asking_input', frequency: 'always', examples: ['What do you think?', 'How would you approach this?'] },
      { pattern: 'joint_planning', frequency: 'often', examples: ['Let\'s create a plan together', 'How should we tackle this?'] },
    ],
    responseTemplates: new Map([
      ['greeting', ['Hey! Ready to work on this together?', 'Good to see you! What should we focus on today?']],
      ['goal_setting', ['Let\'s set some goals together. What feels right for you?', 'What do you think would be a good target?']],
      ['challenge', ['I have an idea - what if we tried this approach? What do you think?']],
    ]),
    toneDescriptors: ['inclusive', 'participatory', 'equal', 'team-oriented'],
    energyLevel: 'medium',
  }],
]);

// ==================== Coaching Style Adapter ====================

export class CoachingStyleAdapter {
  private embeddingService: DeepUserEmbeddingService;
  private styleBandit: ContextualBandit;
  private userPreferences: Map<string, UserStylePreference> = new Map();

  constructor() {
    this.embeddingService = new DeepUserEmbeddingService();
    this.styleBandit = new ContextualBandit({
      algorithm: 'thompson_sampling',
      explorationRate: 0.1,
    });

    // Register styles as bandit arms
    for (const style of STYLE_PROFILES.keys()) {
      this.styleBandit.registerArm({ id: style, metadata: { type: 'coaching_style' } });
    }
  }

  // ==================== Core Methods ====================

  /**
   * Get optimal coaching style for user
   */
  async getOptimalStyle(
    userId: string,
    context?: CoachingContext
  ): Promise<{ style: CoachingStyle; confidence: number; reasoning: string[] }> {
    const userPref = await this.getUserPreference(userId);
    const userEmbedding = await this.embeddingService.generateEmbedding(userId);

    // Build context for bandit
    const banditContext = this.buildBanditContext(userPref, context);

    // Get bandit recommendation
    const decision = this.styleBandit.selectArm(banditContext);

    // Blend with user preferences
    const styleScores = this.calculateStyleScores(userPref, context, userEmbedding);

    // Combine bandit selection with preference scores
    const selectedStyle = decision.selectedArmId as CoachingStyle;
    const confidence = Math.min(
      0.95,
      (styleScores.get(selectedStyle) ?? 0.5) * 0.6 + decision.confidence * 0.4
    );

    const reasoning = this.generateStyleReasoning(selectedStyle, userPref, context);

    return { style: selectedStyle, confidence, reasoning };
  }

  /**
   * Adapt a message to the user's preferred coaching style
   */
  async adaptMessage(
    message: string,
    messageType: MessageType,
    userId: string,
    context?: CoachingContext
  ): Promise<AdaptedMessage> {
    const { style, confidence } = await this.getOptimalStyle(userId, context);
    const profile = STYLE_PROFILES.get(style)!;

    const adaptations: MessageAdaptation[] = [];
    let adaptedMessage = message;

    // Apply tone adaptations
    adaptedMessage = this.applyToneAdaptation(adaptedMessage, profile, adaptations);

    // Apply vocabulary adaptations
    adaptedMessage = this.applyVocabularyAdaptation(adaptedMessage, profile, adaptations);

    // Apply structure adaptations
    adaptedMessage = this.applyStructureAdaptation(adaptedMessage, profile, messageType, adaptations);

    // Apply energy level adaptations
    adaptedMessage = this.applyEnergyAdaptation(adaptedMessage, profile, adaptations);

    // Apply emoji adaptations
    adaptedMessage = this.applyEmojiAdaptation(adaptedMessage, profile, adaptations);

    return {
      originalMessage: message,
      adaptedMessage,
      style,
      adaptations,
      confidence,
    };
  }

  /**
   * Generate a message in the user's preferred style
   */
  async generateStyledMessage(
    messageType: MessageType,
    userId: string,
    context?: CoachingContext,
    customData?: Record<string, string>
  ): Promise<string> {
    const { style } = await this.getOptimalStyle(userId, context);
    const profile = STYLE_PROFILES.get(style)!;

    // Get templates for message type
    const templates = profile.responseTemplates.get(messageType) ?? [];

    if (templates.length === 0) {
      return this.generateFallbackMessage(messageType, profile);
    }

    // Select random template
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Apply custom data substitutions
    let message = template;
    if (customData) {
      for (const [key, value] of Object.entries(customData)) {
        message = message.replace(`{${key}}`, value);
      }
    }

    return message;
  }

  /**
   * Record style feedback
   */
  async recordStyleFeedback(
    userId: string,
    style: CoachingStyle,
    effectiveness: number // 0-1
  ): Promise<void> {
    const userPref = await this.getUserPreference(userId);

    // Update style weights
    const currentWeight = userPref.styleWeights.get(style) ?? 0.5;
    const newWeight = currentWeight * 0.8 + effectiveness * 0.2;
    userPref.styleWeights.set(style, newWeight);

    // Report to bandit
    this.styleBandit.reportReward({
      armId: style,
      reward: effectiveness,
      context: this.buildBanditContext(userPref),
    });

    // Record adaptation
    if (userPref.primaryStyle !== style && effectiveness > 0.7) {
      userPref.adaptationHistory.push({
        fromStyle: userPref.primaryStyle,
        toStyle: style,
        timestamp: new Date(),
        reason: 'High effectiveness feedback',
        effectiveness,
      });

      // Update primary style if consistently better
      const recentAdaptations = userPref.adaptationHistory
        .filter(a => a.toStyle === style)
        .slice(-5);

      if (recentAdaptations.length >= 3) {
        const avgEffectiveness =
          recentAdaptations.reduce((sum, a) => sum + a.effectiveness, 0) /
          recentAdaptations.length;

        if (avgEffectiveness > 0.75) {
          userPref.secondaryStyle = userPref.primaryStyle;
          userPref.primaryStyle = style;
        }
      }
    }

    this.userPreferences.set(userId, userPref);
  }

  /**
   * Get style profile
   */
  getStyleProfile(style: CoachingStyle): StyleProfile | undefined {
    return STYLE_PROFILES.get(style);
  }

  /**
   * Get all available styles
   */
  getAllStyles(): CoachingStyle[] {
    return Array.from(STYLE_PROFILES.keys());
  }

  // ==================== Private Methods ====================

  private async getUserPreference(userId: string): Promise<UserStylePreference> {
    let pref = this.userPreferences.get(userId);

    if (!pref) {
      // Create default preference
      pref = {
        userId,
        primaryStyle: 'supportive',
        secondaryStyle: 'motivator',
        styleWeights: new Map([
          ['motivator', 0.5],
          ['analytical', 0.5],
          ['supportive', 0.6],
          ['challenger', 0.4],
          ['mentor', 0.5],
          ['collaborative', 0.55],
        ]),
        dislikedStyles: [],
        feedbackPreference: 'balanced',
        motivationStyle: 'mixed',
        accountabilityLevel: 'moderate',
        communicationFrequency: 'regular',
        adaptationHistory: [],
      };
      this.userPreferences.set(userId, pref);
    }

    return pref;
  }

  private buildBanditContext(
    userPref: UserStylePreference,
    context?: CoachingContext
  ): Context {
    return {
      userId: userPref.userId,
      features: {
        feedback_preference: userPref.feedbackPreference,
        motivation_style: userPref.motivationStyle,
        accountability_level: userPref.accountabilityLevel,
        current_mood: context?.currentMood ?? 'neutral',
        recent_progress: context?.recentProgress ?? 'stable',
        stress_level: context?.stressLevel ?? 'medium',
        hour_of_day: context?.timeOfDay ?? new Date().getHours(),
        days_since_interaction: context?.daysSinceLastInteraction ?? 1,
      },
    };
  }

  private calculateStyleScores(
    userPref: UserStylePreference,
    context: CoachingContext | undefined,
    userEmbedding: UserEmbedding
  ): Map<CoachingStyle, number> {
    const scores = new Map<CoachingStyle, number>();

    for (const [style, profile] of STYLE_PROFILES) {
      let score = userPref.styleWeights.get(style) ?? 0.5;

      // Boost for primary/secondary style
      if (style === userPref.primaryStyle) score *= 1.3;
      if (style === userPref.secondaryStyle) score *= 1.1;

      // Penalty for disliked styles
      if (userPref.dislikedStyles.includes(style)) score *= 0.2;

      // Context adjustments
      if (context) {
        score *= this.getContextMultiplier(style, context);
      }

      scores.set(style, Math.min(1, score));
    }

    return scores;
  }

  private getContextMultiplier(style: CoachingStyle, context: CoachingContext): number {
    let multiplier = 1.0;

    // Adjust based on mood
    if (context.currentMood === 'stressed' || context.stressLevel === 'high') {
      if (style === 'supportive') multiplier *= 1.4;
      if (style === 'challenger') multiplier *= 0.6;
    }

    // Adjust based on progress
    if (context.recentProgress === 'declining') {
      if (style === 'supportive') multiplier *= 1.2;
      if (style === 'motivator') multiplier *= 1.1;
    } else if (context.recentProgress === 'improving') {
      if (style === 'challenger') multiplier *= 1.2;
      if (style === 'analytical') multiplier *= 1.1;
    }

    // Adjust based on streak
    if (context.currentStreak && context.currentStreak > 7) {
      if (style === 'motivator') multiplier *= 1.2;
    }

    // Adjust based on time since interaction
    if (context.daysSinceLastInteraction && context.daysSinceLastInteraction > 3) {
      if (style === 'supportive') multiplier *= 1.1;
    }

    return multiplier;
  }

  private generateStyleReasoning(
    style: CoachingStyle,
    userPref: UserStylePreference,
    context?: CoachingContext
  ): string[] {
    const reasons: string[] = [];

    if (style === userPref.primaryStyle) {
      reasons.push('Matches your preferred coaching style');
    }

    if (context?.currentMood === 'stressed' && style === 'supportive') {
      reasons.push('Supportive approach recommended during stressful periods');
    }

    if (context?.recentProgress === 'improving' && style === 'challenger') {
      reasons.push('Your progress suggests you\'re ready for more challenge');
    }

    const profile = STYLE_PROFILES.get(style)!;
    reasons.push(`${style.charAt(0).toUpperCase() + style.slice(1)} style: ${profile.toneDescriptors.slice(0, 2).join(', ')}`);

    return reasons;
  }

  private applyToneAdaptation(
    message: string,
    profile: StyleProfile,
    adaptations: MessageAdaptation[]
  ): string {
    let adapted = message;

    // Motivator: Add enthusiasm
    if (profile.style === 'motivator') {
      if (!adapted.includes('!')) {
        adapted = adapted.replace(/\.$/, '!');
        adaptations.push({
          type: 'tone',
          before: '.',
          after: '!',
          reason: 'Added enthusiasm for motivator style',
        });
      }
    }

    // Supportive: Soften language
    if (profile.style === 'supportive') {
      const softeners: [RegExp, string][] = [
        [/You need to/gi, 'When you\'re ready, you might'],
        [/You should/gi, 'You might consider'],
        [/You must/gi, 'It could help to'],
      ];

      for (const [pattern, replacement] of softeners) {
        if (pattern.test(adapted)) {
          adapted = adapted.replace(pattern, replacement);
          adaptations.push({
            type: 'tone',
            before: pattern.source,
            after: replacement,
            reason: 'Softened language for supportive style',
          });
        }
      }
    }

    // Challenger: Strengthen language
    if (profile.style === 'challenger') {
      const strengtheners: [RegExp, string][] = [
        [/You might want to/gi, 'You need to'],
        [/Consider/gi, 'Do this:'],
        [/Maybe/gi, 'Here\'s the plan:'],
      ];

      for (const [pattern, replacement] of strengtheners) {
        if (pattern.test(adapted)) {
          adapted = adapted.replace(pattern, replacement);
          adaptations.push({
            type: 'tone',
            before: pattern.source,
            after: replacement,
            reason: 'Strengthened language for challenger style',
          });
        }
      }
    }

    return adapted;
  }

  private applyVocabularyAdaptation(
    message: string,
    profile: StyleProfile,
    adaptations: MessageAdaptation[]
  ): string {
    let adapted = message;

    const vocabularyMaps: Record<CoachingStyle, [RegExp, string][]> = {
      motivator: [
        [/good/gi, 'amazing'],
        [/nice/gi, 'fantastic'],
        [/progress/gi, 'incredible progress'],
      ],
      analytical: [
        [/doing well/gi, 'showing measurable improvement'],
        [/good job/gi, 'effective execution'],
      ],
      supportive: [
        [/failed/gi, 'had a challenging moment'],
        [/bad/gi, 'difficult'],
        [/wrong/gi, 'not quite there yet'],
      ],
      challenger: [
        [/trying/gi, 'doing'],
        [/hope to/gi, 'will'],
        [/maybe/gi, ''],
      ],
      mentor: [
        [/I think/gi, 'In my experience'],
        [/You could/gi, 'Consider this approach:'],
      ],
      collaborative: [
        [/You should/gi, 'What if we'],
        [/Do this/gi, 'Let\'s try this together'],
      ],
    };

    const map = vocabularyMaps[profile.style] ?? [];
    for (const [pattern, replacement] of map) {
      if (pattern.test(adapted)) {
        const before = adapted;
        adapted = adapted.replace(pattern, replacement);
        if (before !== adapted) {
          adaptations.push({
            type: 'vocabulary',
            before: pattern.source,
            after: replacement,
            reason: `Vocabulary adapted for ${profile.style} style`,
          });
        }
      }
    }

    return adapted;
  }

  private applyStructureAdaptation(
    message: string,
    profile: StyleProfile,
    messageType: MessageType,
    adaptations: MessageAdaptation[]
  ): string {
    let adapted = message;

    // Analytical: Add structure
    if (profile.style === 'analytical' && message.length > 100) {
      if (!adapted.includes('\n') && adapted.includes('. ')) {
        const sentences = adapted.split('. ');
        if (sentences.length >= 3) {
          adapted = sentences.map((s, i) => `${i + 1}. ${s}`).join('\n');
          adaptations.push({
            type: 'structure',
            before: 'paragraph',
            after: 'numbered list',
            reason: 'Added structure for analytical style',
          });
        }
      }
    }

    // Collaborative: Add questions
    if (profile.style === 'collaborative' && !adapted.includes('?')) {
      adapted += ' What do you think?';
      adaptations.push({
        type: 'structure',
        before: 'statement',
        after: 'statement + question',
        reason: 'Added collaborative question',
      });
    }

    return adapted;
  }

  private applyEnergyAdaptation(
    message: string,
    profile: StyleProfile,
    adaptations: MessageAdaptation[]
  ): string {
    let adapted = message;

    if (profile.energyLevel === 'high') {
      // Add capitalization for emphasis
      const emphasisWords = ['amazing', 'incredible', 'fantastic', 'awesome'];
      for (const word of emphasisWords) {
        const pattern = new RegExp(`\\b${word}\\b`, 'gi');
        if (pattern.test(adapted)) {
          adapted = adapted.replace(pattern, word.toUpperCase());
          adaptations.push({
            type: 'emphasis',
            before: word,
            after: word.toUpperCase(),
            reason: 'High energy emphasis',
          });
          break; // Only one emphasis per message
        }
      }
    }

    return adapted;
  }

  private applyEmojiAdaptation(
    message: string,
    profile: StyleProfile,
    adaptations: MessageAdaptation[]
  ): string {
    let adapted = message;

    const emojiUsage = profile.communicationPatterns.find(p => p.pattern === 'emoji_usage');

    if (emojiUsage?.frequency === 'often' || emojiUsage?.frequency === 'always') {
      // Add relevant emoji if none present
      if (!/[\u{1F300}-\u{1F9FF}]/u.test(adapted)) {
        const emojiMap: Record<string, string> = {
          motivator: ' 💪',
          supportive: ' 💙',
          collaborative: ' 🤝',
        };

        const emoji = emojiMap[profile.style];
        if (emoji) {
          adapted = adapted.trimEnd() + emoji;
          adaptations.push({
            type: 'emoji',
            before: '',
            after: emoji.trim(),
            reason: `Added ${profile.style} style emoji`,
          });
        }
      }
    } else if (emojiUsage?.frequency === 'rarely' || !emojiUsage) {
      // Remove emojis for analytical/mentor styles
      const originalLength = adapted.length;
      adapted = adapted.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      if (adapted.length !== originalLength) {
        adaptations.push({
          type: 'emoji',
          before: 'emoji present',
          after: 'emoji removed',
          reason: `${profile.style} style prefers minimal emoji`,
        });
      }
    }

    return adapted;
  }

  private generateFallbackMessage(messageType: MessageType, profile: StyleProfile): string {
    const fallbacks: Record<MessageType, Record<CoachingStyle, string>> = {
      greeting: {
        motivator: 'Hey there! Ready to crush it today?',
        analytical: 'Welcome back. Let\'s review your status.',
        supportive: 'Hello! How are you feeling today?',
        challenger: 'Ready to get to work?',
        mentor: 'Good to see you. What\'s on your mind?',
        collaborative: 'Hi! What should we work on together?',
      },
      encouragement: {
        motivator: 'You\'ve got this! Keep pushing!',
        analytical: 'Your progress metrics show improvement.',
        supportive: 'You\'re doing great. Keep going at your pace.',
        challenger: 'Good start. Now push harder.',
        mentor: 'You\'re on the right path. Trust the process.',
        collaborative: 'We\'re making great progress together!',
      },
      feedback_positive: {
        motivator: 'Amazing work! You\'re on fire!',
        analytical: 'Task completed successfully. Well executed.',
        supportive: 'Well done! I\'m proud of you.',
        challenger: 'Solid work. Ready for the next challenge?',
        mentor: 'Excellent execution. What did you learn?',
        collaborative: 'Great teamwork! We did it!',
      },
      feedback_constructive: {
        motivator: 'Small setback, big comeback! Let\'s go!',
        analytical: 'Here\'s what needs adjustment...',
        supportive: 'That was challenging. Let\'s find what works better.',
        challenger: 'Not good enough. Here\'s how to fix it.',
        mentor: 'There\'s a lesson here. Let\'s explore it.',
        collaborative: 'Let\'s figure out a better approach together.',
      },
      reminder: {
        motivator: 'Time to shine! Don\'t forget...',
        analytical: 'Reminder: pending task requires attention.',
        supportive: 'A gentle reminder when you\'re ready...',
        challenger: 'You committed to this. Time to deliver.',
        mentor: 'Remember what we discussed...',
        collaborative: 'Quick reminder - shall we tackle this?',
      },
      celebration: {
        motivator: '🎉 INCREDIBLE! What an achievement!',
        analytical: 'Goal achieved. Metrics updated.',
        supportive: 'What a wonderful accomplishment! ❤️',
        challenger: 'Well done. Now set a bigger goal.',
        mentor: 'A milestone worth celebrating. Reflect on this journey.',
        collaborative: 'We did it together! Celebration time!',
      },
      challenge: {
        motivator: 'Ready for something EPIC?',
        analytical: 'New objective: here are the parameters.',
        supportive: 'Here\'s something new when you\'re ready...',
        challenger: 'Your next challenge. Accept it.',
        mentor: 'I have a challenge that will help you grow.',
        collaborative: 'Want to try something challenging together?',
      },
      reflection: {
        motivator: 'Take a moment to appreciate how far you\'ve come!',
        analytical: 'Time for weekly analysis and reflection.',
        supportive: 'Let\'s pause and reflect on your journey.',
        challenger: 'What worked? What didn\'t? Be honest.',
        mentor: 'What insights have emerged for you?',
        collaborative: 'Let\'s reflect on our progress together.',
      },
      goal_setting: {
        motivator: 'Dream BIG! What\'s your next goal?',
        analytical: 'Define your next objective with measurable criteria.',
        supportive: 'What goal feels right for you right now?',
        challenger: 'Set a goal that scares you a little.',
        mentor: 'What goal aligns with your values?',
        collaborative: 'What goal should we work toward together?',
      },
      habit_prompt: {
        motivator: 'Time to build that habit! You\'ve got this!',
        analytical: 'Habit check: status required.',
        supportive: 'Whenever you\'re ready for your habit...',
        challenger: 'Habit time. No excuses.',
        mentor: 'Your habit awaits. Remember why you started.',
        collaborative: 'Ready to work on your habit together?',
      },
      check_in: {
        motivator: 'Hey superstar! How\'s everything going?',
        analytical: 'Status check: how are things progressing?',
        supportive: 'Just checking in - how are you doing?',
        challenger: 'Update me. What\'s your status?',
        mentor: 'How is your journey unfolding?',
        collaborative: 'Let\'s check in - how are we doing?',
      },
    };

    return fallbacks[messageType]?.[profile.style] ?? 'How can I help you today?';
  }
}

// ==================== Factory ====================

export function createCoachingStyleAdapter(): CoachingStyleAdapter {
  return new CoachingStyleAdapter();
}

export default CoachingStyleAdapter;
