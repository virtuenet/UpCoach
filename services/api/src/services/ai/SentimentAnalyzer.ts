import { Pool } from 'pg';
import { logger } from '../../utils/logger';

/**
 * Sentiment Analyzer (Phase 8)
 *
 * Analyzes user sentiment from:
 * - Journal entries
 * - Chat messages
 * - Notes and reflections
 *
 * Features:
 * - Sentiment classification (-1 to 1 scale)
 * - Emotion detection (7 emotions)
 * - Mood tracking over time
 * - Mental health alerts for concerning patterns
 *
 * In production: Use fine-tuned BERT model for accuracy
 */

export interface SentimentResult {
  score: number; // -1 (very negative) to 1 (very positive)
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  confidence: number;
  emotions: EmotionScores;
}

export interface EmotionScores {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  neutral: number;
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: string;
  sentimentScore: number;
  emotions: EmotionScores;
  journalEntry?: string;
  createdAt: Date;
}

export interface MoodTrend {
  period: string;
  averageSentiment: number;
  dominantEmotion: string;
  totalEntries: number;
  trend: 'improving' | 'declining' | 'stable';
}

export class SentimentAnalyzer {
  private db: Pool;
  private modelEndpoint: string;

  constructor(db: Pool, modelEndpoint?: string) {
    this.db = db;
    this.modelEndpoint = modelEndpoint || process.env.ML_MODEL_ENDPOINT || 'http://localhost:8000';
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      // Simplified rule-based analysis (use ML model in production)
      const score = this.calculateSentimentScore(text);
      const emotions = this.detectEmotions(text);

      const result: SentimentResult = {
        score,
        label: this.scoreTo Label(score),
        confidence: 0.75, // Mock confidence
        emotions,
      };

      return result;
    } catch (error) {
      logger.error('Failed to analyze sentiment', { error });
      throw error;
    }
  }

  /**
   * Log mood entry
   */
  async logMood(
    userId: string,
    mood: string,
    journalEntry?: string
  ): Promise<MoodEntry> {
    try {
      let sentimentScore = 0;
      let emotions: EmotionScores = this.getDefaultEmotions();

      if (journalEntry) {
        const analysis = await this.analyzeSentiment(journalEntry);
        sentimentScore = analysis.score;
        emotions = analysis.emotions;
      } else {
        // Map mood to sentiment score
        sentimentScore = this.moodToSentiment(mood);
        emotions = this.moodToEmotions(mood);
      }

      const query = `
        INSERT INTO mood_entries (
          id, user_id, mood, sentiment_score, emotions, journal_entry, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, NOW()
        )
        RETURNING *
      `;

      const result = await this.db.query(query, [
        userId,
        mood,
        sentimentScore,
        JSON.stringify(emotions),
        journalEntry,
      ]);

      // Check for mental health concerns
      await this.checkMentalHealthAlerts(userId, sentimentScore);

      return this.mapMoodEntry(result.rows[0]);
    } catch (error) {
      logger.error('Failed to log mood', { userId, mood, error });
      throw error;
    }
  }

  /**
   * Get mood trends for user
   */
  async getMoodTrends(
    userId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<MoodTrend[]> {
    try {
      const intervals = {
        week: 7,
        month: 30,
        year: 365,
      };

      const query = `
        WITH daily_moods AS (
          SELECT
            DATE(created_at) as date,
            AVG(sentiment_score) as avg_sentiment,
            COUNT(*) as entries
          FROM mood_entries
          WHERE user_id = $1
            AND created_at >= NOW() - INTERVAL '${intervals[period]} days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        )
        SELECT
          TO_CHAR(date, 'YYYY-MM-DD') as period,
          avg_sentiment,
          entries
        FROM daily_moods
      `;

      const result = await this.db.query(query, [userId]);

      const trends: MoodTrend[] = result.rows.map((row, index) => {
        const trend = this.calculateTrend(
          result.rows,
          index,
          'avg_sentiment'
        );

        return {
          period: row.period,
          averageSentiment: parseFloat(row.avg_sentiment),
          dominantEmotion: this.sentimentToEmotion(parseFloat(row.avg_sentiment)),
          totalEntries: parseInt(row.entries),
          trend,
        };
      });

      return trends;
    } catch (error) {
      logger.error('Failed to get mood trends', { userId, period, error });
      throw error;
    }
  }

  /**
   * Calculate sentiment score from text (rule-based)
   */
  private calculateSentimentScore(text: string): number {
    const lowerText = text.toLowerCase();

    const positiveWords = [
      'happy', 'joy', 'excited', 'great', 'awesome', 'amazing', 'wonderful',
      'excellent', 'fantastic', 'good', 'love', 'perfect', 'success', 'accomplished',
      'proud', 'grateful', 'blessed', 'motivated', 'inspired', 'confident'
    ];

    const negativeWords = [
      'sad', 'angry', 'frustrated', 'upset', 'disappointed', 'terrible', 'awful',
      'horrible', 'bad', 'hate', 'fail', 'failure', 'stuck', 'struggle', 'difficult',
      'anxious', 'stressed', 'worried', 'depressed', 'hopeless', 'overwhelmed'
    ];

    const intensifiers = ['very', 'extremely', 'really', 'so', 'incredibly', 'totally'];
    const negators = ['not', 'no', 'never', 'nothing', 'nobody'];

    let score = 0;
    const words = lowerText.split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = i > 0 ? words[i - 1] : '';

      const isIntensified = intensifiers.includes(prevWord);
      const isNegated = negators.includes(prevWord);

      let wordScore = 0;

      if (positiveWords.includes(word)) {
        wordScore = 0.1;
      } else if (negativeWords.includes(word)) {
        wordScore = -0.1;
      }

      if (isIntensified) {
        wordScore *= 1.5;
      }

      if (isNegated) {
        wordScore *= -1;
      }

      score += wordScore;
    }

    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, score / 3));
  }

  /**
   * Detect emotions in text
   */
  private detectEmotions(text: string): EmotionScores {
    const lowerText = text.toLowerCase();

    const emotionKeywords: Record<keyof EmotionScores, string[]> = {
      joy: ['happy', 'joy', 'excited', 'great', 'love', 'wonderful', 'amazing'],
      sadness: ['sad', 'depressed', 'down', 'blue', 'unhappy', 'miserable'],
      anger: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed'],
      fear: ['scared', 'afraid', 'anxious', 'worried', 'nervous', 'frightened'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected'],
      disgust: ['disgusted', 'revolted', 'gross', 'awful', 'horrible'],
      neutral: ['okay', 'fine', 'alright', 'normal', 'average'],
    };

    const scores: EmotionScores = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 0.5, // Base neutral score
    };

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          scores[emotion as keyof EmotionScores] += 0.2;
        }
      });
    });

    // Normalize scores to sum to 1
    const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      Object.keys(scores).forEach(emotion => {
        scores[emotion as keyof EmotionScores] /= total;
      });
    }

    return scores;
  }

  /**
   * Convert sentiment score to label
   */
  private scoreToLabel(score: number): SentimentResult['label'] {
    if (score <= -0.6) return 'very_negative';
    if (score <= -0.2) return 'negative';
    if (score <= 0.2) return 'neutral';
    if (score <= 0.6) return 'positive';
    return 'very_positive';
  }

  /**
   * Map mood string to sentiment score
   */
  private moodToSentiment(mood: string): number {
    const moodScores: Record<string, number> = {
      terrible: -0.9,
      bad: -0.6,
      sad: -0.5,
      stressed: -0.4,
      anxious: -0.3,
      okay: 0,
      neutral: 0,
      calm: 0.3,
      good: 0.5,
      happy: 0.7,
      excited: 0.8,
      amazing: 0.9,
    };

    return moodScores[mood.toLowerCase()] || 0;
  }

  /**
   * Map mood to emotion scores
   */
  private moodToEmotions(mood: string): EmotionScores {
    const moodEmotions: Record<string, Partial<EmotionScores>> = {
      happy: { joy: 0.8, neutral: 0.2 },
      excited: { joy: 0.7, surprise: 0.3 },
      sad: { sadness: 0.8, neutral: 0.2 },
      angry: { anger: 0.8, neutral: 0.2 },
      anxious: { fear: 0.7, neutral: 0.3 },
      stressed: { anger: 0.4, fear: 0.4, neutral: 0.2 },
      calm: { neutral: 0.6, joy: 0.4 },
      okay: { neutral: 1.0 },
    };

    const baseEmotions = this.getDefaultEmotions();
    const moodEmotion = moodEmotions[mood.toLowerCase()];

    if (moodEmotion) {
      return { ...baseEmotions, ...moodEmotion } as EmotionScores;
    }

    return baseEmotions;
  }

  /**
   * Get default emotion scores
   */
  private getDefaultEmotions(): EmotionScores {
    return {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 1.0,
    };
  }

  /**
   * Convert sentiment to dominant emotion
   */
  private sentimentToEmotion(sentiment: number): string {
    if (sentiment <= -0.6) return 'sadness';
    if (sentiment <= -0.2) return 'neutral';
    if (sentiment <= 0.2) return 'calm';
    if (sentiment <= 0.6) return 'content';
    return 'joy';
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(
    data: any[],
    currentIndex: number,
    field: string
  ): 'improving' | 'declining' | 'stable' {
    if (currentIndex >= data.length - 3) return 'stable';

    const current = parseFloat(data[currentIndex][field]);
    const previous = parseFloat(data[currentIndex + 1][field]);
    const older = parseFloat(data[currentIndex + 2][field]);

    const recentChange = current - previous;
    const olderChange = previous - older;

    if (recentChange > 0.1 && olderChange > 0.1) return 'improving';
    if (recentChange < -0.1 && olderChange < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Check for mental health alerts
   */
  private async checkMentalHealthAlerts(userId: string, sentimentScore: number): Promise<void> {
    try {
      // Check for prolonged negative sentiment
      const query = `
        SELECT AVG(sentiment_score) as avg_score, COUNT(*) as entries
        FROM mood_entries
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '7 days'
      `;

      const result = await this.db.query(query, [userId]);

      if (result.rows.length > 0) {
        const avgScore = parseFloat(result.rows[0].avg_score);
        const entries = parseInt(result.rows[0].entries);

        // Alert if average sentiment is very negative for 7 days with 5+ entries
        if (avgScore <= -0.5 && entries >= 5) {
          logger.warn('Mental health concern detected', {
            userId,
            avgScore,
            entries,
          });

          // In production: Send alert to support team, offer resources
        }
      }
    } catch (error) {
      logger.error('Failed to check mental health alerts', { userId, error });
    }
  }

  /**
   * Map database row to MoodEntry
   */
  private mapMoodEntry(row: any): MoodEntry {
    return {
      id: row.id,
      userId: row.user_id,
      mood: row.mood,
      sentimentScore: parseFloat(row.sentiment_score),
      emotions: typeof row.emotions === 'string' ? JSON.parse(row.emotions) : row.emotions,
      journalEntry: row.journal_entry,
      createdAt: new Date(row.created_at),
    };
  }
}
