/**
 * Streaming AI Service
 *
 * Provides real-time token-by-token streaming for AI coach responses.
 * Supports SSE, WebSocket, and direct streaming to clients.
 *
 * Features:
 * - Token-by-token streaming from OpenAI/Claude
 * - SSE (Server-Sent Events) for HTTP streaming
 * - WebSocket fallback for bidirectional communication
 * - Stream interruption and cancellation handling
 * - Token usage tracking during streams
 * - Response buffering and chunking optimization
 * - Multi-provider support (OpenAI, Claude, Local LLM)
 */

import { EventEmitter } from 'events';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { eventBus } from '../events/EventBus';
import { eventStore } from '../events/EventStore';
import logger from '../../utils/logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type StreamProvider = 'openai' | 'claude' | 'local' | 'hybrid';
export type StreamStatus = 'pending' | 'streaming' | 'completed' | 'cancelled' | 'error';
export type StreamTransport = 'sse' | 'websocket' | 'callback';

export interface StreamOptions {
  provider?: StreamProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  timeout?: number;
  enableSafetyCheck?: boolean;
  metadata?: Record<string, unknown>;
}

export interface StreamChunk {
  id: string;
  streamId: string;
  index: number;
  content: string;
  tokenCount: number;
  timestamp: number;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
  delta?: {
    role?: string;
    content?: string;
    toolCalls?: unknown[];
  };
}

export interface StreamMetrics {
  streamId: string;
  provider: StreamProvider;
  model: string;
  startTime: number;
  endTime?: number;
  firstTokenTime?: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  chunksDelivered: number;
  latencyToFirstToken?: number;
  totalDuration?: number;
  tokensPerSecond?: number;
  status: StreamStatus;
  errorMessage?: string;
}

export interface ActiveStream {
  id: string;
  userId: string;
  conversationId?: string;
  prompt: string;
  options: StreamOptions;
  transport: StreamTransport;
  status: StreamStatus;
  metrics: StreamMetrics;
  buffer: string[];
  callbacks: Set<(chunk: StreamChunk) => void>;
  abortController?: AbortController;
  sseResponse?: Response;
  createdAt: number;
}

export interface StreamRequest {
  userId: string;
  conversationId?: string;
  prompt: string;
  context?: Array<{ role: string; content: string }>;
  options?: StreamOptions;
}

export interface StreamResult {
  streamId: string;
  content: string;
  metrics: StreamMetrics;
  safetyFlags?: string[];
}

interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
  maxConcurrentStreams: number;
  timeout: number;
}

// ============================================================================
// Streaming AI Service Implementation
// ============================================================================

export class StreamingAIService extends EventEmitter {
  private static instance: StreamingAIService;

  private activeStreams: Map<string, ActiveStream> = new Map();
  private userStreams: Map<string, Set<string>> = new Map();
  private providers: Map<StreamProvider, ProviderConfig> = new Map();

  // Configuration
  private readonly maxConcurrentStreamsPerUser = 3;
  private readonly maxBufferSize = 100;
  private readonly defaultTimeout = 120000; // 2 minutes
  private readonly heartbeatInterval = 15000; // 15 seconds
  private readonly chunkBatchSize = 5; // Batch chunks for efficiency

  // Metrics
  private totalStreamsCreated = 0;
  private totalTokensStreamed = 0;
  private averageLatencyToFirstToken = 0;
  private streamLatencies: number[] = [];

  private heartbeatTimer: NodeJS.Timeout | null = null;
  private initialized = false;

  private constructor() {
    super();
    this.initializeProviders();
  }

  public static getInstance(): StreamingAIService {
    if (!StreamingAIService.instance) {
      StreamingAIService.instance = new StreamingAIService();
    }
    return StreamingAIService.instance;
  }

  /**
   * Initialize AI providers with configuration
   */
  private initializeProviders(): void {
    // OpenAI configuration
    this.providers.set('openai', {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4-turbo-preview',
      maxConcurrentStreams: 10,
      timeout: 120000,
    });

    // Claude configuration
    this.providers.set('claude', {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-sonnet-20240229',
      maxConcurrentStreams: 10,
      timeout: 120000,
    });

    // Local LLM configuration
    this.providers.set('local', {
      baseUrl: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
      defaultModel: 'mistral:7b',
      maxConcurrentStreams: 5,
      timeout: 180000,
    });

    logger.info('[StreamingAI] Providers initialized');
  }

