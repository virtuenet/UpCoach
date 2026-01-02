import natural from 'natural';
import compromise from 'compromise';
import * as chrono from 'chrono-node';
import { franc } from 'franc';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

interface IntentClassification {
  intent: string;
  confidence: number;
  alternativeIntents: Array<{ intent: string; confidence: number }>;
  entities: ExtractedEntity[];
}

interface ExtractedEntity {
  type: string;
  value: string;
  rawText: string;
  confidence: number;
  metadata?: any;
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  aspects: Array<{ aspect: string; sentiment: string; score: number }>;
}

interface LanguageDetectionResult {
  language: string;
  languageCode: string;
  confidence: number;
  alternativeLanguages: Array<{ language: string; confidence: number }>;
}

interface ConversationContext {
  conversationId: string;
  userId: string;
  history: ConversationTurn[];
  slots: Record<string, any>;
  lastUpdated: Date;
}

interface ConversationTurn {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  intent?: string;
  entities?: ExtractedEntity[];
}

interface NLGResult {
  text: string;
  language: string;
  template: string;
  variables: Record<string, any>;
}

interface QueryUnderstanding {
  sql: string;
  confidence: number;
  tables: string[];
  filters: Filter[];
  aggregations: string[];
  complexity: 'simple' | 'medium' | 'complex';
}

interface Filter {
  field: string;
  operator: string;
  value: any;
}

interface TopicModel {
  topics: Array<{
    id: number;
    keywords: string[];
    weight: number;
  }>;
  documentTopics: number[][];
}

interface KeywordExtraction {
  keywords: Array<{
    word: string;
    score: number;
    frequency: number;
  }>;
  phrases: Array<{
    phrase: string;
    score: number;
    frequency: number;
  }>;
}

interface TextSummary {
  summary: string;
  sentences: Array<{ text: string; score: number }>;
  compressionRatio: number;
  method: 'extractive' | 'abstractive';
}

interface NamedEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'product' | 'other';
  startIndex: number;
  endIndex: number;
  confidence: number;
}

interface RelationshipTriple {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

export class NaturalLanguageEngine extends EventEmitter {
  private redis: Redis;
  private classifier: natural.BayesClassifier;
  private intentPatterns: Map<string, RegExp[]>;
  private tfidf: typeof TfIdf;
  private conversationTTL: number = 3600; // 1 hour
  private stopWords: Set<string>;
  private languageMap: Map<string, string>;

  constructor(redisUrl: string = 'redis://localhost:6379') {
    super();
    this.redis = new Redis(redisUrl);
    this.classifier = new natural.BayesClassifier();
    this.intentPatterns = new Map();
    this.tfidf = new TfIdf();
    this.stopWords = new Set(natural.stopwords);
    this.languageMap = this.initializeLanguageMap();
    this.initializeIntentClassifier();
  }

  private initializeLanguageMap(): Map<string, string> {
    return new Map([
      ['eng', 'English'],
      ['spa', 'Spanish'],
      ['fra', 'French'],
      ['deu', 'German'],
      ['ita', 'Italian'],
      ['por', 'Portuguese'],
      ['nld', 'Dutch'],
      ['pol', 'Polish'],
      ['rus', 'Russian'],
      ['jpn', 'Japanese'],
      ['kor', 'Korean'],
      ['cmn', 'Chinese'],
      ['arb', 'Arabic'],
      ['hin', 'Hindi'],
      ['ben', 'Bengali'],
      ['vie', 'Vietnamese'],
      ['tha', 'Thai'],
      ['tur', 'Turkish'],
      ['swe', 'Swedish'],
      ['dan', 'Danish']
    ]);
  }

