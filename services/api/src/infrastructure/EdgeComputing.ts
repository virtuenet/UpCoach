import axios from 'axios';
import { EventEmitter } from 'events';
import * as jose from 'jose';
import { createHash } from 'crypto';
import { gzip, brotliCompress } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const brotliCompressAsync = promisify(brotliCompress);

/**
 * Edge computing providers
 */
export enum EdgeProvider {
  CLOUDFLARE_WORKERS = 'cloudflare-workers',
  AWS_LAMBDA_EDGE = 'aws-lambda-edge',
}

/**
 * Edge function routing rule
 */
export interface EdgeRoutingRule {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  pattern: {
    type: 'url' | 'header' | 'cookie' | 'query';
    value: string;
    operator: 'equals' | 'contains' | 'regex' | 'startsWith' | 'endsWith';
  };
  action: {
    type: 'route' | 'cache' | 'transform' | 'authenticate' | 'rateLimit';
    config: any;
  };
}

/**
 * Edge cache configuration
 */
export interface EdgeCacheConfig {
  enabled: boolean;
  provider: 'kv' | 'cache-api';
  ttl: number;
  namespace?: string;
  keyStrategy: 'url' | 'url-query' | 'url-headers' | 'custom';
  customKeyGenerator?: (request: any) => string;
  invalidation: {
    enabled: boolean;
    strategies: Array<'url' | 'tag' | 'purge-all'>;
  };
}

/**
 * Edge authentication configuration
 */
export interface EdgeAuthConfig {
  enabled: boolean;
  methods: Array<'jwt' | 'api-key' | 'oauth' | 'basic'>;
  jwt?: {
    secret: string;
    algorithm: string;
    issuer?: string;
    audience?: string;
    clockTolerance?: number;
  };
  apiKey?: {
    headerName: string;
    validKeys: string[];
  };
  oauth?: {
    introspectionEndpoint: string;
    clientId: string;
    clientSecret: string;
  };
}

/**
 * Edge rate limiting configuration
 */
export interface EdgeRateLimitConfig {
  enabled: boolean;
  rules: Array<{
    id: string;
    type: 'ip' | 'user' | 'api-key';
    limit: number;
    window: number;
    blockDuration?: number;
  }>;
  ddosProtection: {
    enabled: boolean;
    threshold: number;
    challengePage?: string;
  };
}

/**
 * Edge request transformation
 */
export interface EdgeRequestTransform {
  headers?: {
    add?: Record<string, string>;
    remove?: string[];
    modify?: Record<string, string>;
  };
  url?: {
    rewrite?: Array<{ from: string; to: string }>;
    redirect?: Array<{ from: string; to: string; permanent: boolean }>;
  };
  queryParams?: {
    add?: Record<string, string>;
    remove?: string[];
  };
  body?: {
    modify?: boolean;
    transformer?: (body: any) => any;
  };
}

/**
 * Edge response transformation
 */
export interface EdgeResponseTransform {
  compression: {
    enabled: boolean;
    algorithms: Array<'gzip' | 'brotli'>;
    minSize: number;
  };
  minification: {
    enabled: boolean;
    types: Array<'html' | 'css' | 'js'>;
  };
  imageOptimization: {
    enabled: boolean;
    formats: Array<'webp' | 'avif'>;
    quality: number;
    resize?: { width?: number; height?: number; fit: 'cover' | 'contain' | 'fill' };
  };
  headers?: {
    add?: Record<string, string>;
    remove?: string[];
  };
}

/**
 * Edge A/B testing configuration
 */
export interface EdgeABTestConfig {
  enabled: boolean;
  experiments: Array<{
    id: string;
    name: string;
    enabled: boolean;
    variants: Array<{
      id: string;
      weight: number;
      config: any;
    }>;
    cookieName: string;
    duration: number;
  }>;
}

/**
 * Edge personalization configuration
 */
export interface EdgePersonalizationConfig {
  enabled: boolean;
  rules: Array<{
    id: string;
    type: 'user' | 'geo' | 'language' | 'device';
    criteria: any;
    content: any;
  }>;
}

/**
 * Edge analytics data
 */
