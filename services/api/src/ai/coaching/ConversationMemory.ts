import { EventEmitter } from 'events';

// Conversation Memory - Long-term conversation memory and context management (~400 LOC)

interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  embedding?: number[];
}

interface ConversationSummary {
  conversationId: string;
  summary: string;
  keyTopics: string[];
  entities: Array<{ type: string; value: string }>;
  sentiment: 'positive' | 'negative' | 'neutral';
  createdAt: Date;
}

interface VectorSearchResult {
  message: Message;
  score: number;
}

export class ConversationMemory extends EventEmitter {
  private messages: Map<string, Message[]> = new Map();
  private summaries: Map<string, ConversationSummary> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private readonly maxMessagesBeforeSummary = 20;

  constructor() {
    super();
  }

  async storeMessage(message: Message): Promise<void> {
    console.log(
      `[ConversationMemory] Storing message ${message.id} for conversation ${message.conversationId}`
    );

    // Store message
    const conversationMessages =
      this.messages.get(message.conversationId) || [];
    conversationMessages.push(message);
    this.messages.set(message.conversationId, conversationMessages);

    // Generate and store embedding
    const embedding = await this.generateEmbedding(message.content);
    this.embeddings.set(message.id, embedding);
    message.embedding = embedding;

    // Check if we should summarize
    if (this.shouldSummarize(message.conversationId)) {
      await this.summarizeConversation(message.conversationId);
    }

    this.emit('message:stored', message);
  }

  private shouldSummarize(conversationId: string): boolean {
    const messages = this.messages.get(conversationId) || [];
    return messages.length >= this.maxMessagesBeforeSummary;
  }

  async summarizeConversation(conversationId: string): Promise<void> {
    console.log(
      `[ConversationMemory] Summarizing conversation ${conversationId}`
    );

    const messages = this.messages.get(conversationId) || [];
    const fullText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    // Use AI to generate summary (simplified)
    const summary: ConversationSummary = {
      conversationId,
      summary: this.generateSummary(fullText),
      keyTopics: this.extractKeyTopics(fullText),
      entities: this.extractEntities(fullText),
      sentiment: this.analyzeSentiment(fullText),
      createdAt: new Date(),
    };

    this.summaries.set(conversationId, summary);

    // Compress old messages (keep only recent 10)
    const recentMessages = messages.slice(-10);
    this.messages.set(conversationId, recentMessages);

    this.emit('conversation:summarized', summary);
  }

  private generateSummary(text: string): string {
    // In production, use GPT-3.5 for summarization
    const sentences = text.split('. ').slice(0, 3);
    return sentences.join('. ') + '.';
  }

  private extractKeyTopics(text: string): string[] {
    // Simple keyword extraction (in production, use NLP)
    const keywords = [
      'goal',
      'habit',
      'progress',
      'challenge',
      'motivation',
      'plan',
    ];
    return keywords.filter((kw) => text.toLowerCase().includes(kw));
  }

  private extractEntities(
    text: string
  ): Array<{ type: string; value: string }> {
    // In production, use NER model
    const entities: Array<{ type: string; value: string }> = [];

    // Simple pattern matching for dates
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
    const dates = text.match(datePattern) || [];
    dates.forEach((date) => entities.push({ type: 'DATE', value: date }));

    return entities;
  }

  private analyzeSentiment(
    text: string
  ): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis (in production, use transformer model)
    const positiveWords = [
      'great',
      'excellent',
      'happy',
      'success',
      'achieve',
    ];
    const negativeWords = ['bad', 'difficult', 'struggle', 'fail', 'hard'];

    const positiveCount = positiveWords.filter((w) =>
      text.toLowerCase().includes(w)
    ).length;
    const negativeCount = negativeWords.filter((w) =>
      text.toLowerCase().includes(w)
    ).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  async recall(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    console.log(`[ConversationMemory] Recalling memories for query: "${query}"`);

    const queryEmbedding = await this.generateEmbedding(query);

    // Get all user messages
    const allMessages: Message[] = [];
    this.messages.forEach((messages) => {
      const userMessages = messages.filter((m) => m.userId === userId);
      allMessages.push(...userMessages);
    });

    // Calculate similarity scores
    const results = allMessages
      .map((message) => {
        const messageEmbedding = this.embeddings.get(message.id);
        if (!messageEmbedding) return null;

        const score = this.cosineSimilarity(queryEmbedding, messageEmbedding);
        return { message, score };
      })
      .filter((r): r is VectorSearchResult => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // In production, use OpenAI embeddings API
    // For now, return a simple hash-based embedding
    const hash = this.simpleHash(text);
    const embedding = new Array(384).fill(0).map((_, i) => {
      return Math.sin(hash + i) * 0.5 + 0.5;
    });
    return embedding;
  }

  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
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

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async getConversationSummary(
    conversationId: string
  ): Promise<ConversationSummary | null> {
    return this.summaries.get(conversationId) || null;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.messages.get(conversationId) || [];
  }

  async getMemoryStats(userId: string): Promise<{
    totalMessages: number;
    totalConversations: number;
    topTopics: string[];
    overallSentiment: string;
  }> {
    const allMessages: Message[] = [];
    const conversationIds = new Set<string>();

    this.messages.forEach((messages, convId) => {
      const userMessages = messages.filter((m) => m.userId === userId);
      if (userMessages.length > 0) {
        allMessages.push(...userMessages);
        conversationIds.add(convId);
      }
    });

    // Get all topics
    const allTopics: string[] = [];
    this.summaries.forEach((summary) => {
      allTopics.push(...summary.keyTopics);
    });

    // Count topic frequency
    const topicCounts = new Map<string, number>();
    allTopics.forEach((topic) => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });

    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);

    return {
      totalMessages: allMessages.length,
      totalConversations: conversationIds.size,
      topTopics,
      overallSentiment: 'positive',
    };
  }
}

export const conversationMemory = new ConversationMemory();