  private initializeIntentClassifier(): void {
    // Train classifier with sample data
    const trainingData = [
      // Goal management
      { text: 'create a new goal', intent: 'create_goal' },
      { text: 'I want to set a goal', intent: 'create_goal' },
      { text: 'add goal', intent: 'create_goal' },
      { text: 'make a new goal', intent: 'create_goal' },

      // Habit tracking
      { text: 'track my habit', intent: 'track_habit' },
      { text: 'log habit', intent: 'track_habit' },
      { text: 'record habit completion', intent: 'track_habit' },
      { text: 'mark habit as done', intent: 'track_habit' },

      // Analytics
      { text: 'show my analytics', intent: 'view_analytics' },
      { text: 'display stats', intent: 'view_analytics' },
      { text: 'what are my metrics', intent: 'view_analytics' },
      { text: 'show my progress', intent: 'view_analytics' },

      // Insights
      { text: 'give me insights', intent: 'get_insights' },
      { text: 'what insights do you have', intent: 'get_insights' },
      { text: 'show recommendations', intent: 'get_insights' },
      { text: 'tell me something interesting', intent: 'get_insights' },

      // User management
      { text: 'show users who signed up last week', intent: 'query_users' },
      { text: 'list all active users', intent: 'query_users' },
      { text: 'find users from California', intent: 'query_users' },

      // Scheduling
      { text: 'schedule meeting on Friday at 3pm', intent: 'schedule_event' },
      { text: 'book appointment for tomorrow', intent: 'schedule_event' },
      { text: 'set reminder for next Monday', intent: 'schedule_event' },

      // Reporting
      { text: 'generate monthly report', intent: 'generate_report' },
      { text: 'create revenue report', intent: 'generate_report' },
      { text: 'export user data', intent: 'generate_report' },

      // Help
      { text: 'help me', intent: 'get_help' },
      { text: 'what can you do', intent: 'get_help' },
      { text: 'how does this work', intent: 'get_help' },

      // Greeting
      { text: 'hello', intent: 'greeting' },
      { text: 'hi there', intent: 'greeting' },
      { text: 'good morning', intent: 'greeting' },

      // Farewell
      { text: 'goodbye', intent: 'farewell' },
      { text: 'bye', intent: 'farewell' },
      { text: 'see you later', intent: 'farewell' }
    ];

    trainingData.forEach(({ text, intent }) => {
      this.classifier.addDocument(text, intent);
    });

    this.classifier.train();

    // Initialize regex patterns for specific intents
    this.intentPatterns.set('create_goal', [
      /^create\s+(a\s+)?goal/i,
      /^set\s+(a\s+)?goal/i,
      /^add\s+(a\s+)?goal/i
    ]);

    this.intentPatterns.set('query_users', [
      /^(show|list|find|get)\s+users/i,
      /^users?\s+(who|that|from)/i
    ]);

    this.intentPatterns.set('schedule_event', [
      /^schedule\s+/i,
      /^book\s+/i,
      /^set\s+reminder/i
    ]);

    console.log('NLU classifier initialized with', trainingData.length, 'examples');
  }

  // Natural Language Understanding
  async classifyIntent(text: string, context?: ConversationContext): Promise<IntentClassification> {
    try {
      const normalizedText = text.toLowerCase().trim();

      // Check regex patterns first for higher accuracy
      let matchedIntent: string | null = null;
      for (const [intent, patterns] of this.intentPatterns.entries()) {
        if (patterns.some(pattern => pattern.test(normalizedText))) {
          matchedIntent = intent;
          break;
        }
      }

      // Use classifier for fallback
      const classifications = this.classifier.getClassifications(normalizedText);
      const primaryIntent = matchedIntent || classifications[0].label;
      const confidence = matchedIntent ? 0.95 : classifications[0].value;

      // Extract alternative intents
      const alternativeIntents = classifications
        .slice(1, 4)
        .map(c => ({ intent: c.label, confidence: c.value }));

      // Extract entities
      const entities = await this.extractEntities(text);

      return {
        intent: primaryIntent,
        confidence,
        alternativeIntents,
        entities
      };
    } catch (error) {
      console.error('Error classifying intent:', error);
      throw error;
    }
  }