export interface EdgeAnalytics {
  requests: number;
  bandwidth: number;
  cacheHitRate: number;
  edgeLatency: number;
  errors: number;
  topCountries: Array<{ country: string; requests: number }>;
  topCities: Array<{ city: string; requests: number }>;
  topUserAgents: Array<{ userAgent: string; requests: number }>;
  timestamp: Date;
}

/**
 * Edge security configuration
 */
export interface EdgeSecurityConfig {
  waf: {
    enabled: boolean;
    rules: Array<{
      id: string;
      name: string;
      pattern: string;
      action: 'block' | 'challenge' | 'log';
    }>;
  };
  botDetection: {
    enabled: boolean;
    challengeGoodBots: boolean;
    blockBadBots: boolean;
  };
  ipReputation: {
    enabled: boolean;
    blockThreshold: number;
  };
}

/**
 * Cloudflare Workers KV store
 */
interface CloudflareKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: Array<{ name: string }> }>;
}

/**
 * Edge function deployment
 */
export interface EdgeDeployment {
  id: string;
  provider: EdgeProvider;
  name: string;
  script: string;
  routes: string[];
  bindings?: Record<string, any>;
  status: 'deploying' | 'active' | 'failed';
  deployedAt?: Date;
  locations: string[];
}

/**
 * Edge computing configuration
 */
export interface EdgeComputingConfig {
  provider: EdgeProvider;
  cloudflare?: {
    apiToken: string;
    accountId: string;
    zoneId?: string;
    workerName: string;
  };
  aws?: {
    region: string;
    distributionId: string;
    functionArn: string;
  };
  routing: EdgeRoutingRule[];
  cache: EdgeCacheConfig;
  auth: EdgeAuthConfig;
  rateLimit: EdgeRateLimitConfig;
  requestTransform: EdgeRequestTransform;
  responseTransform: EdgeResponseTransform;
  abTesting: EdgeABTestConfig;
  personalization: EdgePersonalizationConfig;
  security: EdgeSecurityConfig;
}

/**
 * Rate limit tracker
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked: boolean;
  blockedUntil?: number;
}

/**
 * Edge Computing Manager
 */
export class EdgeComputing extends EventEmitter {
  private config: EdgeComputingConfig;
  private deployments: Map<string, EdgeDeployment>;
  private kvStore: Map<string, { value: string; expiresAt?: number }>;
  private cacheStore: Map<string, { value: any; expiresAt: number }>;
  private rateLimitStore: Map<string, RateLimitEntry>;
  private analytics: EdgeAnalytics;
  private analyticsInterval?: NodeJS.Timeout;

  constructor(config: EdgeComputingConfig) {
    super();
    this.config = config;
    this.deployments = new Map();
    this.kvStore = new Map();
    this.cacheStore = new Map();
    this.rateLimitStore = new Map();

    this.analytics = {
      requests: 0,
      bandwidth: 0,
      cacheHitRate: 0,
      edgeLatency: 0,
      errors: 0,
      topCountries: [],
      topCities: [],
      topUserAgents: [],
      timestamp: new Date(),
    };
  }

  /**
   * Initialize edge computing
   */
  public async initialize(): Promise<void> {
    if (this.config.provider === EdgeProvider.CLOUDFLARE_WORKERS) {
      await this.initializeCloudflareWorkers();
    } else {
      await this.initializeLambdaEdge();
    }

    this.startAnalyticsCollection();
    this.startRateLimitCleanup();

    this.emit('initialized', { timestamp: new Date() });
  }

