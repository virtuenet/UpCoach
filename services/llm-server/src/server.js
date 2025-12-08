const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
const axios = require('axios');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Environment configuration
const config = {
  port: parseInt(process.env.PORT || '3100'),
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  vllmUrl: process.env.VLLM_URL || 'http://localhost:8000',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  apiKey: process.env.API_KEY,
  rateLimitRpm: parseInt(process.env.RATE_LIMIT_RPM || '60'),
  cacheTtl: parseInt(process.env.CACHE_TTL || '3600'),
  defaultModel: process.env.DEFAULT_MODEL || 'mistral',
};

// Redis client
const redis = new Redis(config.redisUrl, {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

// Rate limiter
const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:llm',
  points: config.rateLimitRpm,
  duration: 60,
});

// Express app
const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  const start = Date.now();

  res.on('finish', () => {
    logger.info({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
    });
  });

  next();
});

// API key authentication middleware
const authenticate = (req, res, next) => {
  if (!config.apiKey) {
    return next(); // No API key configured, allow all
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  if (token !== config.apiKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

// Rate limiting middleware
const rateLimit = async (req, res, next) => {
  try {
    const key = req.headers['x-user-id'] || req.ip;
    await rateLimiter.consume(key);
    next();
  } catch (err) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(err.msBeforeNext / 1000),
    });
  }
};

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Check Ollama
  try {
    await axios.get(`${config.ollamaUrl}/api/tags`, { timeout: 5000 });
    health.services.ollama = 'healthy';
  } catch {
    health.services.ollama = 'unhealthy';
  }

  // Check Redis
  try {
    await redis.ping();
    health.services.redis = 'healthy';
  } catch {
    health.services.redis = 'unhealthy';
  }

  const hasUnhealthy = Object.values(health.services).includes('unhealthy');
  res.status(hasUnhealthy ? 503 : 200).json(health);
});

// List available models
app.get('/api/models', authenticate, async (req, res) => {
  try {
    const response = await axios.get(`${config.ollamaUrl}/api/tags`);
    const models = response.data.models || [];

    res.json({
      models: models.map(m => ({
        id: m.name,
        name: m.name,
        size: m.size,
        modified: m.modified_at,
      })),
    });
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Generate cache key for responses
function generateCacheKey(model, prompt, options) {
  const normalized = prompt.trim().toLowerCase();
  const optionsKey = JSON.stringify({
    temperature: options.temperature,
    maxTokens: options.max_tokens,
  });
  return `llm:cache:${model}:${Buffer.from(normalized + optionsKey).toString('base64').substring(0, 64)}`;
}

// Chat completion endpoint (OpenAI-compatible)
app.post('/api/chat/completions', authenticate, rateLimit, async (req, res) => {
  const { model, messages, temperature = 0.7, max_tokens = 512, stream = false } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const selectedModel = model || config.defaultModel;
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

  // Check cache for non-streaming requests
  if (!stream) {
    const cacheKey = generateCacheKey(selectedModel, prompt, { temperature, max_tokens });
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info({ requestId: req.requestId, event: 'cache_hit' });
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      logger.warn('Cache read error:', err);
    }
  }

  try {
    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await axios.post(
        `${config.ollamaUrl}/api/chat`,
        {
          model: selectedModel,
          messages,
          stream: true,
          options: { temperature, num_predict: max_tokens },
        },
        { responseType: 'stream' }
      );

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              res.write(`data: ${JSON.stringify({
                id: req.requestId,
                object: 'chat.completion.chunk',
                choices: [{
                  delta: { content: data.message.content },
                  index: 0,
                }],
              })}\n\n`);
            }
            if (data.done) {
              res.write('data: [DONE]\n\n');
              res.end();
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      });

      response.data.on('error', (err) => {
        logger.error('Stream error:', err);
        res.end();
      });
    } else {
      // Non-streaming response
      const response = await axios.post(
        `${config.ollamaUrl}/api/chat`,
        {
          model: selectedModel,
          messages,
          stream: false,
          options: { temperature, num_predict: max_tokens },
        },
        { timeout: 60000 }
      );

      const result = {
        id: req.requestId,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: selectedModel,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.data.message?.content || '',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0,
          total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
        },
      };

      // Cache the result
      const cacheKey = generateCacheKey(selectedModel, prompt, { temperature, max_tokens });
      try {
        await redis.setex(cacheKey, config.cacheTtl, JSON.stringify(result));
      } catch (err) {
        logger.warn('Cache write error:', err);
      }

      res.json(result);
    }
  } catch (error) {
    logger.error('Generation error:', error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message,
    });
  }
});

