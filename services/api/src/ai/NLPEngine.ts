import { EventEmitter } from 'events';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface SentimentResult {
  score: number; // -1 (very negative) to 1 (very positive)
  magnitude: number; // 0 to infinity (strength of emotion)
  label: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    confidence: number;
    frustration: number;
  };
}

export interface Intent {
  name: string;
  confidence: number;
  parameters: Record<string, any>;
}

export interface Entity {
  type: 'goal' | 'habit' | 'date' | 'time' | 'number' | 'person' | 'emotion' | 'action';
  value: string;
  normalized?: any;
  confidence: number;
  position: { start: number; end: number };
}

export interface TextSummary {
  original: string;
  summary: string;
  keyPoints: string[];
  wordCount: { original: number; summary: number };
  compressionRatio: number;
}

export interface Token {
  text: string;
  stem: string;
  pos?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'other';
  stopword: boolean;
}

export interface NLPAnalysis {
  text: string;
  sentiment: SentimentResult;
  intents: Intent[];
  entities: Entity[];
  tokens: Token[];
  language: string;
  keywords: string[];
  analyzedAt: Date;
}

// ============================================================================
// NLP ENGINE
// ============================================================================

export class NLPEngine extends EventEmitter {
  private static instance: NLPEngine;

  // VADER-like lexicons
  private positiveWords = new Map<string, number>([
    ['amazing', 0.9], ['awesome', 0.9], ['excellent', 0.8], ['fantastic', 0.9],
    ['great', 0.7], ['wonderful', 0.8], ['perfect', 0.9], ['love', 0.8],
    ['happy', 0.7], ['excited', 0.8], ['proud', 0.8], ['accomplished', 0.7],
    ['success', 0.7], ['achieved', 0.7], ['progress', 0.6], ['better', 0.5],
    ['good', 0.5], ['nice', 0.4], ['glad', 0.6], ['grateful', 0.7],
    ['blessed', 0.7], ['fortunate', 0.6], ['confident', 0.7], ['motivated', 0.8],
    ['inspired', 0.7], ['energized', 0.7], ['optimistic', 0.7], ['hopeful', 0.6],
  ]);

  private negativeWords = new Map<string, number>([
    ['terrible', -0.9], ['awful', -0.9], ['horrible', -0.9], ['hate', -0.8],
    ['frustrated', -0.7], ['angry', -0.7], ['sad', -0.6], ['depressed', -0.8],
    ['struggling', -0.6], ['difficult', -0.5], ['hard', -0.4], ['stuck', -0.6],
    ['failed', -0.7], ['failure', -0.7], ['quit', -0.8], ['give up', -0.9],
    ['hopeless', -0.9], ['worthless', -0.9], ['useless', -0.8], ['lost', -0.6],
    ['worried', -0.5], ['anxious', -0.6], ['nervous', -0.5], ['afraid', -0.6],
    ['scared', -0.6], ['disappointed', -0.6], ['upset', -0.6], ['bad', -0.5],
  ]);

  // Intensifiers and dampeners
  private intensifiers = new Set(['very', 'extremely', 'incredibly', 'absolutely', 'really', 'so', 'totally']);
  private dampeners = new Set(['barely', 'hardly', 'somewhat', 'slightly', 'kind of', 'sort of']);
  private negations = new Set(['not', 'no', 'never', 'neither', 'nobody', "n't", 'nothing']);