  /**
   * Initialize Cloudflare Workers
   */
  private async initializeCloudflareWorkers(): Promise<void> {
    if (!this.config.cloudflare) {
      throw new Error('Cloudflare configuration is required');
    }

    const workerScript = this.generateCloudflareWorkerScript();

    try {
      const response = await axios.put(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.cloudflare.accountId}/workers/scripts/${this.config.cloudflare.workerName}`,
        workerScript,
        {
          headers: {
            Authorization: `Bearer ${this.config.cloudflare.apiToken}`,
            'Content-Type': 'application/javascript',
          },
        }
      );

      if (this.config.cloudflare.zoneId) {
        await axios.put(
          `https://api.cloudflare.com/client/v4/zones/${this.config.cloudflare.zoneId}/workers/routes`,
          {
            pattern: '/*',
            script: this.config.cloudflare.workerName,
          },
          {
            headers: {
              Authorization: `Bearer ${this.config.cloudflare.apiToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const deployment: EdgeDeployment = {
        id: response.data.result.id,
        provider: EdgeProvider.CLOUDFLARE_WORKERS,
        name: this.config.cloudflare.workerName,
        script: workerScript,
        routes: ['/*'],
        status: 'active',
        deployedAt: new Date(),
        locations: this.getCloudflareEdgeLocations(),
      };

      this.deployments.set(deployment.id, deployment);
    } catch (error) {
      console.error('Failed to deploy Cloudflare Worker:', error);
      throw error;
    }
  }

  /**
   * Generate Cloudflare Worker script
   */
  private generateCloudflareWorkerScript(): string {
    return `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const request = event.request;
  const url = new URL(request.url);

  // Authentication
  ${this.generateAuthenticationCode()}

  // Rate limiting
  ${this.generateRateLimitingCode()}

  // Request transformation
  ${this.generateRequestTransformCode()}

  // Check cache
  const cacheKey = new Request(url.toString(), request);
  const cache = caches.default;
  let response = await cache.match(cacheKey);

  if (response) {
    // Cache hit
    return response;
  }

  // Fetch from origin
  response = await fetch(request);

  // Response transformation
  ${this.generateResponseTransformCode()}

  // Cache response
  if (response.ok && request.method === 'GET') {
    const responseToCache = response.clone();
    responseToCache.headers.set('Cache-Control', 'max-age=${this.config.cache.ttl}');
    event.waitUntil(cache.put(cacheKey, responseToCache));
  }

  return response;
}

${this.generateHelperFunctions()}
    `.trim();
  }

  /**
   * Generate authentication code for edge function
   */
  private generateAuthenticationCode(): string {
    if (!this.config.auth.enabled) {
      return '// Authentication disabled';
    }

    const code: string[] = [];

    if (this.config.auth.methods.includes('jwt')) {
      code.push(`
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const isValid = await verifyJWT(token);
    if (!isValid) {
      return new Response('Invalid token', { status: 401 });
    }
  } catch (error) {
    return new Response('Token verification failed', { status: 401 });
  }
      `);
    }

    if (this.config.auth.methods.includes('api-key')) {
      const headerName = this.config.auth.apiKey?.headerName || 'X-API-Key';
      code.push(`
  const apiKey = request.headers.get('${headerName}');
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return new Response('Invalid API key', { status: 401 });
  }
      `);
    }

    return code.join('\n');
  }

  /**
   * Generate rate limiting code
   */
  private generateRateLimitingCode(): string {
    if (!this.config.rateLimit.enabled) {
      return '// Rate limiting disabled';
    }

    return `
  const clientIp = request.headers.get('CF-Connecting-IP');
  const rateLimitKey = 'ratelimit:' + clientIp;

  const rateLimitData = await KV.get(rateLimitKey);
  let count = rateLimitData ? parseInt(rateLimitData) : 0;

  if (count >= ${this.config.rateLimit.rules[0]?.limit || 100}) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  count++;
  await KV.put(rateLimitKey, count.toString(), { expirationTtl: ${this.config.rateLimit.rules[0]?.window || 60} });
    `;
  }

  /**
   * Generate request transformation code
   */
  private generateRequestTransformCode(): string {
    const transforms: string[] = [];

    if (this.config.requestTransform.headers?.add) {
      for (const [key, value] of Object.entries(this.config.requestTransform.headers.add)) {
        transforms.push(`request.headers.set('${key}', '${value}');`);
      }
    }

    if (this.config.requestTransform.headers?.remove) {
      for (const key of this.config.requestTransform.headers.remove) {
        transforms.push(`request.headers.delete('${key}');`);
      }
    }

    if (this.config.requestTransform.url?.rewrite) {
      for (const rule of this.config.requestTransform.url.rewrite) {
        transforms.push(`
  if (url.pathname.match(/${rule.from}/)) {
    url.pathname = url.pathname.replace(/${rule.from}/, '${rule.to}');
  }
        `);
      }
    }

    return transforms.join('\n  ');
  }

  /**
   * Generate response transformation code
   */
  private generateResponseTransformCode(): string {
    const transforms: string[] = [];

    if (this.config.responseTransform.compression.enabled) {
      transforms.push(`
  const acceptEncoding = request.headers.get('Accept-Encoding') || '';
  if (acceptEncoding.includes('br')) {
    response = await compressBrotli(response);
  } else if (acceptEncoding.includes('gzip')) {
    response = await compressGzip(response);
  }
      `);
    }

    if (this.config.responseTransform.headers?.add) {
      for (const [key, value] of Object.entries(this.config.responseTransform.headers.add)) {
        transforms.push(`response.headers.set('${key}', '${value}');`);
      }
    }

    return transforms.join('\n  ');
  }

  /**
   * Generate helper functions
   */
  private generateHelperFunctions(): string {
    return `
async function verifyJWT(token) {
  try {
    const payload = parseJWT(token);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

function parseJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT');
  }

  const payload = JSON.parse(atob(parts[1]));
  return payload;
}

async function compressGzip(response) {
  const blob = await response.blob();
  const stream = blob.stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));

