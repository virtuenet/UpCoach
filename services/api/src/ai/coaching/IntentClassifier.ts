// Intent Classifier - Classify user intent for intelligent routing (~400 LOC)

export enum Intent {
  GOAL_SETTING = 'goal_setting',
  PROGRESS_TRACKING = 'progress_tracking',
  MOTIVATION = 'motivation',
  ACCOUNTABILITY = 'accountability',
  PROBLEM_SOLVING = 'problem_solving',
  EMOTIONAL_SUPPORT = 'emotional_support',
  SKILL_DEVELOPMENT = 'skill_development',
  RESOURCE_RECOMMENDATION = 'resource_recommendation',
  SCHEDULE_MANAGEMENT = 'schedule_management',
  REFLECTION = 'reflection',
  CELEBRATION = 'celebration',
  QUESTION = 'question',
  FEEDBACK = 'feedback',
  OTHER = 'other',
}

export enum Sentiment {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  MIXED = 'mixed',
}

export enum Urgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

interface IntentResult {
  primaryIntent: Intent;
  confidence: number;
  secondaryIntents: Array<{ intent: Intent; confidence: number }>;
  sentiment: Sentiment;
  urgency: Urgency;
  entities: Array<{ type: string; value: string }>;
}

export class IntentClassifier {
  private intentPatterns: Map<Intent, string[]> = new Map([
    [
      Intent.GOAL_SETTING,
      [
        'want to',
        'goal',
        'achieve',
        'plan to',
        'aspire',
        'aim to',
        'working towards',
      ],
    ],
    [
      Intent.PROGRESS_TRACKING,
      ['progress', 'update', 'completed', 'did', 'finished', 'check-in'],
    ],
    [
      Intent.MOTIVATION,
      [
        'motivate',
        'inspired',
        'encourage',
        'keep going',
        'give up',
        'lose motivation',
      ],
    ],
    [
      Intent.ACCOUNTABILITY,
      ['accountable', 'commit', 'promise', 'will do', 'going to', 'deadline'],
    ],
    [
      Intent.PROBLEM_SOLVING,
      [
        'problem',
        'issue',
        'stuck',
        'challenge',
        'obstacle',
        'difficult',
        'how do i',
      ],
    ],
    [
      Intent.EMOTIONAL_SUPPORT,
      [
        'feeling',
        'emotional',
        'stressed',
        'anxious',
        'overwhelmed',
        'worried',
        'sad',
      ],
    ],
    [
      Intent.SKILL_DEVELOPMENT,
      ['learn', 'skill', 'improve', 'practice', 'get better at', 'develop'],
    ],
    [
      Intent.RESOURCE_RECOMMENDATION,
      ['recommend', 'suggest', 'resource', 'book', 'course', 'tool', 'app'],
    ],
    [
      Intent.SCHEDULE_MANAGEMENT,
      ['schedule', 'time', 'when', 'calendar', 'remind', 'plan'],
    ],
    [
      Intent.REFLECTION,
      ['reflect', 'learned', 'realize', 'understand', 'insight', 'noticed'],
    ],
    [
      Intent.CELEBRATION,
      ['celebrate', 'achieved', 'success', 'proud', 'accomplished', 'won'],
    ],
    [Intent.QUESTION, ['what', 'why', 'how', 'when', 'where', 'who', '?']],
    [Intent.FEEDBACK, ['feedback', 'suggestion', 'improve', 'better', 'change']],
  ]);

  async classifyIntent(message: string): Promise<IntentResult> {
    console.log(`[IntentClassifier] Classifying: "${message}"`);

    const lowerMessage = message.toLowerCase();

    // Calculate scores for each intent
    const scores = new Map<Intent, number>();

    this.intentPatterns.forEach((patterns, intent) => {
      let score = 0;
      patterns.forEach((pattern) => {
        if (lowerMessage.includes(pattern.toLowerCase())) {
          score += 1;
        }
      });
      scores.set(intent, score);
    });

    // Get primary intent
    const sortedIntents = Array.from(scores.entries())
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    const primaryIntent =
      sortedIntents.length > 0 ? sortedIntents[0][0] : Intent.OTHER;
    const maxScore = Math.max(...Array.from(scores.values()));
    const confidence = maxScore > 0 ? maxScore / 3 : 0.3; // Normalize

    // Get secondary intents
    const secondaryIntents = sortedIntents
      .slice(1, 3)
      .map(([intent, score]) => ({
        intent,
        confidence: score / 3,
      }));

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(message);

    // Detect urgency
    const urgency = this.detectUrgency(message);

    // Extract entities
    const entities = this.extractEntities(message);

    return {
      primaryIntent,
      confidence: Math.min(confidence, 1),
      secondaryIntents,
      sentiment,
      urgency,
      entities,
    };
  }