// Coaching-specific endpoint with system prompts
app.post('/api/coaching/chat', authenticate, rateLimit, async (req, res) => {
  const {
    messages,
    context_type = 'general',
    user_context = {},
    temperature = 0.7,
    max_tokens = 512,
  } = req.body;

  // Build coaching system prompt based on context
  const systemPrompts = {
    general: `You are an empathetic and supportive life coach. Your goal is to help users achieve their personal goals, build positive habits, and improve their overall well-being. Be encouraging but realistic. Ask clarifying questions when needed.`,

    habits: `You are a habit formation specialist. Help users build sustainable habits using evidence-based techniques like habit stacking, implementation intentions, and the 2-minute rule. Focus on small, consistent improvements.`,

    goals: `You are a goal-setting expert using SMART criteria. Help users define specific, measurable, achievable, relevant, and time-bound goals. Break large goals into actionable steps.`,

    motivation: `You are a motivational coach. Help users overcome procrastination, self-doubt, and lack of motivation. Use positive psychology techniques and help them reconnect with their "why".`,

    wellness: `You are a wellness coach focusing on holistic health. Address physical, mental, and emotional well-being. Provide practical tips for stress management, sleep, nutrition, and exercise.`,

    productivity: `You are a productivity coach. Help users manage their time effectively, prioritize tasks, and eliminate distractions. Use techniques like time-blocking, Pomodoro, and the Eisenhower Matrix.`,
  };

  const systemPrompt = systemPrompts[context_type] || systemPrompts.general;

  // Add user context to system prompt
  let contextAddition = '';
  if (user_context.goals?.length) {
    contextAddition += `\n\nUser's current goals: ${user_context.goals.join(', ')}`;
  }
  if (user_context.habits?.length) {
    contextAddition += `\nUser's habits: ${user_context.habits.join(', ')}`;
  }
  if (user_context.recent_achievements?.length) {
    contextAddition += `\nRecent achievements: ${user_context.recent_achievements.join(', ')}`;
  }

  const fullMessages = [
    { role: 'system', content: systemPrompt + contextAddition },
    ...messages,
  ];

  // Forward to main chat endpoint
  req.body.messages = fullMessages;
  req.body.model = 'mistral';
  req.body.temperature = temperature;
  req.body.max_tokens = max_tokens;

  // Call the main chat handler
  try {
    const response = await axios.post(
      `${config.ollamaUrl}/api/chat`,
      {
        model: 'mistral',
        messages: fullMessages,
        stream: false,
        options: { temperature, num_predict: max_tokens },
      },
      { timeout: 60000 }
    );

    res.json({
      id: req.requestId,
      context_type,
      message: {
        role: 'assistant',
        content: response.data.message?.content || '',
      },
      suggestions: extractActionItems(response.data.message?.content || ''),
    });
  } catch (error) {
    logger.error('Coaching chat error:', error);
    res.status(500).json({ error: 'Failed to generate coaching response' });
  }
});

// Extract actionable items from response
function extractActionItems(text) {
  const actionPatterns = [
    /try\s+(.+?)(?:\.|$)/gi,
    /start\s+by\s+(.+?)(?:\.|$)/gi,
    /(\d+[-.]?\s*.+?)(?:\n|$)/g,
  ];

  const items = [];
  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1]?.trim();
      if (item && item.length > 10 && item.length < 100) {
        items.push(item);
      }
    }
  }

  return items.slice(0, 3);
}

// Embeddings endpoint for semantic search
app.post('/api/embeddings', authenticate, rateLimit, async (req, res) => {
  const { input, model = 'nomic-embed-text' } = req.body;

  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  const inputs = Array.isArray(input) ? input : [input];

  try {
    const embeddings = await Promise.all(
      inputs.map(async (text) => {
        const response = await axios.post(
          `${config.ollamaUrl}/api/embeddings`,
          { model, prompt: text }
        );
        return response.data.embedding;
      })
    );

    res.json({
      object: 'list',
      data: embeddings.map((embedding, index) => ({
        object: 'embedding',
        index,
        embedding,
      })),
      model,
    });
  } catch (error) {
    logger.error('Embedding error:', error);
    res.status(500).json({ error: 'Failed to generate embeddings' });
  }
});

// Metrics endpoint
app.get('/api/metrics', authenticate, async (req, res) => {
  try {
    const metrics = {
      requests_total: await redis.get('metrics:requests:total') || 0,
      cache_hits: await redis.get('metrics:cache:hits') || 0,
      cache_misses: await redis.get('metrics:cache:misses') || 0,
      errors_total: await redis.get('metrics:errors:total') || 0,
      active_connections: 0,
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId: req.requestId,
  });
});

// Start server
const server = app.listen(config.port, async () => {
  try {
    await redis.connect();
  } catch (err) {
    logger.warn('Redis connection failed, caching disabled:', err.message);
  }

  logger.info(`LLM Gateway listening on port ${config.port}`);
  logger.info(`Ollama URL: ${config.ollamaUrl}`);
  logger.info(`Rate limit: ${config.rateLimitRpm} requests/minute`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    redis.quit();
    process.exit(0);
  });
});

module.exports = app;
