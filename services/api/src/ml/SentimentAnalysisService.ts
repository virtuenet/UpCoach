/**
 * Sentiment Analysis Service
 *
 * Advanced NLP service for sentiment and emotion analysis using VADER lexicon,
 * emotion detection, and temporal sentiment tracking.
 *
 * @module ml/SentimentAnalysisService
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  confidence: number;
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  magnitude: number; // Strength of emotion
}

interface EmotionResult {
  emotions: EmotionScore[];
  primaryEmotion: string;
  emotionalState: 'balanced' | 'elevated' | 'distressed';
  confidence: number;
}

interface EmotionScore {
  emotion: EmotionType;
  score: number;
  intensity: 'low' | 'medium' | 'high';
}

type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'love' | 'trust';

interface EmotionalTrajectory {
  userId: string;
  timeline: TimelinePoint[];
  trend: 'improving' | 'stable' | 'declining';
  volatility: number;
  averageSentiment: number;
  emotionalRange: [number, number];
}

interface TimelinePoint {
  timestamp: Date;
  sentiment: number;
  emotion: string;
  context?: string;
}

interface BurnoutRisk {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  indicators: BurnoutIndicator[];
  recommendations: string[];
  trendingWorse: boolean;
}

interface BurnoutIndicator {
  type: string;
  severity: number;
  description: string;
  firstDetected: Date;
}

interface MotivationLevel {
  score: number; // 0-100
  level: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  factors: MotivationFactor[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface MotivationFactor {
  factor: string;
  impact: number;
  evidence: string[];
}

interface ConfidenceAssessment {
  score: number; // 0-100
  level: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  indicators: string[];
  compareToPrevious: number; // Change from previous assessment
}

interface StressIndicators {
  stressLevel: number; // 0-100
  category: 'minimal' | 'mild' | 'moderate' | 'severe';
  physicalSigns: string[];
  emotionalSigns: string[];
  behavioralSigns: string[];
  recommendations: string[];
}

interface ProgressSatisfaction {
  score: number; // 0-100
  sentiment: 'very-dissatisfied' | 'dissatisfied' | 'neutral' | 'satisfied' | 'very-satisfied';
  highlights: string[];
  concerns: string[];
}

interface LanguageTone {
  tone: 'formal' | 'casual' | 'aggressive' | 'passive' | 'assertive' | 'empathetic';
  confidence: number;
  characteristics: string[];
}

interface SarcasmDetection {
  isSarcastic: boolean;
  confidence: number;
  indicators: string[];
}

interface TopicExtraction {
  topics: Topic[];
  mainTopic: string;
  keywords: string[];
  entities: string[];
}

interface Topic {
  topic: string;
  relevance: number;
  keywords: string[];
}

interface IntentClassification {
  intent: string;
  confidence: number;
  alternatives: Array<{ intent: string; confidence: number }>;
}

interface HistoricalTrend {
  period: string;
  dataPoints: Array<{
    timestamp: Date;
    sentiment: number;
    emotion: string;
    event?: string;
  }>;
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  };
  patterns: string[];
}

// ============================================================================
// VADER Sentiment Lexicon (Subset)
// ============================================================================

const VADER_LEXICON: Record<string, number> = {
  // Positive words
  'amazing': 2.5, 'awesome': 2.2, 'beautiful': 2.0, 'best': 2.5, 'better': 1.8,
  'brilliant': 2.3, 'excellent': 2.5, 'fantastic': 2.5, 'good': 1.5, 'great': 2.0,
  'happy': 2.0, 'joy': 2.2, 'love': 2.5, 'perfect': 2.5, 'wonderful': 2.3,
  'outstanding': 2.5, 'superb': 2.3, 'terrific': 2.2, 'fabulous': 2.3, 'delightful': 2.0,
  'excited': 2.0, 'thrilled': 2.2, 'pleased': 1.8, 'glad': 1.7, 'grateful': 2.0,
  'optimistic': 1.8, 'confident': 1.9, 'motivated': 2.0, 'inspired': 2.1, 'encouraged': 1.8,
  'accomplished': 2.0, 'successful': 2.1, 'proud': 1.9, 'achieved': 1.8, 'progress': 1.5,
  'improved': 1.6, 'growth': 1.5, 'winning': 2.0, 'victory': 2.2, 'success': 2.0,

  // Negative words
  'awful': -2.2, 'bad': -1.5, 'horrible': -2.5, 'terrible': -2.5, 'worst': -2.5,
  'hate': -2.5, 'angry': -2.2, 'sad': -2.0, 'disappointing': -2.0, 'poor': -1.8,
  'fail': -2.2, 'failed': -2.2, 'failure': -2.3, 'struggling': -1.9, 'difficult': -1.5,
  'hard': -1.2, 'impossible': -2.0, 'stuck': -1.7, 'frustrated': -2.0, 'annoyed': -1.8,
  'stressed': -2.0, 'anxious': -1.9, 'worried': -1.8, 'concerned': -1.5, 'overwhelmed': -2.2,
  'exhausted': -2.0, 'tired': -1.5, 'drained': -1.9, 'burned': -2.1, 'burnout': -2.5,
  'depressed': -2.5, 'hopeless': -2.5, 'discouraged': -2.2, 'defeated': -2.3, 'lost': -1.8,
  'confused': -1.6, 'uncertain': -1.4, 'doubt': -1.7, 'fear': -2.0, 'afraid': -1.9,

  // Intensifiers
  'very': 1.3, 'extremely': 1.5, 'incredibly': 1.5, 'absolutely': 1.5, 'completely': 1.4,
  'totally': 1.4, 'really': 1.2, 'quite': 1.1, 'highly': 1.3, 'exceptionally': 1.5,
  'remarkably': 1.4, 'particularly': 1.2, 'especially': 1.2, 'truly': 1.3, 'genuinely': 1.2,

  // Diminishers
  'barely': -0.8, 'hardly': -0.8, 'slightly': -0.5, 'somewhat': -0.5, 'little': -0.6,
  'kind': -0.5, 'sort': -0.5, 'almost': -0.7, 'nearly': -0.7, 'scarcely': -0.8,

  // Negations handled separately
  'not': 0, 'no': 0, 'never': 0, 'nothing': 0, 'nowhere': 0,
  'neither': 0, 'nobody': 0, 'none': 0, "don't": 0, "doesn't": 0,
  "didn't": 0, "won't": 0, "wouldn't": 0, "can't": 0, "cannot": 0,
};

const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  joy: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'cheerful', 'glad', 'pleased', 'content', 'elated'],
  sadness: ['sad', 'unhappy', 'depressed', 'miserable', 'dejected', 'disappointed', 'down', 'blue', 'gloomy', 'sorrowful'],
  anger: ['angry', 'furious', 'mad', 'irritated', 'annoyed', 'frustrated', 'enraged', 'outraged', 'hostile', 'resentful'],
  fear: ['afraid', 'scared', 'fearful', 'terrified', 'anxious', 'worried', 'nervous', 'frightened', 'panicked', 'alarmed'],
  surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'startled', 'stunned', 'unexpected', 'sudden', 'remarkable'],
  disgust: ['disgusted', 'repulsed', 'revolted', 'sickened', 'appalled', 'offended', 'distaste', 'aversion'],
  love: ['love', 'adore', 'cherish', 'affection', 'fond', 'caring', 'devoted', 'passionate', 'tender', 'intimate'],
  trust: ['trust', 'confident', 'secure', 'certain', 'assured', 'reliable', 'dependable', 'faith', 'belief', 'conviction'],
};

const NEGATION_WORDS = ['not', 'no', 'never', 'nothing', 'nowhere', 'neither', 'nobody', 'none', "don't", "doesn't", "didn't", "won't", "wouldn't", "can't", "cannot", "isn't", "aren't", "wasn't", "weren't"];

// ============================================================================
// Sentiment Analysis Service
// ============================================================================

export class SentimentAnalysisService extends EventEmitter {
  private redis: Redis;
  private readonly CACHE_TTL = 1800; // 30 minutes
  private readonly TRAJECTORY_WINDOW = 90; // 90 days

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  // ============================================================================
  // Sentiment Analysis (VADER-based)
  // ============================================================================

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const cacheKey = `sentiment:${this.hashText(text)}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Tokenize and normalize
      const tokens = this.tokenize(text.toLowerCase());
      let positiveScore = 0;
      let negativeScore = 0;
      let neutralScore = 0;

      // Process each token with VADER rules
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        let score = VADER_LEXICON[token] || 0;

        // Check for negation (within 3 words before)
        const negationWindow = tokens.slice(Math.max(0, i - 3), i);
        const hasNegation = negationWindow.some(t => NEGATION_WORDS.includes(t));

        if (hasNegation && score !== 0) {
          score = -score * 0.75; // Flip and dampen
        }

        // Check for intensifiers (word before)
        if (i > 0) {
          const prevToken = tokens[i - 1];
          const intensifier = VADER_LEXICON[prevToken];
          if (intensifier && Math.abs(intensifier) > 1) {
            score = score * intensifier;
          }
        }

        if (score > 0) {
          positiveScore += score;
        } else if (score < 0) {
          negativeScore += Math.abs(score);
        } else if (token.length > 3) {
          neutralScore += 0.1;
        }
      }

      // Normalize scores
      const total = positiveScore + negativeScore + neutralScore;
      const normalizedPositive = total > 0 ? positiveScore / total : 0;
      const normalizedNegative = total > 0 ? negativeScore / total : 0;
      const normalizedNeutral = total > 0 ? neutralScore / total : 1;

      // Calculate compound score (-1 to 1)
      const compoundScore = this.normalizeScore(positiveScore - negativeScore);

      // Determine sentiment
      let sentiment: 'positive' | 'negative' | 'neutral';
      if (compoundScore >= 0.05) {
        sentiment = 'positive';
      } else if (compoundScore <= -0.05) {
        sentiment = 'negative';
      } else {
        sentiment = 'neutral';
      }

      // Calculate confidence based on magnitude
      const magnitude = positiveScore + negativeScore;
      const confidence = Math.min(1, magnitude / 10);

      const result: SentimentResult = {
        sentiment,
        score: compoundScore,
        confidence,
        breakdown: {
          positive: normalizedPositive,
          negative: normalizedNegative,
          neutral: normalizedNeutral,
        },
        magnitude,
      };

      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      this.emit('sentiment:analyzed', { sentiment, score: compoundScore });

      return result;
    } catch (error) {
      this.emit('error', { operation: 'analyzeSentiment', error });
      throw error;
    }
  }

  // ============================================================================
  // Emotion Detection
  // ============================================================================

  async detectEmotions(text: string): Promise<EmotionResult> {
    try {
      const tokens = this.tokenize(text.toLowerCase());
      const emotionScores: Record<EmotionType, number> = {
        joy: 0, sadness: 0, anger: 0, fear: 0,
        surprise: 0, disgust: 0, love: 0, trust: 0,
      };

      // Calculate emotion scores based on keyword matching
      Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
        tokens.forEach(token => {
          if (keywords.some(kw => token.includes(kw) || kw.includes(token))) {
            emotionScores[emotion as EmotionType] += 1;
          }
        });
      });

      // Normalize scores
      const total = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
      const emotions: EmotionScore[] = [];

      if (total > 0) {
        Object.entries(emotionScores).forEach(([emotion, score]) => {
          if (score > 0) {
            const normalizedScore = score / total;
            emotions.push({
              emotion: emotion as EmotionType,
              score: normalizedScore,
              intensity: normalizedScore > 0.4 ? 'high' : normalizedScore > 0.2 ? 'medium' : 'low',
            });
          }
        });
      }

      // Sort by score
      emotions.sort((a, b) => b.score - a.score);

      // Determine primary emotion
      const primaryEmotion = emotions.length > 0 ? emotions[0].emotion : 'neutral';

      // Determine emotional state
      let emotionalState: 'balanced' | 'elevated' | 'distressed';
      const positiveEmotions = ['joy', 'love', 'trust'];
      const negativeEmotions = ['sadness', 'anger', 'fear', 'disgust'];

      const positiveScore = emotions
        .filter(e => positiveEmotions.includes(e.emotion))
        .reduce((sum, e) => sum + e.score, 0);

      const negativeScore = emotions
        .filter(e => negativeEmotions.includes(e.emotion))
        .reduce((sum, e) => sum + e.score, 0);

      if (positiveScore > 0.6) {
        emotionalState = 'elevated';
      } else if (negativeScore > 0.6) {
        emotionalState = 'distressed';
      } else {
        emotionalState = 'balanced';
      }

      const confidence = emotions.length > 0 ? emotions[0].score : 0;

      const result: EmotionResult = {
        emotions,
        primaryEmotion,
        emotionalState,
        confidence,
      };

      this.emit('emotion:detected', { primaryEmotion, emotionalState });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'detectEmotions', error });
      throw error;
    }
  }

  // ============================================================================
  // Emotional Trajectory Tracking
  // ============================================================================

  async trackEmotionalTrajectory(userId: string, days: number = 30): Promise<EmotionalTrajectory> {
    try {
      const timelineKey = `emotional_timeline:${userId}`;
      const rawData = await this.redis.lrange(timelineKey, 0, -1);

      const timeline: TimelinePoint[] = rawData
        .map(data => JSON.parse(data))
        .filter((point: TimelinePoint) => {
          const daysDiff = (Date.now() - new Date(point.timestamp).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= days;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (timeline.length === 0) {
        return {
          userId,
          timeline: [],
          trend: 'stable',
          volatility: 0,
          averageSentiment: 0,
          emotionalRange: [0, 0],
        };
      }

      // Calculate statistics
      const sentiments = timeline.map(p => p.sentiment);
      const averageSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;

      // Calculate trend (simple linear regression)
      const trend = this.calculateTrend(timeline);

      // Calculate volatility (standard deviation)
      const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - averageSentiment, 2), 0) / sentiments.length;
      const volatility = Math.sqrt(variance);

      // Emotional range
      const emotionalRange: [number, number] = [
        Math.min(...sentiments),
        Math.max(...sentiments),
      ];

      const result: EmotionalTrajectory = {
        userId,
        timeline,
        trend,
        volatility,
        averageSentiment,
        emotionalRange,
      };

      this.emit('trajectory:calculated', { userId, trend, averageSentiment });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'trackEmotionalTrajectory', userId, error });
      throw error;
    }
  }

  async addToEmotionalTimeline(
    userId: string,
    sentiment: number,
    emotion: string,
    context?: string
  ): Promise<void> {
    try {
      const timelineKey = `emotional_timeline:${userId}`;
      const point: TimelinePoint = {
        timestamp: new Date(),
        sentiment,
        emotion,
        context,
      };

      await this.redis.lpush(timelineKey, JSON.stringify(point));
      await this.redis.ltrim(timelineKey, 0, 999); // Keep last 1000 entries
      await this.redis.expire(timelineKey, this.TRAJECTORY_WINDOW * 86400);

      this.emit('timeline:updated', { userId, sentiment, emotion });
    } catch (error) {
      this.emit('error', { operation: 'addToEmotionalTimeline', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Burnout Risk Detection
  // ============================================================================

  async detectBurnoutRisk(userId: string, recentMessages: string[]): Promise<BurnoutRisk> {
    try {
      const indicators: BurnoutIndicator[] = [];
      let totalScore = 0;

      // Analyze recent messages for burnout signals
      const sentiments: number[] = [];
      const emotions: string[] = [];

      for (const message of recentMessages) {
        const sentiment = await this.analyzeSentiment(message);
        const emotion = await this.detectEmotions(message);

        sentiments.push(sentiment.score);
        emotions.push(emotion.primaryEmotion);

        // Check for exhaustion language
        if (this.containsBurnoutLanguage(message)) {
          indicators.push({
            type: 'Exhaustion Language',
            severity: 0.8,
            description: 'Using language indicating exhaustion or being overwhelmed',
            firstDetected: new Date(),
          });
          totalScore += 20;
        }

        // Check for cynicism/detachment
        if (sentiment.score < -0.3 && emotion.primaryEmotion === 'anger') {
          indicators.push({
            type: 'Cynicism',
            severity: 0.7,
            description: 'Showing signs of cynicism or detachment',
            firstDetected: new Date(),
          });
          totalScore += 15;
        }
      }

      // Check trajectory
      const trajectory = await this.trackEmotionalTrajectory(userId, 14);

      // Declining trend
      if (trajectory.trend === 'declining') {
        indicators.push({
          type: 'Declining Emotional Trend',
          severity: 0.6,
          description: 'Emotional state has been declining over past 2 weeks',
          firstDetected: new Date(),
        });
        totalScore += 15;
      }

      // High volatility
      if (trajectory.volatility > 0.5) {
        indicators.push({
          type: 'Emotional Volatility',
          severity: 0.5,
          description: 'High emotional fluctuations indicating instability',
          firstDetected: new Date(),
        });
        totalScore += 10;
      }

      // Consistently negative sentiment
      const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
      if (avgSentiment < -0.2) {
        indicators.push({
          type: 'Persistent Negativity',
          severity: 0.9,
          description: 'Consistently negative emotional state',
          firstDetected: new Date(),
        });
        totalScore += 25;
      }

      // Determine risk level
      const score = Math.min(100, totalScore);
      let riskLevel: BurnoutRisk['riskLevel'];
      if (score >= 70) riskLevel = 'critical';
      else if (score >= 50) riskLevel = 'high';
      else if (score >= 30) riskLevel = 'medium';
      else riskLevel = 'low';

      // Generate recommendations
      const recommendations = this.generateBurnoutRecommendations(indicators, riskLevel);

      // Check if trending worse
      const trendingWorse = trajectory.trend === 'declining' && avgSentiment < trajectory.averageSentiment;

      const result: BurnoutRisk = {
        riskLevel,
        score,
        indicators: indicators.sort((a, b) => b.severity - a.severity),
        recommendations,
        trendingWorse,
      };

      this.emit('burnout:assessed', { userId, riskLevel, score });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'detectBurnoutRisk', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Motivation Level Scoring
  // ============================================================================

  async scoreMotivationLevel(userId: string, text: string, context?: any): Promise<MotivationLevel> {
    try {
      const sentiment = await this.analyzeSentiment(text);
      const emotion = await this.detectEmotions(text);
      const factors: MotivationFactor[] = [];

      let score = 50; // Baseline

      // Sentiment impact
      score += sentiment.score * 25;
      factors.push({
        factor: 'Emotional State',
        impact: sentiment.score * 25,
        evidence: [`Sentiment: ${sentiment.sentiment} (${sentiment.score.toFixed(2)})`],
      });

      // Emotion impact
      const motivatingEmotions = ['joy', 'trust', 'surprise'];
      const demotivatingEmotions = ['sadness', 'fear', 'anger'];

      const hasMotivatingEmotion = emotion.emotions.some(e => motivatingEmotions.includes(e.emotion) && e.score > 0.3);
      const hasDemotivatingEmotion = emotion.emotions.some(e => demotivatingEmotions.includes(e.emotion) && e.score > 0.3);

      if (hasMotivatingEmotion) {
        score += 15;
        factors.push({
          factor: 'Positive Emotions',
          impact: 15,
          evidence: [`Detected: ${emotion.primaryEmotion}`],
        });
      }

      if (hasDemotivatingEmotion) {
        score -= 15;
        factors.push({
          factor: 'Negative Emotions',
          impact: -15,
          evidence: [`Detected: ${emotion.primaryEmotion}`],
        });
      }

      // Action language
      const actionWords = ['will', 'going to', 'plan', 'commit', 'ready', 'start', 'begin'];
      const hasActionLanguage = actionWords.some(word => text.toLowerCase().includes(word));

      if (hasActionLanguage) {
        score += 10;
        factors.push({
          factor: 'Action-Oriented Language',
          impact: 10,
          evidence: ['Using commitment and action words'],
        });
      }

      // Goal-oriented language
      const goalWords = ['goal', 'achieve', 'accomplish', 'succeed', 'progress'];
      const hasGoalLanguage = goalWords.some(word => text.toLowerCase().includes(word));

      if (hasGoalLanguage) {
        score += 10;
        factors.push({
          factor: 'Goal Focus',
          impact: 10,
          evidence: ['Focused on goals and achievements'],
        });
      }

      // Clamp score
      score = Math.max(0, Math.min(100, score));

      // Determine level
      let level: MotivationLevel['level'];
      if (score >= 80) level = 'very-high';
      else if (score >= 60) level = 'high';
      else if (score >= 40) level = 'moderate';
      else if (score >= 20) level = 'low';
      else level = 'very-low';

      // Determine trend from trajectory
      const trajectory = await this.trackEmotionalTrajectory(userId, 7);
      let trend: 'increasing' | 'stable' | 'decreasing';

      if (trajectory.trend === 'improving') trend = 'increasing';
      else if (trajectory.trend === 'declining') trend = 'decreasing';
      else trend = 'stable';

      const result: MotivationLevel = {
        score,
        level,
        factors,
        trend,
      };

      this.emit('motivation:scored', { userId, score, level });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'scoreMotivationLevel', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Confidence Level Assessment
  // ============================================================================

  async assessConfidence(userId: string, text: string): Promise<ConfidenceAssessment> {
    try {
      const indicators: string[] = [];
      let score = 50;

      // Confident language
      const confidentWords = ['confident', 'certain', 'sure', 'believe', 'know', 'can', 'will', 'able'];
      const uncertainWords = ['maybe', 'perhaps', 'might', 'unsure', 'uncertain', 'doubt', "can't", 'unable'];

      const lowerText = text.toLowerCase();
      const confidentCount = confidentWords.filter(word => lowerText.includes(word)).length;
      const uncertainCount = uncertainWords.filter(word => lowerText.includes(word)).length;

      score += confidentCount * 8;
      score -= uncertainCount * 10;

      if (confidentCount > 0) {
        indicators.push(`Using confident language (${confidentCount} instances)`);
      }
      if (uncertainCount > 0) {
        indicators.push(`Using uncertain language (${uncertainCount} instances)`);
      }

      // Assertive vs passive language
      const assertive = /\bI (am|will|can|have)\b/gi.test(text);
      const passive = /\bI (might|could|should|would)\b/gi.test(text);

      if (assertive) {
        score += 10;
        indicators.push('Using assertive "I" statements');
      }
      if (passive) {
        score -= 8;
        indicators.push('Using passive conditional language');
      }

      // Sentiment impact
      const sentiment = await this.analyzeSentiment(text);
      score += sentiment.score * 15;

      // Previous assessment comparison
      const prevKey = `confidence:${userId}:previous`;
      const previousScore = await this.redis.get(prevKey);
      const compareToPrevious = previousScore ? score - parseFloat(previousScore) : 0;

      // Save current score
      await this.redis.setex(prevKey, 86400 * 7, score.toString());

      // Clamp score
      score = Math.max(0, Math.min(100, score));

      // Determine level
      let level: ConfidenceAssessment['level'];
      if (score >= 80) level = 'very-high';
      else if (score >= 60) level = 'high';
      else if (score >= 40) level = 'moderate';
      else if (score >= 20) level = 'low';
      else level = 'very-low';

      const result: ConfidenceAssessment = {
        score,
        level,
        indicators,
        compareToPrevious,
      };

      this.emit('confidence:assessed', { userId, score, level });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'assessConfidence', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Stress Indicator Analysis
  // ============================================================================

  async analyzeStressIndicators(userId: string, text: string): Promise<StressIndicators> {
    try {
      const physicalSigns: string[] = [];
      const emotionalSigns: string[] = [];
      const behavioralSigns: string[] = [];
      let stressLevel = 0;

      // Physical stress indicators
      const physicalKeywords = ['tired', 'exhausted', 'headache', 'pain', 'sleep', 'insomnia', 'tension'];
      physicalKeywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          physicalSigns.push(keyword);
          stressLevel += 10;
        }
      });

      // Emotional stress indicators
      const emotionalKeywords = ['anxious', 'worried', 'overwhelmed', 'stressed', 'panic', 'nervous'];
      emotionalKeywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          emotionalSigns.push(keyword);
          stressLevel += 12;
        }
      });

      // Behavioral indicators
      const behavioralKeywords = ['avoid', 'procrastinat', 'behind', 'deadline', 'rush', 'forgot'];
      behavioralKeywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          behavioralSigns.push(keyword);
          stressLevel += 8;
        }
      });

      // Sentiment analysis
      const sentiment = await this.analyzeSentiment(text);
      if (sentiment.score < -0.3) {
        stressLevel += 15;
        emotionalSigns.push('negative emotional state');
      }

      // Clamp level
      stressLevel = Math.min(100, stressLevel);

      // Categorize
      let category: StressIndicators['category'];
      if (stressLevel >= 70) category = 'severe';
      else if (stressLevel >= 45) category = 'moderate';
      else if (stressLevel >= 20) category = 'mild';
      else category = 'minimal';

      // Generate recommendations
      const recommendations = this.generateStressRecommendations(category, physicalSigns, emotionalSigns);

      const result: StressIndicators = {
        stressLevel,
        category,
        physicalSigns,
        emotionalSigns,
        behavioralSigns,
        recommendations,
      };

      this.emit('stress:analyzed', { userId, stressLevel, category });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'analyzeStressIndicators', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Progress Satisfaction Measurement
  // ============================================================================

  async measureProgressSatisfaction(userId: string, progressText: string): Promise<ProgressSatisfaction> {
    try {
      const sentiment = await this.analyzeSentiment(progressText);
      const emotion = await this.detectEmotions(progressText);

      let score = 50 + (sentiment.score * 50);

      // Look for satisfaction keywords
      const satisfactionWords = ['proud', 'satisfied', 'happy', 'pleased', 'accomplished'];
      const dissatisfactionWords = ['disappointed', 'frustrated', 'behind', 'slow', 'stuck'];

      const highlights: string[] = [];
      const concerns: string[] = [];

      satisfactionWords.forEach(word => {
        if (progressText.toLowerCase().includes(word)) {
          score += 8;
          highlights.push(`Expressing ${word}`);
        }
      });

      dissatisfactionWords.forEach(word => {
        if (progressText.toLowerCase().includes(word)) {
          score -= 10;
          concerns.push(`Mentions ${word}`);
        }
      });

      // Clamp score
      score = Math.max(0, Math.min(100, score));

      // Determine sentiment category
      let sentimentCategory: ProgressSatisfaction['sentiment'];
      if (score >= 80) sentimentCategory = 'very-satisfied';
      else if (score >= 60) sentimentCategory = 'satisfied';
      else if (score >= 40) sentimentCategory = 'neutral';
      else if (score >= 20) sentimentCategory = 'dissatisfied';
      else sentimentCategory = 'very-dissatisfied';

      const result: ProgressSatisfaction = {
        score,
        sentiment: sentimentCategory,
        highlights,
        concerns,
      };

      this.emit('satisfaction:measured', { userId, score, sentiment: sentimentCategory });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'measureProgressSatisfaction', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Language Tone Analysis
  // ============================================================================

  async analyzeTone(text: string): Promise<LanguageTone> {
    try {
      const characteristics: string[] = [];
      const scores: Record<string, number> = {
        formal: 0,
        casual: 0,
        aggressive: 0,
        passive: 0,
        assertive: 0,
        empathetic: 0,
      };

      // Formal indicators
      const formalWords = ['furthermore', 'moreover', 'consequently', 'therefore', 'indeed'];
      if (formalWords.some(word => text.includes(word))) {
        scores.formal += 2;
        characteristics.push('Uses formal transitional phrases');
      }

      // Casual indicators
      const casualWords = ['gonna', 'wanna', 'yeah', 'cool', 'awesome', 'totally'];
      if (casualWords.some(word => text.toLowerCase().includes(word))) {
        scores.casual += 2;
        characteristics.push('Uses casual language');
      }

      // Aggressive indicators
      const aggressiveWords = ['must', 'need to', 'have to', 'should', 'demand'];
      if (aggressiveWords.some(word => text.toLowerCase().includes(word))) {
        scores.aggressive += 1.5;
        characteristics.push('Uses directive language');
      }

      // Passive indicators
      if (/\b(maybe|perhaps|possibly|might)\b/i.test(text)) {
        scores.passive += 1.5;
        characteristics.push('Uses tentative language');
      }

      // Assertive indicators
      if (/\bI (will|am going to|plan to)\b/i.test(text)) {
        scores.assertive += 2;
        characteristics.push('Uses assertive statements');
      }

      // Empathetic indicators
      const empatheticWords = ['understand', 'feel', 'appreciate', 'support', 'care'];
      if (empatheticWords.some(word => text.toLowerCase().includes(word))) {
        scores.empathetic += 2;
        characteristics.push('Shows empathy and understanding');
      }

      // Determine primary tone
      const maxScore = Math.max(...Object.values(scores));
      const tone = (Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'casual') as LanguageTone['tone'];
      const confidence = Math.min(1, maxScore / 4);

      const result: LanguageTone = {
        tone,
        confidence,
        characteristics,
      };

      this.emit('tone:analyzed', { tone, confidence });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'analyzeTone', error });
      throw error;
    }
  }

  // ============================================================================
  // Sarcasm Detection
  // ============================================================================

  async detectSarcasm(text: string): Promise<SarcasmDetection> {
    try {
      const indicators: string[] = [];
      let score = 0;

      // Sentiment-emotion mismatch
      const sentiment = await this.analyzeSentiment(text);
      const hasPositiveWords = /\b(great|wonderful|perfect|amazing)\b/i.test(text);

      if (hasPositiveWords && sentiment.score < -0.2) {
        score += 0.4;
        indicators.push('Positive words with negative context');
      }

      // Exaggeration
      if (/\b(totally|absolutely|completely|definitely) (not|never)\b/i.test(text)) {
        score += 0.3;
        indicators.push('Emphatic negation pattern');
      }

      // Question + obvious answer
      if (/\?/.test(text) && /\b(obviously|clearly|of course)\b/i.test(text)) {
        score += 0.2;
        indicators.push('Rhetorical question pattern');
      }

      // Quotation marks around common words
      if (/"[a-z]+"/i.test(text)) {
        score += 0.1;
        indicators.push('Ironic quotation marks');
      }

      const isSarcastic = score >= 0.5;
      const confidence = Math.min(1, score);

      const result: SarcasmDetection = {
        isSarcastic,
        confidence,
        indicators,
      };

      this.emit('sarcasm:detected', { isSarcastic, confidence });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'detectSarcasm', error });
      throw error;
    }
  }

  // ============================================================================
  // Topic Extraction (TF-IDF)
  // ============================================================================

  async extractTopics(text: string, numTopics: number = 3): Promise<TopicExtraction> {
    try {
      const tokens = this.tokenize(text.toLowerCase());

      // Remove stop words
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
      const filteredTokens = tokens.filter(token => !stopWords.has(token) && token.length > 3);

      // Calculate term frequency
      const termFreq: Record<string, number> = {};
      filteredTokens.forEach(token => {
        termFreq[token] = (termFreq[token] || 0) + 1;
      });

      // Get top keywords
      const keywords = Object.entries(termFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

      // Simple topic clustering (group related keywords)
      const topics: Topic[] = [];
      const used = new Set<string>();

      keywords.forEach(keyword => {
        if (!used.has(keyword)) {
          const related = keywords.filter(k => !used.has(k) && this.areRelated(keyword, k));
          related.forEach(k => used.add(k));

          topics.push({
            topic: this.generateTopicName([keyword, ...related]),
            relevance: termFreq[keyword] / filteredTokens.length,
            keywords: [keyword, ...related].slice(0, 5),
          });
        }
      });

      const mainTopic = topics.length > 0 ? topics[0].topic : 'General Discussion';

      // Extract entities (simple)
      const entities = this.extractEntities(text);

      const result: TopicExtraction = {
        topics: topics.slice(0, numTopics),
        mainTopic,
        keywords,
        entities,
      };

      this.emit('topics:extracted', { mainTopic, topicCount: topics.length });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'extractTopics', error });
      throw error;
    }
  }

  // ============================================================================
  // Historical Sentiment Trends
  // ============================================================================

  async getHistoricalTrends(userId: string, period: string = '30d'): Promise<HistoricalTrend> {
    try {
      const days = parseInt(period) || 30;
      const trajectory = await this.trackEmotionalTrajectory(userId, days);

      const dataPoints = trajectory.timeline.map(point => ({
        timestamp: point.timestamp,
        sentiment: point.sentiment,
        emotion: point.emotion,
        event: point.context,
      }));

      // Calculate statistics
      const sentiments = dataPoints.map(p => p.sentiment);
      const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
      const sortedSentiments = [...sentiments].sort((a, b) => a - b);
      const median = sortedSentiments[Math.floor(sortedSentiments.length / 2)];
      const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;
      const stdDev = Math.sqrt(variance);
      const min = Math.min(...sentiments);
      const max = Math.max(...sentiments);

      // Identify patterns
      const patterns: string[] = [];

      if (trajectory.trend === 'improving') {
        patterns.push('Consistent positive trend over the period');
      } else if (trajectory.trend === 'declining') {
        patterns.push('Declining emotional state - may need support');
      }

      if (stdDev > 0.5) {
        patterns.push('High emotional volatility');
      } else if (stdDev < 0.2) {
        patterns.push('Stable emotional state');
      }

      if (mean > 0.3) {
        patterns.push('Generally positive sentiment');
      } else if (mean < -0.3) {
        patterns.push('Generally negative sentiment - intervention recommended');
      }

      const result: HistoricalTrend = {
        period,
        dataPoints,
        statistics: { mean, median, stdDev, min, max },
        patterns,
      };

      this.emit('trends:analyzed', { userId, period, mean });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'getHistoricalTrends', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  private normalizeScore(score: number): number {
    // Normalize to -1 to 1 range
    const normalized = score / (Math.abs(score) + 15);
    return Math.max(-1, Math.min(1, normalized));
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private calculateTrend(timeline: TimelinePoint[]): 'improving' | 'stable' | 'declining' {
    if (timeline.length < 2) return 'stable';

    // Simple linear regression
    const n = timeline.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    timeline.forEach((point, i) => {
      sumX += i;
      sumY += point.sentiment;
      sumXY += i * point.sentiment;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (slope > 0.01) return 'improving';
    if (slope < -0.01) return 'declining';
    return 'stable';
  }

  private containsBurnoutLanguage(text: string): boolean {
    const burnoutPhrases = [
      'burned out', 'burnout', 'exhausted', 'drained', 'overwhelmed',
      'can\'t anymore', 'too much', 'giving up', 'quit', 'done'
    ];
    return burnoutPhrases.some(phrase => text.toLowerCase().includes(phrase));
  }

  private generateBurnoutRecommendations(
    indicators: BurnoutIndicator[],
    riskLevel: BurnoutRisk['riskLevel']
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Consider reaching out to a mental health professional');
      recommendations.push('Take immediate time off if possible');
      recommendations.push('Delegate or postpone non-essential tasks');
    }

    if (indicators.some(i => i.type === 'Exhaustion Language')) {
      recommendations.push('Prioritize sleep and rest');
      recommendations.push('Schedule regular breaks throughout the day');
    }

    if (indicators.some(i => i.type === 'Emotional Volatility')) {
      recommendations.push('Practice stress management techniques (meditation, exercise)');
      recommendations.push('Establish consistent daily routines');
    }

    recommendations.push('Reduce coaching session frequency temporarily');
    recommendations.push('Focus on simple, achievable goals');

    return recommendations.slice(0, 5);
  }

  private generateStressRecommendations(
    category: StressIndicators['category'],
    physicalSigns: string[],
    emotionalSigns: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (category === 'severe' || category === 'moderate') {
      recommendations.push('Consider professional stress management support');
    }

    if (physicalSigns.length > 0) {
      recommendations.push('Prioritize physical self-care (sleep, nutrition, exercise)');
    }

    if (emotionalSigns.length > 0) {
      recommendations.push('Practice mindfulness or meditation');
      recommendations.push('Talk to someone you trust about your feelings');
    }

    recommendations.push('Identify and address main stressors');
    recommendations.push('Set boundaries and learn to say no');
    recommendations.push('Break large tasks into smaller, manageable steps');

    return recommendations.slice(0, 5);
  }

  private areRelated(word1: string, word2: string): boolean {
    // Simple relatedness check (could be enhanced with word embeddings)
    return word1.substring(0, 3) === word2.substring(0, 3);
  }

  private generateTopicName(keywords: string[]): string {
    if (keywords.length === 0) return 'Unknown';
    return keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1);
  }

  private extractEntities(text: string): string[] {
    const entities: string[] = [];

    // Simple capitalized word extraction (names, places)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
    entities.push(...capitalizedWords.filter(word => word.length > 3));

    return [...new Set(entities)];
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async close(): Promise<void> {
    await this.redis.quit();
    this.removeAllListeners();
  }
}

export default SentimentAnalysisService;