  private analyzeSentiment(message: string): Sentiment {
    const lowerMessage = message.toLowerCase();

    const positiveWords = [
      'great',
      'excellent',
      'amazing',
      'wonderful',
      'happy',
      'excited',
      'love',
      'fantastic',
      'awesome',
      'success',
      'achieved',
      'proud',
    ];

    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'hate',
      'sad',
      'frustrated',
      'angry',
      'disappointed',
      'failed',
      'struggle',
      'difficult',
      'hard',
      'problem',
      'issue',
    ];

    const positiveCount = positiveWords.filter((w) =>
      lowerMessage.includes(w)
    ).length;
    const negativeCount = negativeWords.filter((w) =>
      lowerMessage.includes(w)
    ).length;

    if (positiveCount > 0 && negativeCount > 0) return Sentiment.MIXED;
    if (positiveCount > negativeCount) return Sentiment.POSITIVE;
    if (negativeCount > positiveCount) return Sentiment.NEGATIVE;
    return Sentiment.NEUTRAL;
  }

  private detectUrgency(message: string): Urgency {
    const lowerMessage = message.toLowerCase();

    const urgentKeywords = [
      'urgent',
      'asap',
      'immediately',
      'emergency',
      'crisis',
      'help',
      'now',
      'critical',
      'important',
    ];

    const mediumKeywords = ['soon', 'quickly', 'this week', 'deadline'];

    const hasUrgent = urgentKeywords.some((kw) => lowerMessage.includes(kw));
    const hasMedium = mediumKeywords.some((kw) => lowerMessage.includes(kw));

    if (hasUrgent) return Urgency.HIGH;
    if (hasMedium) return Urgency.MEDIUM;
    return Urgency.LOW;
  }

  private extractEntities(
    message: string
  ): Array<{ type: string; value: string }> {
    const entities: Array<{ type: string; value: string }> = [];

    // Extract numbers (potential metrics)
    const numberPattern = /\b\d+(\.\d+)?\b/g;
    const numbers = message.match(numberPattern) || [];
    numbers.forEach((num) => {
      entities.push({ type: 'NUMBER', value: num });
    });

    // Extract time expressions
    const timePattern =
      /\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|last week)\b/gi;
    const times = message.match(timePattern) || [];
    times.forEach((time) => {
      entities.push({ type: 'TIME', value: time.toLowerCase() });
    });

    // Extract durations
    const durationPattern = /\b\d+\s*(day|week|month|year|hour|minute)s?\b/gi;
    const durations = message.match(durationPattern) || [];
    durations.forEach((duration) => {
      entities.push({ type: 'DURATION', value: duration.toLowerCase() });
    });

    return entities;
  }

  async batchClassify(messages: string[]): Promise<IntentResult[]> {
    return Promise.all(messages.map((m) => this.classifyIntent(m)));
  }

  async getIntentStats(results: IntentResult[]): Promise<{
    intentDistribution: Map<Intent, number>;
    averageConfidence: number;
    sentimentDistribution: Map<Sentiment, number>;
    urgencyDistribution: Map<Urgency, number>;
  }> {
    const intentDistribution = new Map<Intent, number>();
    const sentimentDistribution = new Map<Sentiment, number>();
    const urgencyDistribution = new Map<Urgency, number>();
    let totalConfidence = 0;

    results.forEach((result) => {
      // Intent distribution
      intentDistribution.set(
        result.primaryIntent,
        (intentDistribution.get(result.primaryIntent) || 0) + 1
      );

      // Sentiment distribution
      sentimentDistribution.set(
        result.sentiment,
        (sentimentDistribution.get(result.sentiment) || 0) + 1
      );

      // Urgency distribution
      urgencyDistribution.set(
        result.urgency,
        (urgencyDistribution.get(result.urgency) || 0) + 1
      );

      totalConfidence += result.confidence;
    });

    return {
      intentDistribution,
      averageConfidence: totalConfidence / results.length,
      sentimentDistribution,
      urgencyDistribution,
    };
  }
}

export const intentClassifier = new IntentClassifier();