  return new Response(compressedStream, {
    headers: {
      ...response.headers,
      'Content-Encoding': 'gzip',
    },
  });
}

async function compressBrotli(response) {
  const blob = await response.blob();
  const stream = blob.stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('br'));

  return new Response(compressedStream, {
    headers: {
      ...response.headers,
      'Content-Encoding': 'br',
    },
  });
}
    `;
  }

  /**
   * Initialize AWS Lambda@Edge
   */
  private async initializeLambdaEdge(): Promise<void> {
    if (!this.config.aws) {
      throw new Error('AWS configuration is required');
    }

    const lambdaCode = this.generateLambdaEdgeCode();

    console.log('Lambda@Edge function generated:', lambdaCode);
  }

  /**
   * Generate Lambda@Edge code
   */
  private generateLambdaEdgeCode(): string {
    return `
exports.handler = async (event, context) => {
  const request = event.Records[0].cf.request;
  const response = event.Records[0].cf.response;

  // Authentication
  ${this.generateAuthenticationCode()}

  // Rate limiting
  ${this.generateRateLimitingCode()}

  // Request transformation
  ${this.generateRequestTransformCode()}

  return request;
};
    `.trim();
  }

  /**
   * Deploy edge function
   */
  public async deploy(script: string, routes: string[]): Promise<EdgeDeployment> {
    const deploymentId = this.generateDeploymentId();

    const deployment: EdgeDeployment = {
      id: deploymentId,
      provider: this.config.provider,
      name: `edge-function-${deploymentId}`,
      script,
      routes,
      status: 'deploying',
      locations: this.getEdgeLocations(),
    };

    this.deployments.set(deploymentId, deployment);

    setTimeout(() => {
      deployment.status = 'active';
      deployment.deployedAt = new Date();
      this.emit('deployed', deployment);
    }, 5000);

    return deployment;
  }

  /**
   * Handle edge request
   */
  public async handleRequest(request: any): Promise<any> {
    const startTime = Date.now();

    try {
      this.analytics.requests++;

      if (this.config.auth.enabled) {
        const authResult = await this.authenticateRequest(request);
        if (!authResult.authenticated) {
          this.analytics.errors++;
          return {
            status: 401,
            body: authResult.message,
            headers: {},
          };
        }
      }

      if (this.config.rateLimit.enabled) {
        const rateLimitResult = this.checkRateLimit(request);
        if (rateLimitResult.limited) {
          this.analytics.errors++;
          return {
            status: 429,
            body: 'Rate limit exceeded',
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            },
          };
        }
      }

      const transformedRequest = this.transformRequest(request);

      if (this.config.cache.enabled) {
        const cacheKey = this.generateCacheKey(transformedRequest);
        const cachedResponse = await this.getFromCache(cacheKey);

        if (cachedResponse) {
          this.analytics.cacheHitRate =
            (this.analytics.cacheHitRate * (this.analytics.requests - 1) + 1) /
            this.analytics.requests;

          return cachedResponse;
        }
      }

      const response = await this.fetchFromOrigin(transformedRequest);

      const transformedResponse = await this.transformResponse(response, request);

      if (this.config.cache.enabled && response.status === 200) {
        const cacheKey = this.generateCacheKey(transformedRequest);
        await this.putInCache(cacheKey, transformedResponse);
      }

      this.analytics.edgeLatency =
        (this.analytics.edgeLatency * (this.analytics.requests - 1) +
          (Date.now() - startTime)) /
        this.analytics.requests;

      return transformedResponse;
    } catch (error) {
      this.analytics.errors++;
      console.error('Edge request handling failed:', error);

      return {
        status: 500,
        body: 'Internal Server Error',
        headers: {},
      };
    }
  }

  /**
   * Authenticate request at edge
   */
  private async authenticateRequest(
    request: any
  ): Promise<{ authenticated: boolean; message?: string; user?: any }> {
    if (this.config.auth.methods.includes('jwt')) {
      const authHeader = request.headers?.['authorization'];
      if (!authHeader) {
        return { authenticated: false, message: 'Authorization header missing' };
      }

      const token = authHeader.replace('Bearer ', '');

      try {
        const payload = await this.verifyJWT(token);
        return { authenticated: true, user: payload };
      } catch (error) {
        return { authenticated: false, message: 'Invalid JWT token' };
      }
    }

    if (this.config.auth.methods.includes('api-key')) {
      const headerName =
        this.config.auth.apiKey?.headerName?.toLowerCase() || 'x-api-key';
      const apiKey = request.headers?.[headerName];

      if (!apiKey) {
        return { authenticated: false, message: 'API key missing' };
      }

      if (!this.config.auth.apiKey?.validKeys.includes(apiKey)) {
        return { authenticated: false, message: 'Invalid API key' };
      }

      return { authenticated: true };
    }

    return { authenticated: true };
  }

  /**
   * Verify JWT token
   */
  private async verifyJWT(token: string): Promise<any> {
    if (!this.config.auth.jwt) {
      throw new Error('JWT configuration missing');
    }

    const secret = new TextEncoder().encode(this.config.auth.jwt.secret);

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: this.config.auth.jwt.issuer,
      audience: this.config.auth.jwt.audience,
      clockTolerance: this.config.auth.jwt.clockTolerance || 30,
    });

    return payload;
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(
    request: any
  ): { limited: boolean; retryAfter?: number } {
    const clientIp = request.headers?.['cf-connecting-ip'] || request.ip;

    for (const rule of this.config.rateLimit.rules) {
      let key: string;

      switch (rule.type) {
        case 'ip':
          key = `ratelimit:ip:${clientIp}`;
          break;
        case 'user':
          key = `ratelimit:user:${request.user?.id || 'anonymous'}`;
          break;
        case 'api-key':
          key = `ratelimit:apikey:${request.headers?.['x-api-key'] || 'none'}`;
          break;
        default:
          continue;
      }

      let entry = this.rateLimitStore.get(key);
      const now = Date.now();

      if (!entry || now > entry.resetAt) {
        entry = {
          count: 0,
          resetAt: now + rule.window * 1000,
          blocked: false,
        };
        this.rateLimitStore.set(key, entry);
      }

      if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
        return {
          limited: true,
          retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        };
      }

      entry.count++;

      if (entry.count > rule.limit) {
        entry.blocked = true;
        entry.blockedUntil = now + (rule.blockDuration || 60) * 1000;

        return {
          limited: true,
          retryAfter: rule.blockDuration || 60,
        };
      }
    }

    return { limited: false };
  }

  /**
   * Transform request
   */
  private transformRequest(request: any): any {
    const transformed = { ...request };

    if (this.config.requestTransform.headers?.add) {
      transformed.headers = {
        ...transformed.headers,
        ...this.config.requestTransform.headers.add,
      };
    }

    if (this.config.requestTransform.headers?.remove) {
      for (const header of this.config.requestTransform.headers.remove) {
        delete transformed.headers[header.toLowerCase()];
      }
    }

    if (this.config.requestTransform.url?.rewrite) {
      for (const rule of this.config.requestTransform.url.rewrite) {
        const regex = new RegExp(rule.from);
        if (regex.test(transformed.url)) {
          transformed.url = transformed.url.replace(regex, rule.to);
        }
      }
    }

    if (this.config.requestTransform.queryParams?.add) {
      const url = new URL(transformed.url);
      for (const [key, value] of Object.entries(
        this.config.requestTransform.queryParams.add
      )) {
        url.searchParams.set(key, value);
      }
      transformed.url = url.toString();
    }

    return transformed;
  }

  /**
   * Transform response
   */
  private async transformResponse(response: any, request: any): Promise<any> {
    let transformed = { ...response };

    if (this.config.responseTransform.compression.enabled) {
      const acceptEncoding = request.headers?.['accept-encoding'] || '';
      const bodySize = JSON.stringify(response.body).length;

      if (bodySize >= this.config.responseTransform.compression.minSize) {
        if (acceptEncoding.includes('br')) {
          const compressed = await brotliCompressAsync(
            Buffer.from(JSON.stringify(response.body))
          );
          transformed.body = compressed;
          transformed.headers = {
            ...transformed.headers,
            'content-encoding': 'br',
          };
        } else if (acceptEncoding.includes('gzip')) {
          const compressed = await gzipAsync(
            Buffer.from(JSON.stringify(response.body))
          );
          transformed.body = compressed;
          transformed.headers = {
            ...transformed.headers,
            'content-encoding': 'gzip',
          };
        }
      }
    }

    if (this.config.responseTransform.headers?.add) {
      transformed.headers = {
        ...transformed.headers,
        ...this.config.responseTransform.headers.add,
      };
    }

    if (this.config.responseTransform.headers?.remove) {
      for (const header of this.config.responseTransform.headers.remove) {
        delete transformed.headers[header.toLowerCase()];
      }
    }

    return transformed;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: any): string {
    switch (this.config.cache.keyStrategy) {
      case 'url':
        return createHash('sha256').update(request.url).digest('hex');

      case 'url-query':
        const url = new URL(request.url);
        return createHash('sha256')
          .update(url.pathname + url.search)
          .digest('hex');

      case 'url-headers':
        const headersStr = JSON.stringify(request.headers || {});
        return createHash('sha256')
          .update(request.url + headersStr)
          .digest('hex');

      case 'custom':
        if (this.config.cache.customKeyGenerator) {
          return this.config.cache.customKeyGenerator(request);
        }
        return createHash('sha256').update(request.url).digest('hex');

      default:
        return createHash('sha256').update(request.url).digest('hex');
    }
  }

  /**
   * Get from cache
   */
  private async getFromCache(key: string): Promise<any | null> {
    const entry = this.cacheStore.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.cacheStore.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Put in cache
   */
  private async putInCache(key: string, value: any): Promise<void> {
    this.cacheStore.set(key, {
      value,
      expiresAt: Date.now() + this.config.cache.ttl * 1000,
    });
  }

  /**
   * Invalidate cache
   */
  public async invalidateCache(strategy: 'url' | 'tag' | 'purge-all', value?: string): Promise<void> {
    switch (strategy) {
      case 'url':
        if (value) {
          const key = createHash('sha256').update(value).digest('hex');
          this.cacheStore.delete(key);
        }
        break;

      case 'tag':
        break;

      case 'purge-all':
        this.cacheStore.clear();
        break;
    }

    if (this.config.provider === EdgeProvider.CLOUDFLARE_WORKERS && this.config.cloudflare) {
      await axios.post(
        `https://api.cloudflare.com/client/v4/zones/${this.config.cloudflare.zoneId}/purge_cache`,
        { purge_everything: strategy === 'purge-all' },
        {
          headers: {
            Authorization: `Bearer ${this.config.cloudflare.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  /**
   * Fetch from origin
   */
  private async fetchFromOrigin(request: any): Promise<any> {
    try {
      const response = await axios({
        method: request.method || 'GET',
        url: request.url,
        headers: request.headers,
        data: request.body,
      });

      return {
        status: response.status,
        headers: response.headers,
        body: response.data,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        headers: error.response?.headers || {},
        body: error.response?.data || 'Internal Server Error',
      };
    }
  }

  /**
   * Perform A/B test assignment
   */
  public assignABTestVariant(
    experimentId: string,
    userId: string
  ): { variantId: string; config: any } | null {
    const experiment = this.config.abTesting.experiments.find(
      (exp) => exp.id === experimentId && exp.enabled
    );

    if (!experiment) {
      return null;
    }

    const hash = createHash('sha256').update(userId + experimentId).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    const targetWeight = (hashValue % totalWeight) + 1;

    let currentWeight = 0;
    for (const variant of experiment.variants) {
      currentWeight += variant.weight;
      if (targetWeight <= currentWeight) {
        return {
          variantId: variant.id,
          config: variant.config,
        };
      }
    }

    return null;
  }

  /**
   * Get edge locations
   */
  private getEdgeLocations(): string[] {
    if (this.config.provider === EdgeProvider.CLOUDFLARE_WORKERS) {
      return this.getCloudflareEdgeLocations();
    } else {
      return this.getAWSEdgeLocations();
    }
  }

  /**
   * Get Cloudflare edge locations
   */
  private getCloudflareEdgeLocations(): string[] {
    return [
      'Amsterdam', 'Atlanta', 'Ashburn', 'Bangkok', 'Barcelona', 'Beijing',
      'Berlin', 'Bogotá', 'Brussels', 'Bucharest', 'Budapest', 'Buenos Aires',
      'Calgary', 'Cape Town', 'Chennai', 'Chicago', 'Copenhagen', 'Dallas',
      'Denver', 'Dubai', 'Dublin', 'Frankfurt', 'Geneva', 'Hamburg', 'Helsinki',
      'Hong Kong', 'Houston', 'Istanbul', 'Jacksonville', 'Johannesburg',
      'Kansas City', 'London', 'Los Angeles', 'Madrid', 'Manchester', 'Manila',
      'Marseille', 'Melbourne', 'Mexico City', 'Miami', 'Milan', 'Minneapolis',
      'Montreal', 'Moscow', 'Mumbai', 'Munich', 'Nagoya', 'New York', 'Newark',
      'Osaka', 'Oslo', 'Paris', 'Perth', 'Phoenix', 'Prague', 'Richmond',
      'Rome', 'San Jose', 'Santiago', 'São Paulo', 'Seattle', 'Seoul',
      'Singapore', 'Sofia', 'Stockholm', 'Sydney', 'Taipei', 'Tokyo', 'Toronto',
      'Vienna', 'Warsaw', 'Washington DC', 'Zurich',
    ];
  }

  /**
   * Get AWS edge locations
   */
  private getAWSEdgeLocations(): string[] {
    return [
      'Atlanta', 'Boston', 'Chicago', 'Dallas', 'Denver', 'Los Angeles',
      'Miami', 'Minneapolis', 'Montreal', 'New York', 'Newark', 'Palo Alto',
      'Phoenix', 'San Jose', 'Seattle', 'South Bend', 'Toronto', 'Amsterdam',
      'Berlin', 'Copenhagen', 'Dublin', 'Frankfurt', 'Helsinki', 'London',
      'Madrid', 'Manchester', 'Marseille', 'Milan', 'Munich', 'Oslo', 'Palermo',
      'Paris', 'Stockholm', 'Vienna', 'Warsaw', 'Zurich', 'Bangalore', 'Chennai',
      'Hong Kong', 'Hyderabad', 'Jakarta', 'Kuala Lumpur', 'Manila', 'Mumbai',
      'New Delhi', 'Osaka', 'Seoul', 'Singapore', 'Taipei', 'Tokyo',
      'Melbourne', 'Perth', 'Sydney', 'Cape Town', 'Johannesburg', 'São Paulo',
    ];
  }

  /**
   * Generate deployment ID
   */
  private generateDeploymentId(): string {
    return createHash('sha256')
      .update(Date.now().toString() + Math.random().toString())
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Start analytics collection
   */
  private startAnalyticsCollection(): void {
    this.analyticsInterval = setInterval(() => {
      this.emit('analyticsUpdated', this.analytics);
    }, 60000);
  }

  /**
   * Start rate limit cleanup
   */
  private startRateLimitCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.rateLimitStore.entries()) {
        if (entry.resetAt < now) {
          this.rateLimitStore.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Get analytics
   */
  public getAnalytics(): EdgeAnalytics {
    return this.analytics;
  }

  /**
   * Get deployments
   */
  public getDeployments(): EdgeDeployment[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Get deployment by ID
   */
  public getDeployment(id: string): EdgeDeployment | undefined {
    return this.deployments.get(id);
  }

  /**
   * Shutdown edge computing
   */
  public shutdown(): void {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }

    this.emit('shutdown', { timestamp: new Date() });
  }
}