  async extractEntities(text: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    try {
      // Extract dates using chrono
      const dates = chrono.parse(text);
      dates.forEach(date => {
        entities.push({
          type: 'date',
          value: date.start.date().toISOString(),
          rawText: date.text,
          confidence: 0.9,
          metadata: {
            start: date.start.date(),
            end: date.end?.date()
          }
        });
      });

      // Extract numbers
      const numberRegex = /\b\d+(?:\.\d+)?\b/g;
      const numbers = text.match(numberRegex);
      if (numbers) {
        numbers.forEach(num => {
          entities.push({
            type: 'number',
            value: parseFloat(num),
            rawText: num,
            confidence: 0.95
          });
        });
      }

      // Extract emails
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = text.match(emailRegex);
      if (emails) {
        emails.forEach(email => {
          entities.push({
            type: 'email',
            value: email,
            rawText: email,
            confidence: 0.98
          });
        });
      }

      // Extract using compromise for named entities
      const doc = compromise(text);

      // People
      const people = doc.people().out('array');
      people.forEach(person => {
        entities.push({
          type: 'person',
          value: person,
          rawText: person,
          confidence: 0.85
        });
      });

      // Places
      const places = doc.places().out('array');
      places.forEach(place => {
        entities.push({
          type: 'location',
          value: place,
          rawText: place,
          confidence: 0.80
        });
      });

      // Organizations
      const organizations = doc.organizations().out('array');
      organizations.forEach(org => {
        entities.push({
          type: 'organization',
          value: org,
          rawText: org,
          confidence: 0.80
        });
      });

      // Money
      const money = doc.money().out('array');
      money.forEach(amount => {
        entities.push({
          type: 'money',
          value: amount,
          rawText: amount,
          confidence: 0.90
        });
      });

      // URLs
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = text.match(urlRegex);
      if (urls) {
        urls.forEach(url => {
          entities.push({
            type: 'url',
            value: url,
            rawText: url,
            confidence: 0.99
          });
        });
      }

      // Phone numbers
      const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
      const phones = text.match(phoneRegex);
      if (phones) {
        phones.forEach(phone => {
          entities.push({
            type: 'phone',
            value: phone.replace(/[-.]g/, ''),
            rawText: phone,
            confidence: 0.90
          });
        });
      }

      return entities;
    } catch (error) {
      console.error('Error extracting entities:', error);
      return entities;
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      const analyzer = new natural.SentimentAnalyzer('English', stemmer, 'afinn');
      const tokens = tokenizer.tokenize(text);

      if (!tokens || tokens.length === 0) {
        return {
          sentiment: 'neutral',
          score: 0,
          confidence: 0,
          aspects: []
        };
      }

      const score = analyzer.getSentiment(tokens);

      let sentiment: 'positive' | 'negative' | 'neutral';
      let confidence: number;

      if (score > 0.1) {
        sentiment = 'positive';
        confidence = Math.min(Math.abs(score), 1);
      } else if (score < -0.1) {
        sentiment = 'negative';
        confidence = Math.min(Math.abs(score), 1);
      } else {
        sentiment = 'neutral';
        confidence = 1 - Math.abs(score);
      }

      // Aspect-based sentiment
      const aspects = this.extractAspectSentiment(text);

      return {
        sentiment,
        score: Math.round(score * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        aspects
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }

  private extractAspectSentiment(text: string): Array<{ aspect: string; sentiment: string; score: number }> {
    const aspects: Array<{ aspect: string; sentiment: string; score: number }> = [];
    const doc = compromise(text);

    // Common aspects to look for
    const aspectKeywords = ['product', 'service', 'support', 'price', 'quality', 'experience', 'feature'];

    aspectKeywords.forEach(aspect => {
      const sentences = text.split(/[.!?]/).filter(s => s.toLowerCase().includes(aspect));

      if (sentences.length > 0) {
        const analyzer = new natural.SentimentAnalyzer('English', stemmer, 'afinn');
        sentences.forEach(sentence => {
          const tokens = tokenizer.tokenize(sentence);
          if (tokens) {
            const score = analyzer.getSentiment(tokens);
            aspects.push({
              aspect,
              sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
              score: Math.round(score * 100) / 100
            });
          }
        });
      }
    });

    return aspects;
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      const langCode = franc(text);
      const language = this.languageMap.get(langCode) || 'Unknown';

      // franc returns 'und' for undetermined
      const confidence = langCode === 'und' ? 0 : 0.85;

      // Get alternative languages (simplified)
      const alternatives = Array.from(this.languageMap.entries())
        .filter(([code]) => code !== langCode)
        .slice(0, 3)
        .map(([code, name]) => ({
          language: name,
          confidence: 0.1
        }));

      return {
        language,
        languageCode: langCode,
        confidence,
        alternativeLanguages: alternatives
      };
    } catch (error) {
      console.error('Error detecting language:', error);
      throw error;
    }
  }

  async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    try {
      // Tokenize and remove stop words
      const tokens1 = this.processTokens(text1);
      const tokens2 = this.processTokens(text2);

      if (tokens1.length === 0 || tokens2.length === 0) {
        return 0;
      }

      // Create vocabulary
      const vocabulary = new Set([...tokens1, ...tokens2]);
      const vocabArray = Array.from(vocabulary);

      // Create vectors
      const vector1 = vocabArray.map(word => tokens1.filter(t => t === word).length);
      const vector2 = vocabArray.map(word => tokens2.filter(t => t === word).length);

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(vector1, vector2);

      return Math.round(similarity * 1000) / 1000;
    } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      throw error;
    }
  }

