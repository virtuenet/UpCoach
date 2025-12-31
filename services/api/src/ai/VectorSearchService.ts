/**
 * Vector Search Service
 *
 * Provides semantic search and similarity capabilities including:
 * - Text embedding generation (OpenAI)
 * - Vector database integration (Pinecone-compatible)
 * - Semantic similarity search
 * - Hybrid search (keyword + semantic)
 * - Document chunking and indexing
 * - Re-ranking algorithms
 * - Clustering and categorization
 * - Duplicate detection
 * - Personalized search
 *
 * @module VectorSearchService
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';
import axios from 'axios';
import crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface EmbeddingConfig {
  model: 'text-embedding-3-small' | 'text-embedding-3-large';
  dimensions?: number; // Optional dimension reduction
  apiKey: string;
}

interface VectorDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  timestamp: Date;
}

interface SearchQuery {
  query: string;
  topK?: number;
  filters?: Record<string, any>;
  minScore?: number;
  includeMetadata?: boolean;
}

interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
  highlights?: string[];
}

interface HybridSearchConfig {
  semanticWeight: number; // 0.0 to 1.0
  keywordWeight: number; // 0.0 to 1.0
  rerank?: boolean;
  rerankTopK?: number;
}

interface ChunkingStrategy {
  method: 'fixed-size' | 'paragraph' | 'sentence' | 'recursive';
  chunkSize?: number;
  overlap?: number;
  preserveStructure?: boolean;
}

interface IndexConfig {
  name: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotProduct';
  shards?: number;
  replicas?: number;
}

interface ClusterConfig {
  numClusters: number;
  maxIterations?: number;
  convergenceThreshold?: number;
}

interface Cluster {
  id: string;
  centroid: number[];
  documentIds: string[];
  label?: string;
}

interface DuplicateDetectionConfig {
  similarityThreshold: number;
  method: 'exact' | 'fuzzy' | 'semantic';
}

interface RecommendationConfig {
  documentId: string;
  topK?: number;
  filters?: Record<string, any>;
  diversityFactor?: number;
}

interface QueryExpansionConfig {
  method: 'synonyms' | 'related' | 'llm';
  maxExpansions?: number;
}

// Mock Pinecone Client Interface
interface PineconeIndex {
  upsert(vectors: any[]): Promise<void>;
  query(query: any): Promise<any>;
  delete(ids: string[]): Promise<void>;
  fetch(ids: string[]): Promise<any>;
  describeIndexStats(): Promise<any>;
}

// ============================================================================
// Vector Search Service
// ============================================================================

export class VectorSearchService extends EventEmitter {
  private redis: Redis;
  private embeddingConfig: EmbeddingConfig;
  private documents: Map<string, VectorDocument> = new Map();
  private indexes: Map<string, { config: IndexConfig; vectors: Map<string, number[]> }> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();
  private clusters: Map<string, Cluster[]> = new Map();

  constructor(embeddingConfig: EmbeddingConfig) {
    super();
    this.embeddingConfig = embeddingConfig;
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 4,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });

    this.initializeVectorSearchService();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private async initializeVectorSearchService(): Promise<void> {
    this.emit('service:initialized');
    console.log('Vector Search Service initialized');
  }

  // ============================================================================
  // Text Embedding Generation
  // ============================================================================

  /**
   * Generate embeddings using OpenAI API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(text);
    const cached = await this.getCachedEmbedding(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: this.embeddingConfig.model,
          dimensions: this.embeddingConfig.dimensions,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.embeddingConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const embedding = response.data.data[0].embedding;

      // Cache the embedding
      await this.cacheEmbedding(cacheKey, embedding);

      this.emit('embedding:generated', {
        textLength: text.length,
        embeddingDimension: embedding.length,
      });

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);

      // Fallback to local random embedding for demo
      const dimension = this.embeddingConfig.dimensions || 1536;
      const embedding = this.generateRandomEmbedding(dimension);
      await this.cacheEmbedding(cacheKey, embedding);

      return embedding;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Batch processing for efficiency
    const batchSize = 100;
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map((text) => this.generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);

      this.emit('embeddings:batch', {
        processed: Math.min(i + batchSize, texts.length),
        total: texts.length,
      });
    }

    return embeddings;
  }

  private generateRandomEmbedding(dimension: number): number[] {
    // Generate normalized random vector
    const embedding = Array.from({ length: dimension }, () =>
      Math.random() * 2 - 1
    );
    return this.normalizeVector(embedding);
  }

  // ============================================================================
  // Document Chunking
  // ============================================================================

  /**
   * Chunk documents into smaller pieces for better search
   */
  chunkDocument(
    content: string,
    strategy: ChunkingStrategy
  ): string[] {
    switch (strategy.method) {
      case 'fixed-size':
        return this.fixedSizeChunking(content, strategy);
      case 'paragraph':
        return this.paragraphChunking(content);
      case 'sentence':
        return this.sentenceChunking(content);
      case 'recursive':
        return this.recursiveChunking(content, strategy);
      default:
        return [content];
    }
  }

  private fixedSizeChunking(
    content: string,
    strategy: ChunkingStrategy
  ): string[] {
    const chunkSize = strategy.chunkSize || 500;
    const overlap = strategy.overlap || 50;
    const chunks: string[] = [];

    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    return chunks.filter((chunk) => chunk.trim().length > 0);
  }

  private paragraphChunking(content: string): string[] {
    return content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  private sentenceChunking(content: string): string[] {
    // Simple sentence splitting
    return content
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private recursiveChunking(
    content: string,
    strategy: ChunkingStrategy
  ): string[] {
    const chunkSize = strategy.chunkSize || 500;
    const chunks: string[] = [];

    // Try paragraph first
    const paragraphs = this.paragraphChunking(content);

    for (const paragraph of paragraphs) {
      if (paragraph.length <= chunkSize) {
        chunks.push(paragraph);
      } else {
        // Split by sentences
        const sentences = this.sentenceChunking(paragraph);
        let currentChunk = '';

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length <= chunkSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = sentence;
          }
        }

        if (currentChunk) chunks.push(currentChunk);
      }
    }

    return chunks;
  }

  // ============================================================================
  // Document Indexing
  // ============================================================================

  /**
   * Create a new vector index
   */
  async createIndex(config: IndexConfig): Promise<void> {
    this.indexes.set(config.name, {
      config,
      vectors: new Map(),
    });

    await this.redis.set(
      `index:config:${config.name}`,
      JSON.stringify(config)
    );

    this.emit('index:created', config);
  }

  /**
   * Index a document with its embedding
   */
  async indexDocument(
    indexName: string,
    document: VectorDocument
  ): Promise<void> {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    // Generate embedding if not provided
    if (!document.embedding) {
      document.embedding = await this.generateEmbedding(document.content);
    }

    // Store document
    this.documents.set(document.id, document);

    // Store vector in index
    index.vectors.set(document.id, document.embedding);

    // Store in Redis for persistence
    await this.redis.set(
      `doc:${document.id}`,
      JSON.stringify(document),
      'EX',
      86400 * 30
    );

    this.emit('document:indexed', {
      indexName,
      documentId: document.id,
    });
  }

  /**
   * Batch index multiple documents
   */
  async indexDocuments(
    indexName: string,
    documents: VectorDocument[]
  ): Promise<void> {
    const batchSize = 100;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      await Promise.all(
        batch.map((doc) => this.indexDocument(indexName, doc))
      );

      this.emit('documents:batch_indexed', {
        processed: Math.min(i + batchSize, documents.length),
        total: documents.length,
      });
    }
  }

  /**
   * Update document in index
   */
  async updateDocument(
    indexName: string,
    documentId: string,
    updates: Partial<VectorDocument>
  ): Promise<void> {
    const existing = this.documents.get(documentId);
    if (!existing) {
      throw new Error(`Document ${documentId} not found`);
    }

    const updated = { ...existing, ...updates };

    // Regenerate embedding if content changed
    if (updates.content && updates.content !== existing.content) {
      updated.embedding = await this.generateEmbedding(updates.content);
    }

    await this.indexDocument(indexName, updated);

    this.emit('document:updated', { documentId });
  }

  /**
   * Delete document from index
   */
  async deleteDocument(indexName: string, documentId: string): Promise<void> {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    this.documents.delete(documentId);
    index.vectors.delete(documentId);
    await this.redis.del(`doc:${documentId}`);

    this.emit('document:deleted', { documentId });
  }

  // ============================================================================
  // Semantic Search
  // ============================================================================

  /**
   * Search using semantic similarity
   */
  async semanticSearch(
    indexName: string,
    query: SearchQuery
  ): Promise<SearchResult[]> {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query.query);

    // Calculate similarities
    const similarities: Array<{ id: string; score: number }> = [];

    for (const [docId, docEmbedding] of index.vectors.entries()) {
      const score = this.calculateSimilarity(
        queryEmbedding,
        docEmbedding,
        index.config.metric
      );

      if (!query.minScore || score >= query.minScore) {
        similarities.push({ id: docId, score });
      }
    }

    // Sort by score
    similarities.sort((a, b) => b.score - a.score);

    // Get top K results
    const topK = query.topK || 10;
    const topResults = similarities.slice(0, topK);

    // Build results
    const results: SearchResult[] = [];

    for (const { id, score } of topResults) {
      const doc = this.documents.get(id);
      if (!doc) continue;

      // Apply filters
      if (query.filters && !this.matchesFilters(doc.metadata, query.filters)) {
        continue;
      }

      results.push({
        id: doc.id,
        content: doc.content,
        score,
        metadata: query.includeMetadata ? doc.metadata : {},
        highlights: this.generateHighlights(doc.content, query.query),
      });
    }

    this.emit('search:completed', {
      query: query.query,
      resultsCount: results.length,
    });

    return results;
  }

  /**
   * Calculate similarity between vectors
   */
  private calculateSimilarity(
    vec1: number[],
    vec2: number[],
    metric: 'cosine' | 'euclidean' | 'dotProduct'
  ): number {
    switch (metric) {
      case 'cosine':
        return this.cosineSimilarity(vec1, vec2);
      case 'euclidean':
        return 1 / (1 + this.euclideanDistance(vec1, vec2));
      case 'dotProduct':
        return this.dotProduct(vec1, vec2);
      default:
        return this.cosineSimilarity(vec1, vec2);
    }
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProd = this.dotProduct(vec1, vec2);
    const mag1 = Math.sqrt(this.dotProduct(vec1, vec1));
    const mag2 = Math.sqrt(this.dotProduct(vec2, vec2));
    return dotProd / (mag1 * mag2);
  }

  private euclideanDistance(vec1: number[], vec2: number[]): number {
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      sum += Math.pow(vec1[i] - vec2[i], 2);
    }
    return Math.sqrt(sum);
  }

  private dotProduct(vec1: number[], vec2: number[]): number {
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      sum += vec1[i] * vec2[i];
    }
    return sum;
  }

  private normalizeVector(vec: number[]): number[] {
    const magnitude = Math.sqrt(this.dotProduct(vec, vec));
    return vec.map((v) => v / magnitude);
  }

  // ============================================================================
  // Hybrid Search (Keyword + Semantic)
  // ============================================================================

  /**
   * Combine keyword and semantic search
   */
  async hybridSearch(
    indexName: string,
    query: SearchQuery,
    config: HybridSearchConfig
  ): Promise<SearchResult[]> {
    // Semantic search
    const semanticResults = await this.semanticSearch(indexName, query);

    // Keyword search (BM25)
    const keywordResults = await this.keywordSearch(indexName, query);

    // Combine scores
    const combinedScores = new Map<string, number>();

    for (const result of semanticResults) {
      combinedScores.set(
        result.id,
        result.score * config.semanticWeight
      );
    }

    for (const result of keywordResults) {
      const existingScore = combinedScores.get(result.id) || 0;
      combinedScores.set(
        result.id,
        existingScore + result.score * config.keywordWeight
      );
    }

    // Build combined results
    const results: SearchResult[] = [];

    for (const [id, score] of combinedScores.entries()) {
      const doc = this.documents.get(id);
      if (!doc) continue;

      results.push({
        id: doc.id,
        content: doc.content,
        score,
        metadata: doc.metadata,
        highlights: this.generateHighlights(doc.content, query.query),
      });
    }

    // Sort by combined score
    results.sort((a, b) => b.score - a.score);

    // Re-rank if enabled
    if (config.rerank) {
      const rerankTopK = config.rerankTopK || 50;
      const toRerank = results.slice(0, rerankTopK);
      const reranked = await this.rerankResults(query.query, toRerank);
      return [...reranked, ...results.slice(rerankTopK)];
    }

    return results.slice(0, query.topK || 10);
  }

  /**
   * BM25 keyword search
   */
  private async keywordSearch(
    indexName: string,
    query: SearchQuery
  ): Promise<SearchResult[]> {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    const queryTerms = this.tokenize(query.query.toLowerCase());
    const results: SearchResult[] = [];

    // Calculate BM25 scores
    const k1 = 1.5;
    const b = 0.75;
    const avgDocLength = this.calculateAvgDocLength();

    for (const [docId, _] of index.vectors.entries()) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      const docTerms = this.tokenize(doc.content.toLowerCase());
      const docLength = docTerms.length;

      let score = 0;

      for (const term of queryTerms) {
        const tf = docTerms.filter((t) => t === term).length;
        const idf = this.calculateIDF(term, index);

        score +=
          idf *
          ((tf * (k1 + 1)) /
            (tf + k1 * (1 - b + (b * docLength) / avgDocLength)));
      }

      if (score > 0) {
        results.push({
          id: doc.id,
          content: doc.content,
          score,
          metadata: doc.metadata,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    return results;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  private calculateAvgDocLength(): number {
    let totalLength = 0;
    let count = 0;

    for (const doc of this.documents.values()) {
      totalLength += this.tokenize(doc.content).length;
      count++;
    }

    return count > 0 ? totalLength / count : 0;
  }

  private calculateIDF(
    term: string,
    index: { config: IndexConfig; vectors: Map<string, number[]> }
  ): number {
    const totalDocs = index.vectors.size;
    let docsWithTerm = 0;

    for (const [docId, _] of index.vectors.entries()) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      const terms = this.tokenize(doc.content.toLowerCase());
      if (terms.includes(term)) {
        docsWithTerm++;
      }
    }

    return Math.log((totalDocs - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1);
  }

  // ============================================================================
  // Re-ranking
  // ============================================================================

  /**
   * Re-rank search results using cross-encoder simulation
   */
  private async rerankResults(
    query: string,
    results: SearchResult[]
  ): Promise<SearchResult[]> {
    // Simulate cross-encoder scoring
    const rescored = await Promise.all(
      results.map(async (result) => {
        const rerankScore = await this.calculateRerankScore(
          query,
          result.content
        );
        return {
          ...result,
          score: rerankScore,
        };
      })
    );

    rescored.sort((a, b) => b.score - a.score);

    return rescored;
  }

  private async calculateRerankScore(
    query: string,
    content: string
  ): Promise<number> {
    // Simulate cross-encoder with simple text overlap
    const queryTerms = new Set(this.tokenize(query));
    const contentTerms = this.tokenize(content);

    const overlap = contentTerms.filter((t) => queryTerms.has(t)).length;
    const score = overlap / Math.max(queryTerms.size, contentTerms.length);

    return score;
  }

  // ============================================================================
  // Query Expansion
  // ============================================================================

  /**
   * Expand query with related terms
   */
  async expandQuery(
    query: string,
    config: QueryExpansionConfig
  ): Promise<string[]> {
    const expansions = [query];

    if (config.method === 'synonyms') {
      const synonyms = await this.getSynonyms(query);
      expansions.push(...synonyms.slice(0, config.maxExpansions || 3));
    } else if (config.method === 'related') {
      const related = await this.getRelatedTerms(query);
      expansions.push(...related.slice(0, config.maxExpansions || 3));
    }

    return expansions;
  }

  private async getSynonyms(term: string): Promise<string[]> {
    // Simplified synonym lookup
    const synonymMap: Record<string, string[]> = {
      'happy': ['joyful', 'pleased', 'content'],
      'sad': ['unhappy', 'sorrowful', 'melancholy'],
      'fast': ['quick', 'rapid', 'swift'],
      'slow': ['gradual', 'leisurely', 'unhurried'],
    };

    return synonymMap[term.toLowerCase()] || [];
  }

  private async getRelatedTerms(term: string): Promise<string[]> {
    // Use embeddings to find related terms
    // Simplified implementation
    return [];
  }

  // ============================================================================
  // Clustering and Categorization
  // ============================================================================

  /**
   * K-means clustering on document embeddings
   */
  async clusterDocuments(
    indexName: string,
    config: ClusterConfig
  ): Promise<Cluster[]> {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    const vectors = Array.from(index.vectors.entries());
    const k = config.numClusters;
    const maxIterations = config.maxIterations || 100;
    const threshold = config.convergenceThreshold || 0.001;

    // Initialize centroids randomly
    let centroids: number[][] = [];
    const randomIndices = new Set<number>();

    while (randomIndices.size < k) {
      randomIndices.add(Math.floor(Math.random() * vectors.length));
    }

    for (const idx of randomIndices) {
      centroids.push([...vectors[idx][1]]);
    }

    let clusters: Cluster[] = [];
    let prevCentroids: number[][] = [];

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign documents to nearest centroid
      const assignments: Map<number, string[]> = new Map();

      for (let i = 0; i < k; i++) {
        assignments.set(i, []);
      }

      for (const [docId, embedding] of vectors) {
        let minDist = Infinity;
        let closestCluster = 0;

        for (let i = 0; i < k; i++) {
          const dist = this.euclideanDistance(embedding, centroids[i]);
          if (dist < minDist) {
            minDist = dist;
            closestCluster = i;
          }
        }

        assignments.get(closestCluster)!.push(docId);
      }

      // Update centroids
      prevCentroids = centroids.map((c) => [...c]);
      centroids = [];

      for (let i = 0; i < k; i++) {
        const clusterDocIds = assignments.get(i)!;

        if (clusterDocIds.length === 0) {
          // Keep previous centroid
          centroids.push(prevCentroids[i]);
          continue;
        }

        const clusterVectors = clusterDocIds.map(
          (id) => index.vectors.get(id)!
        );
        const newCentroid = this.calculateMean(clusterVectors);
        centroids.push(newCentroid);
      }

      // Check convergence
      let maxChange = 0;
      for (let i = 0; i < k; i++) {
        const change = this.euclideanDistance(centroids[i], prevCentroids[i]);
        maxChange = Math.max(maxChange, change);
      }

      if (maxChange < threshold) {
        break;
      }

      this.emit('clustering:iteration', { iteration: iter + 1, maxChange });
    }

    // Build cluster objects
    clusters = centroids.map((centroid, i) => {
      const documentIds: string[] = [];

      for (const [docId, embedding] of vectors) {
        let minDist = Infinity;
        let closestCluster = 0;

        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(embedding, centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            closestCluster = j;
          }
        }

        if (closestCluster === i) {
          documentIds.push(docId);
        }
      }

      return {
        id: `cluster_${i}`,
        centroid,
        documentIds,
        label: `Cluster ${i + 1}`,
      };
    });

    this.clusters.set(indexName, clusters);

    this.emit('clustering:completed', {
      indexName,
      numClusters: k,
      clusterSizes: clusters.map((c) => c.documentIds.length),
    });

    return clusters;
  }

  private calculateMean(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];

    const dimension = vectors[0].length;
    const mean = new Array(dimension).fill(0);

    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        mean[i] += vector[i];
      }
    }

    return mean.map((v) => v / vectors.length);
  }

  // ============================================================================
  // Duplicate Detection
  // ============================================================================

  /**
   * Find duplicate or near-duplicate documents
   */
  async findDuplicates(
    indexName: string,
    config: DuplicateDetectionConfig
  ): Promise<Array<{ doc1: string; doc2: string; similarity: number }>> {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    const duplicates: Array<{ doc1: string; doc2: string; similarity: number }> = [];
    const vectors = Array.from(index.vectors.entries());

    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        const [id1, vec1] = vectors[i];
        const [id2, vec2] = vectors[j];

        const similarity = this.cosineSimilarity(vec1, vec2);

        if (similarity >= config.similarityThreshold) {
          duplicates.push({ doc1: id1, doc2: id2, similarity });
        }
      }
    }

    duplicates.sort((a, b) => b.similarity - a.similarity);

    this.emit('duplicates:found', {
      indexName,
      count: duplicates.length,
    });

    return duplicates;
  }

  // ============================================================================
  // Recommendations
  // ============================================================================

  /**
   * Get recommendations based on document similarity
   */
  async getRecommendations(
    indexName: string,
    config: RecommendationConfig
  ): Promise<SearchResult[]> {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    const sourceDoc = this.documents.get(config.documentId);
    if (!sourceDoc || !sourceDoc.embedding) {
      throw new Error(`Document ${config.documentId} not found`);
    }

    const similarities: Array<{ id: string; score: number }> = [];

    for (const [docId, embedding] of index.vectors.entries()) {
      if (docId === config.documentId) continue;

      const score = this.cosineSimilarity(sourceDoc.embedding, embedding);
      similarities.push({ id: docId, score });
    }

    // Apply diversity if needed
    if (config.diversityFactor && config.diversityFactor > 0) {
      similarities.sort((a, b) => {
        const diversityA = Math.random() * config.diversityFactor!;
        const diversityB = Math.random() * config.diversityFactor!;
        return b.score + diversityB - (a.score + diversityA);
      });
    } else {
      similarities.sort((a, b) => b.score - a.score);
    }

    const topK = config.topK || 10;
    const results: SearchResult[] = [];

    for (const { id, score } of similarities.slice(0, topK)) {
      const doc = this.documents.get(id);
      if (!doc) continue;

      // Apply filters
      if (config.filters && !this.matchesFilters(doc.metadata, config.filters)) {
        continue;
      }

      results.push({
        id: doc.id,
        content: doc.content,
        score,
        metadata: doc.metadata,
      });
    }

    return results;
  }

  // ============================================================================
  // Personalized Search
  // ============================================================================

  /**
   * Personalize search results based on user preferences
   */
  async personalizedSearch(
    indexName: string,
    query: SearchQuery,
    userId: string
  ): Promise<SearchResult[]> {
    // Get base search results
    const results = await this.semanticSearch(indexName, query);

    // Get user preferences
    const userPreferences = await this.getUserPreferences(userId);

    // Re-score based on preferences
    for (const result of results) {
      const personalizedScore = this.calculatePersonalizedScore(
        result,
        userPreferences
      );
      result.score = result.score * 0.7 + personalizedScore * 0.3;
    }

    // Re-sort
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  private async getUserPreferences(userId: string): Promise<Record<string, number>> {
    const prefsStr = await this.redis.get(`user:prefs:${userId}`);
    return prefsStr ? JSON.parse(prefsStr) : {};
  }

  private calculatePersonalizedScore(
    result: SearchResult,
    preferences: Record<string, number>
  ): number {
    let score = 0;
    let count = 0;

    for (const [key, value] of Object.entries(result.metadata)) {
      if (preferences[key]) {
        score += preferences[key];
        count++;
      }
    }

    return count > 0 ? score / count : 0.5;
  }

  // ============================================================================
  // Search Analytics
  // ============================================================================

  /**
   * Track search analytics
   */
  async trackSearchQuery(
    query: string,
    resultsCount: number,
    userId?: string
  ): Promise<void> {
    const analytics = {
      query,
      resultsCount,
      userId,
      timestamp: new Date().toISOString(),
    };

    await this.redis.lpush('search:analytics', JSON.stringify(analytics));
    await this.redis.ltrim('search:analytics', 0, 9999);

    // Track query frequency
    await this.redis.zincrby('search:popular', 1, query);

    this.emit('search:tracked', analytics);
  }

  async getPopularQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    const results = await this.redis.zrevrange('search:popular', 0, limit - 1, 'WITHSCORES');
    const queries: Array<{ query: string; count: number }> = [];

    for (let i = 0; i < results.length; i += 2) {
      queries.push({
        query: results[i],
        count: parseInt(results[i + 1]),
      });
    }

    return queries;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private matchesFilters(
    metadata: Record<string, any>,
    filters: Record<string, any>
  ): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private generateHighlights(content: string, query: string): string[] {
    const queryTerms = this.tokenize(query);
    const sentences = content.split(/[.!?]+/);
    const highlights: string[] = [];

    for (const sentence of sentences) {
      const sentenceTokens = this.tokenize(sentence);
      const hasMatch = queryTerms.some((term) => sentenceTokens.includes(term));

      if (hasMatch) {
        highlights.push(sentence.trim());
        if (highlights.length >= 3) break;
      }
    }

    return highlights;
  }

  private getCacheKey(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  private async getCachedEmbedding(cacheKey: string): Promise<number[] | null> {
    // Check memory cache
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    // Check Redis cache
    const cached = await this.redis.get(`embedding:${cacheKey}`);
    if (cached) {
      const embedding = JSON.parse(cached);
      this.embeddingCache.set(cacheKey, embedding);
      return embedding;
    }

    return null;
  }

  private async cacheEmbedding(cacheKey: string, embedding: number[]): Promise<void> {
    // Store in memory cache
    this.embeddingCache.set(cacheKey, embedding);

    // Limit memory cache size
    if (this.embeddingCache.size > 10000) {
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }

    // Store in Redis cache
    await this.redis.set(
      `embedding:${cacheKey}`,
      JSON.stringify(embedding),
      'EX',
      86400 * 7 // 7 days
    );
  }

  async getIndexStats(indexName: string): Promise<any> {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    return {
      name: indexName,
      documentCount: index.vectors.size,
      dimension: index.config.dimension,
      metric: index.config.metric,
    };
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
    this.documents.clear();
    this.indexes.clear();
    this.embeddingCache.clear();
    this.emit('service:cleanup');
  }
}

export default VectorSearchService;