  /**
   * Start the streaming service
   */
  async start(): Promise<void> {
    if (this.initialized) return;

    // Start heartbeat for SSE connections
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeats();
    }, this.heartbeatInterval);

    // Subscribe to stream-related events
    await eventBus.subscribe('ai.stream.*', async event => {
      await this.handleStreamEvent(event);
    });

    this.initialized = true;
    logger.info('[StreamingAI] Service started');
  }

  /**
   * Stop the streaming service
   */
  async stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Cancel all active streams
    for (const stream of this.activeStreams.values()) {
      await this.cancelStream(stream.id, 'Service shutdown');
    }

    this.initialized = false;
    logger.info('[StreamingAI] Service stopped');
  }

  /**
   * Create a new streaming request
   */
  async createStream(request: StreamRequest): Promise<string> {
    const { userId, conversationId, prompt, context, options = {} } = request;

    // Check concurrent stream limit
    const userStreamSet = this.userStreams.get(userId) || new Set();
    if (userStreamSet.size >= this.maxConcurrentStreamsPerUser) {
      throw new Error(`Maximum concurrent streams (${this.maxConcurrentStreamsPerUser}) reached for user`);
    }

    const streamId = uuidv4();
    const provider = options.provider || 'claude';
    const providerConfig = this.providers.get(provider);

    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const stream: ActiveStream = {
      id: streamId,
      userId,
      conversationId,
      prompt,
      options: {
        ...options,
        provider,
        model: options.model || providerConfig.defaultModel,
        timeout: options.timeout || this.defaultTimeout,
      },
      transport: 'callback',
      status: 'pending',
      metrics: {
        streamId,
        provider,
        model: options.model || providerConfig.defaultModel,
        startTime: Date.now(),
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        chunksDelivered: 0,
        status: 'pending',
      },
      buffer: [],
      callbacks: new Set(),
      abortController: new AbortController(),
      createdAt: Date.now(),
    };

    this.activeStreams.set(streamId, stream);
    userStreamSet.add(streamId);
    this.userStreams.set(userId, userStreamSet);
    this.totalStreamsCreated++;

    // Emit stream created event
    await eventBus.publish(
      'ai.stream.created',
      'ai',
      {
        streamId,
        userId,
        conversationId,
        provider,
        model: stream.options.model,
      },
      { priority: 'normal' }
    );

    // Store event for audit
    await eventStore.append(
      {
        id: uuidv4(),
        type: 'ai.stream.created',
        category: 'ai',
        priority: 'normal',
        payload: { streamId, userId, prompt: prompt.substring(0, 100) },
        metadata: {
          timestamp: Date.now(),
          source: 'streaming-ai-service',
          version: '1.0.0',
        },
      },
      streamId,
      'ai-stream'
    );

    logger.info(`[StreamingAI] Stream created: ${streamId} for user ${userId}`);

    return streamId;
  }

  /**
   * Start streaming to a callback function
   */
  async streamToCallback(
    streamId: string,
    callback: (chunk: StreamChunk) => void,
    onComplete?: (result: StreamResult) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    stream.callbacks.add(callback);
    stream.transport = 'callback';

    try {
      await this.executeStream(stream, callback, onComplete);
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  /**
   * Start streaming via SSE (Server-Sent Events)
   */
  async streamToSSE(streamId: string, response: Response): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    // Set SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');

    stream.sseResponse = response;
    stream.transport = 'sse';

    // Handle client disconnect
    response.on('close', () => {
      this.cancelStream(streamId, 'Client disconnected');
    });

    // Send initial event
    this.sendSSEEvent(response, 'start', { streamId });

    const callback = (chunk: StreamChunk) => {
      this.sendSSEEvent(response, 'chunk', chunk);
    };

    try {
      await this.executeStream(stream, callback, result => {
        this.sendSSEEvent(response, 'complete', result);
        response.end();
      });
    } catch (error) {
      this.sendSSEEvent(response, 'error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      response.end();
    }
  }

  /**
   * Cancel an active stream
   */
  async cancelStream(streamId: string, reason?: string): Promise<boolean> {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return false;

    // Abort the request
    if (stream.abortController) {
      stream.abortController.abort();
    }

    stream.status = 'cancelled';
    stream.metrics.status = 'cancelled';
    stream.metrics.endTime = Date.now();
    stream.metrics.totalDuration = stream.metrics.endTime - stream.metrics.startTime;

    // Notify callbacks
    const cancelChunk: StreamChunk = {
      id: uuidv4(),
      streamId,
      index: -1,
      content: '',
      tokenCount: 0,
      timestamp: Date.now(),
      finishReason: 'stop',
    };

    for (const callback of stream.callbacks) {
      try {
        callback(cancelChunk);
      } catch (error) {
        logger.error(`[StreamingAI] Error notifying callback on cancel: ${error}`);
      }
    }

    // Close SSE if active
    if (stream.sseResponse && !stream.sseResponse.writableEnded) {
      this.sendSSEEvent(stream.sseResponse, 'cancelled', { reason });
      stream.sseResponse.end();
    }

    // Cleanup
    this.cleanupStream(streamId);

    // Emit cancellation event
    await eventBus.publish(
      'ai.stream.cancelled',
      'ai',
      { streamId, reason },
      { priority: 'low' }
    );

    logger.info(`[StreamingAI] Stream cancelled: ${streamId}, reason: ${reason}`);

    return true;
  }

  /**
   * Execute the actual streaming from AI provider
   */
  private async executeStream(
    stream: ActiveStream,
    callback: (chunk: StreamChunk) => void,
    onComplete?: (result: StreamResult) => void
  ): Promise<void> {
    stream.status = 'streaming';
    stream.metrics.status = 'streaming';

    const provider = stream.options.provider || 'claude';
    let chunkIndex = 0;
    let fullContent = '';
    const buffer: StreamChunk[] = [];

    try {
      // Get the appropriate streaming function
      const streamGenerator = this.getProviderStream(provider, stream);

      for await (const token of streamGenerator) {
        // Check if cancelled
        if (stream.status === 'cancelled') break;

        // Track first token latency
        if (chunkIndex === 0) {
          stream.metrics.firstTokenTime = Date.now();
          stream.metrics.latencyToFirstToken =
            stream.metrics.firstTokenTime - stream.metrics.startTime;
          this.updateAverageLatency(stream.metrics.latencyToFirstToken);
        }

        fullContent += token.content;
        stream.metrics.outputTokens += token.tokenCount || 1;
        stream.metrics.totalTokens = stream.metrics.inputTokens + stream.metrics.outputTokens;

        const chunk: StreamChunk = {
          id: uuidv4(),
          streamId: stream.id,
          index: chunkIndex++,
          content: token.content,
          tokenCount: token.tokenCount || 1,
          timestamp: Date.now(),
          finishReason: token.finishReason,
          delta: token.delta,
        };

        // Buffer chunks for batching
        buffer.push(chunk);
        stream.buffer.push(token.content);

        // Trim buffer if too large
        if (stream.buffer.length > this.maxBufferSize) {
          stream.buffer.shift();
        }

        // Batch deliver chunks
        if (buffer.length >= this.chunkBatchSize || token.finishReason) {
          for (const bufferedChunk of buffer) {
            callback(bufferedChunk);
            stream.metrics.chunksDelivered++;
          }
          buffer.length = 0;
        }

        this.totalTokensStreamed++;
      }

      // Deliver any remaining buffered chunks
      for (const bufferedChunk of buffer) {
        callback(bufferedChunk);
        stream.metrics.chunksDelivered++;
      }

      // Complete the stream
      stream.status = 'completed';
      stream.metrics.status = 'completed';
      stream.metrics.endTime = Date.now();
      stream.metrics.totalDuration = stream.metrics.endTime - stream.metrics.startTime;
      stream.metrics.tokensPerSecond =
        (stream.metrics.outputTokens / stream.metrics.totalDuration) * 1000;

      const result: StreamResult = {
        streamId: stream.id,
        content: fullContent,
        metrics: { ...stream.metrics },
      };

      // Safety check if enabled
      if (stream.options.enableSafetyCheck) {
        result.safetyFlags = await this.performSafetyCheck(fullContent);
      }

      if (onComplete) {
        onComplete(result);
      }

      // Emit completion event
      await eventBus.publish(
        'ai.stream.completed',
        'ai',
        {
          streamId: stream.id,
          userId: stream.userId,
          metrics: stream.metrics,
        },
        { priority: 'normal' }
      );

      // Store completion event
      await eventStore.append(
        {
          id: uuidv4(),
          type: 'ai.stream.completed',
          category: 'ai',
          priority: 'normal',
          payload: {
            streamId: stream.id,
            totalTokens: stream.metrics.totalTokens,
            duration: stream.metrics.totalDuration,
          },
          metadata: {
            timestamp: Date.now(),
            source: 'streaming-ai-service',
            version: '1.0.0',
          },
        },
        stream.id,
        'ai-stream'
      );

      this.emit('streamCompleted', result);
      logger.info(
        `[StreamingAI] Stream completed: ${stream.id}, tokens: ${stream.metrics.totalTokens}, duration: ${stream.metrics.totalDuration}ms`
      );
    } catch (error) {
      stream.status = 'error';
      stream.metrics.status = 'error';
      stream.metrics.errorMessage = error instanceof Error ? error.message : String(error);
      stream.metrics.endTime = Date.now();
      stream.metrics.totalDuration = stream.metrics.endTime - stream.metrics.startTime;

      // Emit error event
      await eventBus.publish(
        'ai.stream.error',
        'ai',
        {
          streamId: stream.id,
          userId: stream.userId,
          error: stream.metrics.errorMessage,
        },
        { priority: 'high' }
      );

      this.emit('streamError', { streamId: stream.id, error });
      logger.error(`[StreamingAI] Stream error: ${stream.id}, ${stream.metrics.errorMessage}`);

      throw error;
    } finally {
      // Cleanup after a delay to allow result retrieval
      setTimeout(() => this.cleanupStream(stream.id), 30000);
    }
  }

  /**
   * Get streaming generator for specific provider
   */
  private async *getProviderStream(
    provider: StreamProvider,
    stream: ActiveStream
  ): AsyncGenerator<{
    content: string;
    tokenCount?: number;
    finishReason?: StreamChunk['finishReason'];
    delta?: StreamChunk['delta'];
  }> {
    switch (provider) {
      case 'openai':
        yield* this.streamFromOpenAI(stream);
        break;
      case 'claude':
        yield* this.streamFromClaude(stream);
        break;
      case 'local':
        yield* this.streamFromLocal(stream);
        break;
      case 'hybrid':
        yield* this.streamHybrid(stream);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Stream from OpenAI API
   */
  private async *streamFromOpenAI(
    stream: ActiveStream
  ): AsyncGenerator<{ content: string; tokenCount?: number; finishReason?: StreamChunk['finishReason'] }> {
    const config = this.providers.get('openai');
    if (!config?.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: stream.options.model || config.defaultModel,
        messages: [
          ...(stream.options.systemPrompt
            ? [{ role: 'system', content: stream.options.systemPrompt }]
            : []),
          { role: 'user', content: stream.prompt },
        ],
        temperature: stream.options.temperature ?? 0.7,
        max_tokens: stream.options.maxTokens ?? 2048,
        stream: true,
      }),
      signal: stream.abortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', finishReason: 'stop' };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (delta?.content) {
              yield {
                content: delta.content,
                tokenCount: 1,
                finishReason: finishReason as StreamChunk['finishReason'],
              };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  /**
   * Stream from Claude API
   */
  private async *streamFromClaude(
    stream: ActiveStream
  ): AsyncGenerator<{ content: string; tokenCount?: number; finishReason?: StreamChunk['finishReason'] }> {
    const config = this.providers.get('claude');
    if (!config?.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: stream.options.model || config.defaultModel,
        max_tokens: stream.options.maxTokens ?? 2048,
        system: stream.options.systemPrompt || 'You are a helpful AI coaching assistant.',
        messages: [{ role: 'user', content: stream.prompt }],
        stream: true,
      }),
      signal: stream.abortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield {
                content: parsed.delta.text,
                tokenCount: 1,
              };
            } else if (parsed.type === 'message_stop') {
              yield { content: '', finishReason: 'stop' };
              return;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  /**
   * Stream from Local LLM (Ollama)
   */
  private async *streamFromLocal(
    stream: ActiveStream
  ): AsyncGenerator<{ content: string; tokenCount?: number; finishReason?: StreamChunk['finishReason'] }> {
    const config = this.providers.get('local');
    if (!config?.baseUrl) {
      throw new Error('Local LLM URL not configured');
    }

    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: stream.options.model || config.defaultModel,
        prompt: stream.prompt,
        system: stream.options.systemPrompt,
        stream: true,
        options: {
          temperature: stream.options.temperature ?? 0.7,
          num_predict: stream.options.maxTokens ?? 2048,
        },
      }),
      signal: stream.abortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`Local LLM error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);

          if (parsed.response) {
            yield {
              content: parsed.response,
              tokenCount: 1,
              finishReason: parsed.done ? 'stop' : null,
            };
          }

          if (parsed.done) {
            return;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  /**
   * Hybrid streaming - tries local first, falls back to cloud
   */
  private async *streamHybrid(
    stream: ActiveStream
  ): AsyncGenerator<{ content: string; tokenCount?: number; finishReason?: StreamChunk['finishReason'] }> {
    try {
      // Try local LLM first
      yield* this.streamFromLocal(stream);
    } catch (localError) {
      logger.warn(`[StreamingAI] Local LLM failed, falling back to Claude: ${localError}`);

      // Fall back to Claude
      yield* this.streamFromClaude(stream);
    }
  }

  /**
   * Send SSE event to client
   */
  private sendSSEEvent(response: Response, event: string, data: unknown): void {
    if (response.writableEnded) return;

    response.write(`event: ${event}\n`);
    response.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Send heartbeats to all SSE connections
   */
  private sendHeartbeats(): void {
    for (const stream of this.activeStreams.values()) {
      if (stream.sseResponse && !stream.sseResponse.writableEnded) {
        this.sendSSEEvent(stream.sseResponse, 'heartbeat', {
          timestamp: Date.now(),
          streamId: stream.id,
        });
      }
    }
  }

  /**
   * Perform safety check on generated content
   */
  private async performSafetyCheck(content: string): Promise<string[]> {
    const flags: string[] = [];

    // Basic safety patterns
    const safetyPatterns = [
      { pattern: /\b(suicide|self-harm)\b/i, flag: 'self_harm_mention' },
      { pattern: /\b(abuse|violence)\b/i, flag: 'violence_mention' },
      { pattern: /\b(medication|drug)\s+advice\b/i, flag: 'medical_advice' },
    ];

    for (const { pattern, flag } of safetyPatterns) {
      if (pattern.test(content)) {
        flags.push(flag);
      }
    }

    if (flags.length > 0) {
      await eventBus.publish(
        'ai.safety.flagged',
        'security',
        { flags, contentPreview: content.substring(0, 200) },
        { priority: 'high' }
      );
    }

    return flags;
  }

  /**
   * Update average latency calculation
   */
  private updateAverageLatency(latency: number): void {
    this.streamLatencies.push(latency);
    if (this.streamLatencies.length > 1000) {
      this.streamLatencies.shift();
    }
    this.averageLatencyToFirstToken =
      this.streamLatencies.reduce((a, b) => a + b, 0) / this.streamLatencies.length;
  }

  /**
   * Cleanup completed/cancelled stream
   */
  private cleanupStream(streamId: string): void {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    // Remove from user streams
    const userStreamSet = this.userStreams.get(stream.userId);
    if (userStreamSet) {
      userStreamSet.delete(streamId);
      if (userStreamSet.size === 0) {
        this.userStreams.delete(stream.userId);
      }
    }

    // Clear callbacks
    stream.callbacks.clear();

    // Remove from active streams
    this.activeStreams.delete(streamId);
  }

  /**
   * Handle stream events from event bus
   */
  private async handleStreamEvent(event: { type: string; payload: unknown }): Promise<void> {
    // Handle external stream control events
    if (event.type === 'ai.stream.cancel') {
      const { streamId, reason } = event.payload as { streamId: string; reason?: string };
      await this.cancelStream(streamId, reason);
    }
  }

  // ============================================================================
  // Public Query Methods
  // ============================================================================

  /**
   * Get active stream by ID
   */
  getStream(streamId: string): ActiveStream | undefined {
    return this.activeStreams.get(streamId);
  }

  /**
   * Get all active streams for a user
   */
  getUserStreams(userId: string): ActiveStream[] {
    const streamIds = this.userStreams.get(userId) || new Set();
    return Array.from(streamIds)
      .map(id => this.activeStreams.get(id))
      .filter((s): s is ActiveStream => s !== undefined);
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalStreamsCreated: number;
    activeStreams: number;
    totalTokensStreamed: number;
    averageLatencyToFirstToken: number;
    streamsByProvider: Record<string, number>;
    streamsByStatus: Record<string, number>;
  } {
    const streamsByProvider: Record<string, number> = {};
    const streamsByStatus: Record<string, number> = {};

    for (const stream of this.activeStreams.values()) {
      const provider = stream.options.provider || 'unknown';
      streamsByProvider[provider] = (streamsByProvider[provider] || 0) + 1;
      streamsByStatus[stream.status] = (streamsByStatus[stream.status] || 0) + 1;
    }

    return {
      totalStreamsCreated: this.totalStreamsCreated,
      activeStreams: this.activeStreams.size,
      totalTokensStreamed: this.totalTokensStreamed,
      averageLatencyToFirstToken: Math.round(this.averageLatencyToFirstToken),
      streamsByProvider,
      streamsByStatus,
    };
  }

  /**
   * Get stream metrics by ID
   */
  getStreamMetrics(streamId: string): StreamMetrics | undefined {
    return this.activeStreams.get(streamId)?.metrics;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const streamingAIService = StreamingAIService.getInstance();

export function createStreamingAIService(): StreamingAIService {
  return StreamingAIService.getInstance();
}