  private processTokens(text: string): string[] {
    const tokens = tokenizer.tokenize(text.toLowerCase());
    if (!tokens) return [];

    return tokens
      .filter(token => !this.stopWords.has(token))
      .map(token => stemmer.stem(token));
  }

  private cosineSimilarity(vector1: number[], vector2: number[]): number {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  // Natural Language Generation
  async generateReport(data: any, reportType: string, language: string = 'en'): Promise<NLGResult> {
    try {
      const templates = this.getReportTemplates(language);
      const template = templates[reportType] || templates.default;

      let text = template;
      const variables: Record<string, any> = {};

      // Replace variables in template
      switch (reportType) {
        case 'analytics':
          variables.totalUsers = data.totalUsers || 0;
          variables.activeUsers = data.activeUsers || 0;
          variables.growthRate = data.growthRate || 0;
          text = template
            .replace('{totalUsers}', variables.totalUsers)
            .replace('{activeUsers}', variables.activeUsers)
            .replace('{growthRate}', variables.growthRate);
          break;

        case 'revenue':
          variables.revenue = data.revenue || 0;
          variables.mrr = data.mrr || 0;
          variables.change = data.change || 0;
          text = template
            .replace('{revenue}', this.formatCurrency(variables.revenue))
            .replace('{mrr}', this.formatCurrency(variables.mrr))
            .replace('{change}', variables.change);
          break;

        case 'engagement':
          variables.dau = data.dau || 0;
          variables.mau = data.mau || 0;
          variables.sessionDuration = data.sessionDuration || 0;
          text = template
            .replace('{dau}', variables.dau)
            .replace('{mau}', variables.mau)
            .replace('{sessionDuration}', Math.round(variables.sessionDuration));
          break;

        default:
          text = 'Report generated successfully with the provided data.';
      }

      return {
        text,
        language,
        template: reportType,
        variables
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  private getReportTemplates(language: string): Record<string, string> {
    const templates: Record<string, Record<string, string>> = {
      en: {
        analytics: 'Analytics Summary: You have {totalUsers} total users, with {activeUsers} active users. This represents a {growthRate}% growth rate.',
        revenue: 'Revenue Report: Total revenue is {revenue}, with MRR at {mrr}. This is a {change}% change from last period.',
        engagement: 'Engagement Metrics: Daily active users: {dau}, Monthly active users: {mau}, Average session duration: {sessionDuration} minutes.',
        default: 'Report generated with the following data.'
      },
      es: {
        analytics: 'Resumen de Análisis: Tienes {totalUsers} usuarios totales, con {activeUsers} usuarios activos. Esto representa una tasa de crecimiento del {growthRate}%.',
        default: 'Informe generado con los siguientes datos.'
      }
    };

    return templates[language] || templates.en;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  async composeEmail(recipient: string, purpose: string, data: any): Promise<NLGResult> {
    try {
      const templates = this.getEmailTemplates();
      const template = templates[purpose] || templates.default;

      const variables = {
        recipientName: data.recipientName || recipient,
        senderName: data.senderName || 'The Team',
        ...data
      };

      let text = template;
      for (const [key, value] of Object.entries(variables)) {
        text = text.replace(new RegExp(`{${key}}`, 'g'), String(value));
      }

      return {
        text,
        language: 'en',
        template: purpose,
        variables
      };
    } catch (error) {
      console.error('Error composing email:', error);
      throw error;
    }
  }

  private getEmailTemplates(): Record<string, string> {
    return {
      welcome: `Dear {recipientName},\n\nWelcome to our platform! We're excited to have you on board.\n\nTo get started, please complete your profile and explore our features.\n\nBest regards,\n{senderName}`,

      notification: `Hi {recipientName},\n\nWe wanted to notify you about: {message}\n\nIf you have any questions, feel free to reach out.\n\nBest,\n{senderName}`,

      reminder: `Hello {recipientName},\n\nThis is a friendly reminder about: {reminderText}\n\nPlease take action at your earliest convenience.\n\nRegards,\n{senderName}`,

      report: `Dear {recipientName},\n\nPlease find your {reportType} report attached.\n\nKey highlights:\n{highlights}\n\nBest regards,\n{senderName}`,

      default: `Hi {recipientName},\n\n{message}\n\nBest regards,\n{senderName}`
    };
  }

  async generateChartNarrative(chartData: any, chartType: string): Promise<string> {
    try {
      const narratives: string[] = [];

      switch (chartType) {
        case 'line':
          const trend = this.analyzeTrend(chartData.values);
          narratives.push(`The data shows a ${trend} trend over the time period.`);

          const maxValue = Math.max(...chartData.values);
          const minValue = Math.min(...chartData.values);
          const maxIndex = chartData.values.indexOf(maxValue);
          const minIndex = chartData.values.indexOf(minValue);

          narratives.push(`The highest point (${maxValue}) occurred at ${chartData.labels[maxIndex]}.`);
          narratives.push(`The lowest point (${minValue}) occurred at ${chartData.labels[minIndex]}.`);

          const avgValue = chartData.values.reduce((a: number, b: number) => a + b, 0) / chartData.values.length;
          narratives.push(`The average value is ${Math.round(avgValue * 100) / 100}.`);
          break;

        case 'bar':
          const sortedIndices = chartData.values
            .map((v: number, i: number) => ({ value: v, index: i }))
            .sort((a: any, b: any) => b.value - a.value);

          narratives.push(`${chartData.labels[sortedIndices[0].index]} has the highest value at ${sortedIndices[0].value}.`);
          narratives.push(`${chartData.labels[sortedIndices[sortedIndices.length - 1].index]} has the lowest value at ${sortedIndices[sortedIndices.length - 1].value}.`);
          break;

        case 'pie':
          const total = chartData.values.reduce((a: number, b: number) => a + b, 0);
          const percentages = chartData.values.map((v: number) => (v / total) * 100);

          const largestSegmentIndex = percentages.indexOf(Math.max(...percentages));
          narratives.push(`${chartData.labels[largestSegmentIndex]} represents the largest segment at ${Math.round(percentages[largestSegmentIndex])}% of the total.`);
          break;
      }

      return narratives.join(' ');
    } catch (error) {
      console.error('Error generating chart narrative:', error);
      throw error;
    }
  }

  private analyzeTrend(values: number[]): string {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  async summarizeInsights(insights: any[]): Promise<string[]> {
    const summaries: string[] = [];

    insights.forEach(insight => {
      let summary = '';

      switch (insight.type) {
        case 'trend':
          summary = `${insight.metric} is ${insight.direction} by ${insight.percentage}%`;
          break;
        case 'anomaly':
          summary = `Unusual ${insight.metric} detected: ${insight.value} (${insight.deviation}% deviation)`;
          break;
        case 'prediction':
          summary = `${insight.metric} is predicted to reach ${insight.predictedValue} by ${insight.timeframe}`;
          break;
        case 'recommendation':
          summary = `Recommendation: ${insight.action} to improve ${insight.metric}`;
          break;
        default:
          summary = insight.description || 'Insight available';
      }

      summaries.push(summary);
    });

    return summaries;
  }

  // Conversational AI
  async processConversation(
    conversationId: string,
    userId: string,
    userInput: string
  ): Promise<{ response: string; intent: string; context: ConversationContext }> {
    try {
      // Get or create conversation context
      let context = await this.getConversationContext(conversationId);

      if (!context) {
        context = {
          conversationId,
          userId,
          history: [],
          slots: {},
          lastUpdated: new Date()
        };
      }

      // Classify intent
      const classification = await this.classifyIntent(userInput, context);

      // Add user turn to history
      context.history.push({
        role: 'user',
        text: userInput,
        timestamp: new Date(),
        intent: classification.intent,
        entities: classification.entities
      });

      // Extract slots
      this.fillSlots(context, classification.entities);

      // Generate response
      const response = await this.generateResponse(classification, context);

      // Add assistant turn to history
      context.history.push({
        role: 'assistant',
        text: response,
        timestamp: new Date()
      });

      // Keep only last 5 turns
      if (context.history.length > 10) {
        context.history = context.history.slice(-10);
      }

      context.lastUpdated = new Date();

      // Save context
      await this.saveConversationContext(context);

      return {
        response,
        intent: classification.intent,
        context
      };
    } catch (error) {
      console.error('Error processing conversation:', error);
      throw error;
    }
  }

  private async getConversationContext(conversationId: string): Promise<ConversationContext | null> {
    const data = await this.redis.get(`conversation:${conversationId}`);
    return data ? JSON.parse(data) : null;
  }

  private async saveConversationContext(context: ConversationContext): Promise<void> {
    await this.redis.setex(
      `conversation:${context.conversationId}`,
      this.conversationTTL,
      JSON.stringify(context)
    );
  }

  private fillSlots(context: ConversationContext, entities: ExtractedEntity[]): void {
    entities.forEach(entity => {
      context.slots[entity.type] = entity.value;
    });
  }

  private async generateResponse(classification: IntentClassification, context: ConversationContext): Promise<string> {
    const responses: Record<string, string> = {
      greeting: "Hello! How can I assist you today?",
      farewell: "Goodbye! Have a great day!",
      get_help: "I can help you with goals, habits, analytics, and insights. What would you like to do?",
      create_goal: this.generateGoalResponse(context),
      track_habit: "I'll help you track your habit. Which habit would you like to log?",
      view_analytics: "Let me show you your analytics. What time period are you interested in?",
      get_insights: "Here are some insights based on your activity...",
      query_users: this.generateQueryResponse(context),
      schedule_event: this.generateScheduleResponse(context),
      generate_report: "I'll generate a report for you. What type of report would you like?",
      default: "I understand. How can I help you with that?"
    };

    return responses[classification.intent] || responses.default;
  }

  private generateGoalResponse(context: ConversationContext): string {
    if (context.slots.goal_name) {
      return `Great! I'll help you create a goal called "${context.slots.goal_name}". What's the target date?`;
    }
    return "I'll help you create a new goal. What would you like to call it?";
  }

  private generateQueryResponse(context: ConversationContext): string {
    if (context.slots.date) {
      return `I'll find users from ${context.slots.date}. What other criteria would you like to apply?`;
    }
    return "I can help you query users. What criteria are you looking for?";
  }

  private generateScheduleResponse(context: ConversationContext): string {
    if (context.slots.date && context.slots.time) {
      return `I'll schedule that for ${context.slots.date} at ${context.slots.time}. Shall I confirm?`;
    } else if (context.slots.date) {
      return `Got it, ${context.slots.date}. What time would you prefer?`;
    }
    return "I'll help you schedule that. When would you like to schedule it?";
  }

  // Query Understanding
  async parseNaturalLanguageQuery(query: string): Promise<QueryUnderstanding> {
    try {
      const doc = compromise(query);

      const tables: string[] = [];
      const filters: Filter[] = [];
      const aggregations: string[] = [];

      // Detect table references
      if (query.toLowerCase().includes('user')) tables.push('users');
      if (query.toLowerCase().includes('goal')) tables.push('goals');
      if (query.toLowerCase().includes('habit')) tables.push('habits');
      if (query.toLowerCase().includes('session')) tables.push('sessions');

      // Extract date filters
      const dates = chrono.parse(query);
      if (dates.length > 0) {
        const date = dates[0];
        filters.push({
          field: 'created_at',
          operator: '>=',
          value: date.start.date()
        });
      }

      // Detect aggregations
      if (query.toLowerCase().includes('count')) aggregations.push('COUNT');
      if (query.toLowerCase().includes('sum')) aggregations.push('SUM');
      if (query.toLowerCase().includes('average') || query.toLowerCase().includes('avg')) aggregations.push('AVG');
      if (query.toLowerCase().includes('max')) aggregations.push('MAX');
      if (query.toLowerCase().includes('min')) aggregations.push('MIN');

      // Detect location filters
      const places = doc.places().out('array');
      if (places.length > 0) {
        filters.push({
          field: 'location',
          operator: '=',
          value: places[0]
        });
      }

      // Generate SQL
      const sql = this.generateSQL(tables, filters, aggregations);

      // Determine complexity
      let complexity: 'simple' | 'medium' | 'complex';
      if (filters.length > 3 || aggregations.length > 2 || tables.length > 2) {
        complexity = 'complex';
      } else if (filters.length > 1 || aggregations.length > 0) {
        complexity = 'medium';
      } else {
        complexity = 'simple';
      }

      return {
        sql,
        confidence: 0.75,
        tables,
        filters,
        aggregations,
        complexity
      };
    } catch (error) {
      console.error('Error parsing natural language query:', error);
      throw error;
    }
  }

  private generateSQL(tables: string[], filters: Filter[], aggregations: string[]): string {
    if (tables.length === 0) tables = ['users'];

    let sql = 'SELECT ';

    if (aggregations.length > 0) {
      sql += aggregations.map(agg => `${agg}(*)`).join(', ');
    } else {
      sql += '*';
    }

    sql += ` FROM ${tables[0]}`;

    if (filters.length > 0) {
      sql += ' WHERE ';
      sql += filters.map(f => {
        if (f.value instanceof Date) {
          return `${f.field} ${f.operator} '${f.value.toISOString()}'`;
        }
        return `${f.field} ${f.operator} '${f.value}'`;
      }).join(' AND ');
    }

    sql += ';';

    return sql;
  }

  // Text Analytics
  async extractKeywords(text: string, topN: number = 10): Promise<KeywordExtraction> {
    try {
      // TF-IDF for keywords
      this.tfidf.addDocument(text);

      const keywords: Array<{ word: string; score: number; frequency: number }> = [];
      const wordFreq = new Map<string, number>();

      this.tfidf.listTerms(0).forEach(item => {
        keywords.push({
          word: item.term,
          score: item.tfidf,
          frequency: text.toLowerCase().split(item.term).length - 1
        });
        wordFreq.set(item.term, text.toLowerCase().split(item.term).length - 1);
      });

      // RAKE for phrases
      const phrases = this.extractPhrasesRAKE(text, topN);

      return {
        keywords: keywords.slice(0, topN),
        phrases
      };
    } catch (error) {
      console.error('Error extracting keywords:', error);
      throw error;
    }
  }

  private extractPhrasesRAKE(text: string, topN: number): Array<{ phrase: string; score: number; frequency: number }> {
    const sentences = text.split(/[.!?;]/);
    const phrases: Array<{ phrase: string; score: number; frequency: number }> = [];

    const wordScores = new Map<string, number>();
    const wordFreq = new Map<string, number>();

    sentences.forEach(sentence => {
      const words = tokenizer.tokenize(sentence.toLowerCase()) || [];
      const filteredWords = words.filter(w => !this.stopWords.has(w));

      filteredWords.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });
    });

    // Calculate word scores (degree / frequency)
    wordFreq.forEach((freq, word) => {
      wordScores.set(word, freq); // Simplified scoring
    });

    // Extract candidate phrases
    sentences.forEach(sentence => {
      const words = tokenizer.tokenize(sentence.toLowerCase()) || [];
      let phraseWords: string[] = [];

      words.forEach(word => {
        if (!this.stopWords.has(word)) {
          phraseWords.push(word);
        } else {
          if (phraseWords.length > 1) {
            const phrase = phraseWords.join(' ');
            const score = phraseWords.reduce((sum, w) => sum + (wordScores.get(w) || 0), 0);
            phrases.push({
              phrase,
              score,
              frequency: 1
            });
          }
          phraseWords = [];
        }
      });
    });

    // Aggregate phrases
    const phraseMap = new Map<string, { score: number; frequency: number }>();
    phrases.forEach(p => {
      if (phraseMap.has(p.phrase)) {
        const existing = phraseMap.get(p.phrase)!;
        phraseMap.set(p.phrase, {
          score: existing.score,
          frequency: existing.frequency + 1
        });
      } else {
        phraseMap.set(p.phrase, { score: p.score, frequency: 1 });
      }
    });

    const result = Array.from(phraseMap.entries())
      .map(([phrase, data]) => ({
        phrase,
        score: data.score * data.frequency,
        frequency: data.frequency
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    return result;
  }

  async summarizeText(text: string, sentenceCount: number = 3): Promise<TextSummary> {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

      if (sentences.length <= sentenceCount) {
        return {
          summary: text,
          sentences: sentences.map(s => ({ text: s.trim(), score: 1 })),
          compressionRatio: 1,
          method: 'extractive'
        };
      }

      // Score sentences using TF-IDF
      const sentenceScores: Array<{ text: string; score: number }> = [];

      sentences.forEach(sentence => {
        this.tfidf.addDocument(sentence);
      });

      sentences.forEach((sentence, index) => {
        const terms = this.tfidf.listTerms(index);
        const score = terms.reduce((sum, term) => sum + term.tfidf, 0);
        sentenceScores.push({ text: sentence.trim(), score });
      });

      // Select top sentences
      const topSentences = sentenceScores
        .sort((a, b) => b.score - a.score)
        .slice(0, sentenceCount);

      // Maintain original order
      const orderedSentences = topSentences.sort((a, b) => {
        return sentences.indexOf(a.text) - sentences.indexOf(b.text);
      });

      const summary = orderedSentences.map(s => s.text).join('. ') + '.';
      const compressionRatio = summary.length / text.length;

      return {
        summary,
        sentences: topSentences,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        method: 'extractive'
      };
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw error;
    }
  }

  async extractNamedEntities(text: string): Promise<NamedEntity[]> {
    const entities: NamedEntity[] = [];
    const doc = compromise(text);

    // People
    doc.people().forEach((person: any) => {
      entities.push({
        text: person.text(),
        type: 'person',
        startIndex: text.indexOf(person.text()),
        endIndex: text.indexOf(person.text()) + person.text().length,
        confidence: 0.85
      });
    });

    // Organizations
    doc.organizations().forEach((org: any) => {
      entities.push({
        text: org.text(),
        type: 'organization',
        startIndex: text.indexOf(org.text()),
        endIndex: text.indexOf(org.text()) + org.text().length,
        confidence: 0.80
      });
    });

    // Places
    doc.places().forEach((place: any) => {
      entities.push({
        text: place.text(),
        type: 'location',
        startIndex: text.indexOf(place.text()),
        endIndex: text.indexOf(place.text()) + place.text().length,
        confidence: 0.80
      });
    });

    // Dates
    const dates = chrono.parse(text);
    dates.forEach(date => {
      entities.push({
        text: date.text,
        type: 'date',
        startIndex: date.index,
        endIndex: date.index + date.text.length,
        confidence: 0.90
      });
    });

    return entities;
  }

  async extractRelationships(text: string): Promise<RelationshipTriple[]> {
    const relationships: RelationshipTriple[] = [];
    const doc = compromise(text);

    const sentences = doc.sentences().out('array');

    sentences.forEach(sentence => {
      const sentDoc = compromise(sentence);

      const subjects = sentDoc.match('#Noun').out('array');
      const verbs = sentDoc.verbs().out('array');
      const objects = sentDoc.match('#Noun').out('array');

      if (subjects.length > 0 && verbs.length > 0 && objects.length > 1) {
        relationships.push({
          subject: subjects[0],
          predicate: verbs[0],
          object: objects[1],
          confidence: 0.70
        });
      }
    });

    return relationships;
  }

  async shutdown(): Promise<void> {
    await this.redis.quit();
    console.log('Natural Language Engine shut down');
  }
}

export default NaturalLanguageEngine;