  // Stopwords for filtering
  private stopwords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'i', 'you', 'we', 'they', 'my', 'your',
  ]);

  // Intent patterns for coaching domain
  private intentPatterns: Array<{ pattern: RegExp; name: string; extractor?: (match: RegExpMatchArray) => Record<string, any> }> = [
    {
      pattern: /(?:set|create|start|begin|add)\s+(?:a\s+)?(?:new\s+)?goal\s+(?:to\s+)?(.+)/i,
      name: 'create_goal',
      extractor: (m) => ({ goalDescription: m[1].trim() }),
    },
    {
      pattern: /(?:track|log|record)\s+(?:my\s+)?(.+?)(?:\s+habit|\s+routine)?/i,
      name: 'track_habit',
      extractor: (m) => ({ habitName: m[1].trim() }),
    },
    {
      pattern: /how\s+(?:am\s+i|did\s+i)\s+do(?:ing)?/i,
      name: 'check_progress',
    },
    {
      pattern: /(?:i\s+)?(?:completed?|finished|done)\s+(?:my\s+)?(.+)/i,
      name: 'complete_task',
      extractor: (m) => ({ taskDescription: m[1].trim() }),
    },
    {
      pattern: /(?:feeling|feel)\s+(sad|happy|frustrated|motivated|anxious|confident|stressed|overwhelmed)/i,
      name: 'log_mood',
      extractor: (m) => ({ mood: m[1].toLowerCase() }),
    },
    {
      pattern: /(?:help|assist|support)\s+(?:me\s+)?(?:with\s+)?(.+)/i,
      name: 'request_help',
      extractor: (m) => ({ topic: m[1].trim() }),
    },
    {
      pattern: /(?:motivate|inspire|encourage)\s+me/i,
      name: 'request_motivation',
    },
    {
      pattern: /what\s+should\s+i\s+(?:do|work on)/i,
      name: 'request_recommendation',
    },
    {
      pattern: /(?:remind|notification)\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{4}))?/i,
      name: 'set_reminder',
      extractor: (m) => ({ task: m[1].trim(), time: m[2] || null }),
    },
    {
      pattern: /(?:show|view|see)\s+(?:my\s+)?(?:stats|statistics|analytics|progress)/i,
      name: 'view_analytics',
    },
  ];

  // Simple stemming rules
  private stemmingRules = [
    { pattern: /ies$/, replacement: 'y' },
    { pattern: /es$/, replacement: 'e' },
    { pattern: /s$/, replacement: '' },
    { pattern: /ed$/, replacement: '' },
    { pattern: /ing$/, replacement: '' },
  ];

  private constructor() {
    super();
  }

  static getInstance(): NLPEngine {
    if (!NLPEngine.instance) {
      NLPEngine.instance = new NLPEngine();
    }
    return NLPEngine.instance;
  }

  // ============================================================================
  // MAIN ANALYSIS METHOD
  // ============================================================================

  async analyze(text: string): Promise<NLPAnalysis> {
    const startTime = Date.now();

    const [sentiment, intents, entities, tokens] = await Promise.all([
      this.analyzeSentiment(text),
      this.recognizeIntents(text),
      this.extractEntities(text),
      this.tokenize(text),
    ]);

    const keywords = this.extractKeywords(tokens);
    const language = this.detectLanguage(text);

    const analysis: NLPAnalysis = {
      text,
      sentiment,
      intents,
      entities,
      tokens,
      language,
      keywords,
      analyzedAt: new Date(),
    };

    const duration = Date.now() - startTime;
    this.emit('analysis:completed', { analysis, duration });

    return analysis;
  }

  // ============================================================================
  // SENTIMENT ANALYSIS (VADER-like algorithm)
  // ============================================================================

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const tokens = text.toLowerCase().split(/\s+/);
    let totalScore = 0;
    let magnitude = 0;

    const emotions = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      confidence: 0,
      frustration: 0,
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let score = 0;

      // Check positive words
      if (this.positiveWords.has(token)) {
        score = this.positiveWords.get(token)!;
        emotions.joy += score;
        emotions.confidence += score * 0.5;
      }

      // Check negative words
      if (this.negativeWords.has(token)) {
        score = this.negativeWords.get(token)!;
        emotions.sadness += Math.abs(score) * 0.5;
        emotions.frustration += Math.abs(score) * 0.3;
      }

      // Emotion-specific detection
      if (['angry', 'furious', 'mad'].includes(token)) {
        emotions.anger += 0.8;
      }
      if (['afraid', 'scared', 'terrified', 'anxious', 'worried'].includes(token)) {
        emotions.fear += 0.7;
      }

      // Apply intensifiers (look back one token)
      if (i > 0 && this.intensifiers.has(tokens[i - 1])) {
        score *= 1.5;
      }

      // Apply dampeners
      if (i > 0 && this.dampeners.has(tokens[i - 1])) {
        score *= 0.5;
      }

      // Apply negations (look back 1-3 tokens)
      for (let j = 1; j <= 3 && i - j >= 0; j++) {
        if (this.negations.has(tokens[i - j])) {
          score *= -0.74; // VADER-like negation factor
          break;
        }
      }

      totalScore += score;
      magnitude += Math.abs(score);
    }

    // Normalize scores
    const normalizedScore = Math.max(-1, Math.min(1, totalScore / Math.max(tokens.length, 1)));

    // Normalize emotions to 0-1 range
    const maxEmotion = Math.max(...Object.values(emotions), 1);
    Object.keys(emotions).forEach(key => {
      emotions[key as keyof typeof emotions] = Math.min(1, emotions[key as keyof typeof emotions] / maxEmotion);
    });

    // Apply punctuation boosts
    if (text.includes('!')) magnitude *= 1.292; // VADER constant
    if (text.includes('?')) magnitude *= 1.18;
    if (text.match(/[!?]{2,}/)) magnitude *= 1.5;
    if (text === text.toUpperCase() && text.length > 3) magnitude *= 1.5; // ALL CAPS

    const label = this.getSentimentLabel(normalizedScore);

    return {
      score: normalizedScore,
      magnitude,
      label,
      emotions,
    };
  }

  private getSentimentLabel(score: number): SentimentResult['label'] {
    if (score >= 0.6) return 'very_positive';
    if (score >= 0.2) return 'positive';
    if (score <= -0.6) return 'very_negative';
    if (score <= -0.2) return 'negative';
    return 'neutral';
  }

  // ============================================================================
  // INTENT RECOGNITION
  // ============================================================================

  async recognizeIntents(text: string): Promise<Intent[]> {
    const intents: Intent[] = [];

    for (const { pattern, name, extractor } of this.intentPatterns) {
      const match = text.match(pattern);
      if (match) {
        const parameters = extractor ? extractor(match) : {};
        const confidence = this.calculateIntentConfidence(match, text);

        intents.push({
          name,
          confidence,
          parameters,
        });
      }
    }

    // Sort by confidence
    intents.sort((a, b) => b.confidence - a.confidence);

    return intents;
  }

  private calculateIntentConfidence(match: RegExpMatchArray, text: string): number {
    // Base confidence on match quality
    const matchLength = match[0].length;
    const textLength = text.length;
    const coverage = matchLength / textLength;

    // Higher confidence for matches that cover more of the text
    return Math.min(0.95, 0.5 + coverage * 0.5);
  }

  // ============================================================================
  // ENTITY EXTRACTION
  // ============================================================================

  async extractEntities(text: string): Promise<Entity[]> {
    const entities: Entity[] = [];

    // Extract dates
    const datePatterns = [
      /\b(today|tomorrow|yesterday)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
    ];

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'date',
          value: match[0],
          normalized: this.normalizeDate(match[0]),
          confidence: 0.9,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    });

    // Extract times
    const timePattern = /\b(\d{1,2}):?(\d{2})?\s*(am|pm)?\b/gi;
    let match;
    while ((match = timePattern.exec(text)) !== null) {
      entities.push({
        type: 'time',
        value: match[0],
        normalized: this.normalizeTime(match[0]),
        confidence: 0.85,
        position: { start: match.index, end: match.index + match[0].length },
      });
    }

    // Extract numbers
    const numberPattern = /\b(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?|km|miles?|minutes?|hours?|days?|weeks?|months?)?\b/gi;
    while ((match = numberPattern.exec(text)) !== null) {
      entities.push({
        type: 'number',
        value: match[0],
        normalized: { value: parseFloat(match[1]), unit: match[2] || null },
        confidence: 0.95,
        position: { start: match.index, end: match.index + match[0].length },
      });
    }

    // Extract emotions
    const emotionWords = ['happy', 'sad', 'angry', 'frustrated', 'motivated', 'confident', 'anxious', 'excited', 'stressed'];
    emotionWords.forEach(emotion => {
      const regex = new RegExp(`\\b${emotion}\\b`, 'gi');
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type: 'emotion',
          value: match[0],
          confidence: 0.8,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    });

    // Extract action verbs
    const actionVerbs = ['run', 'exercise', 'meditate', 'read', 'write', 'work', 'study', 'practice', 'complete'];
    actionVerbs.forEach(action => {
      const regex = new RegExp(`\\b${action}(?:ing|ed|s)?\\b`, 'gi');
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type: 'action',
          value: match[0],
          confidence: 0.7,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    });

    return entities;
  }

  private normalizeDate(dateStr: string): Date {
    const lower = dateStr.toLowerCase();
    const now = new Date();

    if (lower === 'today') return now;
    if (lower === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    if (lower === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }

    // Try to parse as date
    return new Date(dateStr);
  }

  private normalizeTime(timeStr: string): { hour: number; minute: number } {
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (!match) return { hour: 0, minute: 0 };

    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    return { hour, minute };
  }

  // ============================================================================
  // TOKENIZATION & STEMMING
  // ============================================================================

  async tokenize(text: string): Promise<Token[]> {
    // Simple word tokenization
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];

    return words.map(word => ({
      text: word,
      stem: this.stem(word),
      stopword: this.stopwords.has(word),
    }));
  }

  private stem(word: string): string {
    let stemmed = word;

    for (const { pattern, replacement } of this.stemmingRules) {
      if (pattern.test(stemmed)) {
        stemmed = stemmed.replace(pattern, replacement);
        break;
      }
    }

    return stemmed;
  }

  // ============================================================================
  // TEXT SUMMARIZATION (Extractive)
  // ============================================================================

  async summarize(text: string, maxSentences: number = 3): Promise<TextSummary> {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    if (sentences.length <= maxSentences) {
      return {
        original: text,
        summary: text,
        keyPoints: sentences.map(s => s.trim()),
        wordCount: { original: text.split(/\s+/).length, summary: text.split(/\s+/).length },
        compressionRatio: 1,
      };
    }

    // Score sentences based on keyword frequency
    const tokens = await this.tokenize(text);
    const keywords = this.extractKeywords(tokens);
    const keywordSet = new Set(keywords);

    const scoredSentences = sentences.map(sentence => {
      const sentenceTokens = sentence.toLowerCase().match(/\b\w+\b/g) || [];
      const score = sentenceTokens.filter(t => keywordSet.has(t)).length;
      return { sentence, score };
    });

    // Sort by score and take top sentences
    scoredSentences.sort((a, b) => b.score - a.score);
    const topSentences = scoredSentences.slice(0, maxSentences);

    // Restore original order
    const selectedIndices = topSentences.map(s => sentences.indexOf(s.sentence));
    selectedIndices.sort((a, b) => a - b);
    const summaryText = selectedIndices.map(i => sentences[i].trim()).join(' ');

    const originalWordCount = text.split(/\s+/).length;
    const summaryWordCount = summaryText.split(/\s+/).length;

    return {
      original: text,
      summary: summaryText,
      keyPoints: topSentences.map(s => s.sentence.trim()),
      wordCount: { original: originalWordCount, summary: summaryWordCount },
      compressionRatio: summaryWordCount / originalWordCount,
    };
  }

  // ============================================================================
  // KEYWORD EXTRACTION
  // ============================================================================

  private extractKeywords(tokens: Token[], topN: number = 10): string[] {
    // Filter out stopwords and count frequency
    const frequency = new Map<string, number>();

    tokens.forEach(token => {
      if (!token.stopword && token.text.length > 3) {
        const stem = token.stem;
        frequency.set(stem, (frequency.get(stem) || 0) + 1);
      }
    });

    // Sort by frequency
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);

    return sorted.map(([word]) => word);
  }

  // ============================================================================
  // LANGUAGE DETECTION (Simple)
  // ============================================================================

  private detectLanguage(text: string): string {
    // Very simple detection based on common words
    const englishWords = ['the', 'is', 'and', 'to', 'a', 'of', 'that', 'in', 'it', 'you'];
    const words = text.toLowerCase().split(/\s+/);

    const englishCount = words.filter(w => englishWords.includes(w)).length;
    const confidence = englishCount / Math.min(words.length, englishWords.length);

    return confidence > 0.3 ? 'en' : 'unknown';
  }

  // ============================================================================
  // TRANSLATION SUPPORT (Placeholder - would integrate with external API)
  // ============================================================================

  async translate(text: string, targetLanguage: string): Promise<string> {
    // Placeholder - would integrate with Google Translate API, DeepL, etc.
    this.emit('translation:requested', { text, targetLanguage });

    // Return original text for now
    return text;
  }
}

export const nlpEngine = NLPEngine.getInstance();
