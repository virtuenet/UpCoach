import { EventEmitter } from 'events';

export interface SentimentAnalysis {
  textId: string;
  userId: string;
  overall: 'positive' | 'neutral' | 'negative' | 'mixed';
  score: number; // -1 to +1
  emotions: { joy: number; sadness: number; anger: number; fear: number; surprise: number; };
  keyPhrases: string[];
  concerningPatterns: Array<{ pattern: string; severity: 'low' | 'medium' | 'high'; }>;
  analyzedAt: Date;
}

export class SentimentAnalysisService extends EventEmitter {
  private static instance: SentimentAnalysisService;
  private analyses: Map<string, SentimentAnalysis> = new Map();

  private constructor() { super(); }

  static getInstance(): SentimentAnalysisService {
    if (!SentimentAnalysisService.instance) {
      SentimentAnalysisService.instance = new SentimentAnalysisService();
    }
    return SentimentAnalysisService.instance;
  }

  async analyzeText(textId: string, userId: string, text: string): Promise<SentimentAnalysis> {
    const score = this.calculateSentimentScore(text);
    const overall = this.classifySentiment(score);
    const emotions = this.detectEmotions(text);
    const keyPhrases = this.extractKeyPhrases(text);
    const concerningPatterns = this.detectConcerningPatterns(text);

    const analysis: SentimentAnalysis = {
      textId,
      userId,
      overall,
      score,
      emotions,
      keyPhrases,
      concerningPatterns,
      analyzedAt: new Date(),
    };

    this.analyses.set(textId, analysis);
    this.emit('analysis:completed', analysis);

    if (concerningPatterns.some(p => p.severity === 'high')) {
      this.emit('alert:concerning_sentiment', { userId, textId, patterns: concerningPatterns });
    }

    return analysis;
  }

  private calculateSentimentScore(text: string): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    const positiveWords = ['happy', 'great', 'excellent', 'good', 'love', 'amazing', 'wonderful', 'excited', 'progress', 'success'];
    const negativeWords = ['sad', 'bad', 'terrible', 'hate', 'awful', 'frustrated', 'difficult', 'struggling', 'stuck', 'give up'];

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.1;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.1;
    });

    return Math.max(-1, Math.min(1, score));
  }

  private classifySentiment(score: number): SentimentAnalysis['overall'] {
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    if (Math.abs(score) < 0.1) return 'neutral';
    return 'mixed';
  }

  private detectEmotions(text: string): SentimentAnalysis['emotions'] {
    const lowerText = text.toLowerCase();
    return {
      joy: lowerText.includes('happy') || lowerText.includes('excited') ? 0.8 : 0.1,
      sadness: lowerText.includes('sad') || lowerText.includes('depressed') ? 0.7 : 0.1,
      anger: lowerText.includes('angry') || lowerText.includes('frustrated') ? 0.6 : 0.1,
      fear: lowerText.includes('afraid') || lowerText.includes('worried') ? 0.5 : 0.1,
      surprise: lowerText.includes('surprised') || lowerText.includes('shocked') ? 0.4 : 0.1,
    };
  }

  private extractKeyPhrases(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 5).slice(0, 5);
  }

  private detectConcerningPatterns(text: string): SentimentAnalysis['concerningPatterns'] {
    const patterns: SentimentAnalysis['concerningPatterns'] = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('give up') || lowerText.includes('quit')) {
      patterns.push({ pattern: 'Expressed desire to quit', severity: 'high' });
    }
    if (lowerText.includes('no point') || lowerText.includes('hopeless')) {
      patterns.push({ pattern: 'Feelings of hopelessness', severity: 'high' });
    }
    if (lowerText.includes('struggling') || lowerText.includes('difficult')) {
      patterns.push({ pattern: 'Struggling with challenges', severity: 'medium' });
    }

    return patterns;
  }

  async getAnalysis(textId: string): Promise<SentimentAnalysis | null> {
    return this.analyses.get(textId) || null;
  }

  async getUserSentimentTrend(userId: string): Promise<{ trend: 'improving' | 'stable' | 'declining'; avgScore: number; }> {
    const userAnalyses = Array.from(this.analyses.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.analyzedAt.getTime() - a.analyzedAt.getTime());

    if (userAnalyses.length < 2) {
      return { trend: 'stable', avgScore: 0 };
    }

    const avgScore = userAnalyses.reduce((sum, a) => sum + a.score, 0) / userAnalyses.length;
    const recent = userAnalyses.slice(0, Math.ceil(userAnalyses.length / 3));
    const old = userAnalyses.slice(Math.ceil(userAnalyses.length * 2 / 3));

    const recentAvg = recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
    const oldAvg = old.reduce((sum, a) => sum + a.score, 0) / old.length;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvg - oldAvg > 0.2) trend = 'improving';
    else if (recentAvg - oldAvg < -0.2) trend = 'declining';

    return { trend, avgScore };
  }
}

export const sentimentAnalysisService = SentimentAnalysisService.getInstance();
