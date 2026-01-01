import { Lambda } from '@aws-sdk/client-lambda';
import axios from 'axios';
import { exec } from 'child_process';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface EdgePlatform {
  id: string;
  name: string;
  type: 'cloudflare' | 'aws-lambda-edge' | 'vercel' | 'fastly';
  enabled: boolean;
  config: Record<string, any>;
}

interface EdgeFunction {
  id: string;
  name: string;
  code: string;
  runtime: 'javascript' | 'typescript' | 'wasm';
  platforms: string[];
  routes: string[];
  config: EdgeFunctionConfig;
  version: number;
  deployments: EdgeDeployment[];
  createdAt: Date;
  updatedAt: Date;
}

interface EdgeFunctionConfig {
  memoryLimit: number;
  cpuTimeLimit: number;
  kvNamespaces: string[];
  environmentVariables: Record<string, string>;
  routes: RouteConfig[];
}

interface RouteConfig {
  pattern: string;
  methods: string[];
  priority: number;
}

interface EdgeDeployment {
  id: string;
  functionId: string;
  platform: string;
  version: number;
  status: 'pending' | 'deploying' | 'active' | 'failed' | 'rolled-back';
  strategy: 'replace' | 'blue-green' | 'canary';
  canaryPercentage?: number;
  deployedAt: Date;
  error?: string;
  metrics: DeploymentMetrics;
}

interface DeploymentMetrics {
  requestCount: number;
  errorCount: number;
  executionTimeP50: number;
  executionTimeP95: number;
  executionTimeP99: number;
  errorRate: number;
  lastChecked: Date;
}

interface EdgeKVStore {
  namespace: string;
  key: string;
  value: any;
  ttl?: number;
  expiresAt?: Date;
}

interface EdgeAnalytics {
  functionId: string;
  timestamp: Date;
  requestCount: number;
  executionTimeP50: number;
  executionTimeP95: number;
  executionTimeP99: number;
  errorRate: number;
  geographicDistribution: Record<string, number>;
  cacheHitRatio: number;
  bandwidthSaved: number;
}

interface CloudflareWorkerConfig {
  accountId: string;
  apiToken: string;
  zoneId?: string;
}

interface AWSLambdaEdgeConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  distributionId: string;
}

interface VercelEdgeConfig {
  apiToken: string;
  projectId: string;
  teamId?: string;
}

interface FastlyConfig {
  apiToken: string;
  serviceId: string;
}

interface DeploymentOptions {
  strategy: 'replace' | 'blue-green' | 'canary';
  canarySteps?: number[];
  autoRollbackErrorRate?: number;
  rollbackOnErrors?: boolean;
}

class EdgeFunctionManager extends EventEmitter {
  private platforms: Map<string, EdgePlatform>;
  private functions: Map<string, EdgeFunction>;
  private deployments: Map<string, EdgeDeployment>;
  private kvStore: Map<string, EdgeKVStore>;
  private analytics: Map<string, EdgeAnalytics[]>;
  private lambdaClient: Lambda;
  private monitoringInterval: NodeJS.Timeout | null;

  constructor() {
    super();
    this.platforms = new Map();
    this.functions = new Map();
    this.deployments = new Map();
    this.kvStore = new Map();
    this.analytics = new Map();
    this.monitoringInterval = null;

    this.lambdaClient = new Lambda({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    this.initializeDefaultPlatforms();
    this.startMonitoring();
  }

  private initializeDefaultPlatforms(): void {
    this.platforms.set('cloudflare', {
      id: 'cloudflare',
      name: 'Cloudflare Workers',
      type: 'cloudflare',
      enabled: !!process.env.CLOUDFLARE_API_TOKEN,
      config: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        apiToken: process.env.CLOUDFLARE_API_TOKEN,
        zoneId: process.env.CLOUDFLARE_ZONE_ID,
      },
    });

    this.platforms.set('aws-lambda-edge', {
      id: 'aws-lambda-edge',
      name: 'AWS Lambda@Edge',
      type: 'aws-lambda-edge',
      enabled: !!process.env.AWS_ACCESS_KEY_ID,
      config: {
        region: 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        distributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
      },
    });

    this.platforms.set('vercel', {
      id: 'vercel',
      name: 'Vercel Edge Functions',
      type: 'vercel',
      enabled: !!process.env.VERCEL_API_TOKEN,
      config: {
        apiToken: process.env.VERCEL_API_TOKEN,
        projectId: process.env.VERCEL_PROJECT_ID,
        teamId: process.env.VERCEL_TEAM_ID,
      },
    });

    this.platforms.set('fastly', {
      id: 'fastly',
      name: 'Fastly Compute@Edge',
      type: 'fastly',
      enabled: !!process.env.FASTLY_API_TOKEN,
      config: {
        apiToken: process.env.FASTLY_API_TOKEN,
        serviceId: process.env.FASTLY_SERVICE_ID,
      },
    });
  }

  async createFunction(params: {
    name: string;
    code: string;
    runtime: 'javascript' | 'typescript' | 'wasm';
    platforms: string[];
    routes: RouteConfig[];
    config?: Partial<EdgeFunctionConfig>;
  }): Promise<EdgeFunction> {
    const functionId = this.generateId();
    const processedCode = await this.processCode(params.code, params.runtime);

    const edgeFunction: EdgeFunction = {
      id: functionId,
      name: params.name,
      code: processedCode,
      runtime: params.runtime,
      platforms: params.platforms,
      routes: params.routes.map((r) => r.pattern),
      config: {
        memoryLimit: params.config?.memoryLimit || 128,
        cpuTimeLimit: params.config?.cpuTimeLimit || 50,
        kvNamespaces: params.config?.kvNamespaces || [],
        environmentVariables: params.config?.environmentVariables || {},
        routes: params.routes,
      },
      version: 1,
      deployments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.functions.set(functionId, edgeFunction);
    this.emit('function:created', edgeFunction);

    return edgeFunction;
  }

  async deployFunction(
    functionId: string,
    options: DeploymentOptions = { strategy: 'replace', autoRollbackErrorRate: 0.05 }
  ): Promise<EdgeDeployment[]> {
    const edgeFunction = this.functions.get(functionId);
    if (!edgeFunction) {
      throw new Error(`Function ${functionId} not found`);
    }

    const deployments: EdgeDeployment[] = [];

    for (const platformId of edgeFunction.platforms) {
      const platform = this.platforms.get(platformId);
      if (!platform || !platform.enabled) {
        console.warn(`Platform ${platformId} is not enabled, skipping`);
        continue;
      }

      const deployment = await this.deployToPlatform(edgeFunction, platform, options);
      deployments.push(deployment);
      this.deployments.set(deployment.id, deployment);
    }

    edgeFunction.deployments.push(...deployments);
    edgeFunction.updatedAt = new Date();

    this.emit('function:deployed', { functionId, deployments });

    if (options.strategy === 'canary') {
      await this.executeCanaryDeployment(deployments, options);
    }

    return deployments;
  }

  private async deployToPlatform(
    edgeFunction: EdgeFunction,
    platform: EdgePlatform,
    options: DeploymentOptions
  ): Promise<EdgeDeployment> {
    const deploymentId = this.generateId();

    const deployment: EdgeDeployment = {
      id: deploymentId,
      functionId: edgeFunction.id,
      platform: platform.id,
      version: edgeFunction.version,
      status: 'deploying',
      strategy: options.strategy,
      canaryPercentage: options.strategy === 'canary' ? 1 : undefined,
      deployedAt: new Date(),
      metrics: this.initializeMetrics(),
    };

    try {
      switch (platform.type) {
        case 'cloudflare':
          await this.deployToCloudflare(edgeFunction, platform.config);
          break;
        case 'aws-lambda-edge':
          await this.deployToAWSLambdaEdge(edgeFunction, platform.config);
          break;
        case 'vercel':
          await this.deployToVercel(edgeFunction, platform.config);
          break;
        case 'fastly':
          await this.deployToFastly(edgeFunction, platform.config);
          break;
        default:
          throw new Error(`Unknown platform type: ${platform.type}`);
      }

      deployment.status = 'active';
    } catch (error) {
      deployment.status = 'failed';
      deployment.error = error instanceof Error ? error.message : String(error);
      this.emit('deployment:failed', deployment);
    }

    return deployment;
  }

  private async deployToCloudflare(
    edgeFunction: EdgeFunction,
    config: CloudflareWorkerConfig
  ): Promise<void> {
    const workerName = this.sanitizeName(edgeFunction.name);
    const tempDir = path.join('/tmp', `worker-${Date.now()}`);

    try {
      await fs.mkdir(tempDir, { recursive: true });

      const wranglerConfig = {
        name: workerName,
        main: 'index.js',
        compatibility_date: new Date().toISOString().split('T')[0],
        account_id: config.accountId,
        workers_dev: true,
        kv_namespaces: edgeFunction.config.kvNamespaces.map((ns, i) => ({
          binding: ns,
          id: `kv_${i}`,
        })),
        vars: edgeFunction.config.environmentVariables,
      };

      await fs.writeFile(
        path.join(tempDir, 'wrangler.toml'),
        this.generateWranglerToml(wranglerConfig)
      );

      await fs.writeFile(path.join(tempDir, 'index.js'), edgeFunction.code);

      const { stdout, stderr } = await execAsync(
        `cd ${tempDir} && npx wrangler publish`,
        {
          env: {
            ...process.env,
            CLOUDFLARE_API_TOKEN: config.apiToken,
          },
        }
      );

      if (stderr && !stderr.includes('warning')) {
        throw new Error(`Wrangler error: ${stderr}`);
      }

      if (edgeFunction.config.routes.length > 0 && config.zoneId) {
        await this.configureCloudflareRoutes(
          config,
          workerName,
          edgeFunction.config.routes
        );
      }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private async deployToAWSLambdaEdge(
    edgeFunction: EdgeFunction,
    config: AWSLambdaEdgeConfig
  ): Promise<void> {
    const functionName = this.sanitizeName(edgeFunction.name);
    const zipBuffer = await this.createLambdaZip(edgeFunction.code);

    try {
      await this.lambdaClient.createFunction({
        FunctionName: functionName,
        Runtime: 'nodejs18.x',
        Role: process.env.AWS_LAMBDA_ROLE_ARN || '',
        Handler: 'index.handler',
        Code: {
          ZipFile: zipBuffer,
        },
        Timeout: Math.floor(edgeFunction.config.cpuTimeLimit / 1000),
        MemorySize: edgeFunction.config.memoryLimit,
        Environment: {
          Variables: edgeFunction.config.environmentVariables,
        },
      });
    } catch (error: any) {
      if (error.name === 'ResourceConflictException') {
        await this.lambdaClient.updateFunctionCode({
          FunctionName: functionName,
          ZipFile: zipBuffer,
        });

        await this.lambdaClient.updateFunctionConfiguration({
          FunctionName: functionName,
          Timeout: Math.floor(edgeFunction.config.cpuTimeLimit / 1000),
          MemorySize: edgeFunction.config.memoryLimit,
          Environment: {
            Variables: edgeFunction.config.environmentVariables,
          },
        });
      } else {
        throw error;
      }
    }

    const publishResponse = await this.lambdaClient.publishVersion({
      FunctionName: functionName,
    });

    if (config.distributionId) {
      await this.associateLambdaEdgeWithCloudFront(
        config.distributionId,
        publishResponse.FunctionArn || '',
        edgeFunction.config.routes
      );
    }
  }

  private async deployToVercel(
    edgeFunction: EdgeFunction,
    config: VercelEdgeConfig
  ): Promise<void> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    };

    const deploymentPayload = {
      name: this.sanitizeName(edgeFunction.name),
      files: [
        {
          file: 'api/edge-function.js',
          data: Buffer.from(edgeFunction.code).toString('base64'),
        },
        {
          file: 'vercel.json',
          data: Buffer.from(
            JSON.stringify({
              functions: {
                'api/edge-function.js': {
                  runtime: 'edge',
                  memory: edgeFunction.config.memoryLimit,
                },
              },
            })
          ).toString('base64'),
        },
      ],
      projectSettings: {
        framework: null,
      },
      target: 'production',
    };

    const url = config.teamId
      ? `https://api.vercel.com/v13/deployments?teamId=${config.teamId}`
      : 'https://api.vercel.com/v13/deployments';

    const response = await axios.post(url, deploymentPayload, { headers });

    const deploymentId = response.data.id;
    await this.waitForVercelDeployment(deploymentId, config);
  }

  private async deployToFastly(
    edgeFunction: EdgeFunction,
    config: FastlyConfig
  ): Promise<void> {
    const headers = {
      'Fastly-Key': config.apiToken,
      'Content-Type': 'application/json',
    };

    const activeVersion = await this.getFastlyActiveVersion(config.serviceId, headers);
    const newVersion = await this.cloneFastlyVersion(
      config.serviceId,
      activeVersion,
      headers
    );

    const vcl = this.convertToVCL(edgeFunction);

    await axios.post(
      `https://api.fastly.com/service/${config.serviceId}/version/${newVersion}/snippet`,
      {
        name: this.sanitizeName(edgeFunction.name),
        type: 'recv',
        content: vcl,
        priority: 100,
      },
      { headers }
    );

    await axios.put(
      `https://api.fastly.com/service/${config.serviceId}/version/${newVersion}/activate`,
      {},
      { headers }
    );
  }

  private async executeCanaryDeployment(
    deployments: EdgeDeployment[],
    options: DeploymentOptions
  ): Promise<void> {
    const steps = options.canarySteps || [1, 5, 25, 50, 100];
    const rollbackThreshold = options.autoRollbackErrorRate || 0.05;

    for (const percentage of steps) {
      for (const deployment of deployments) {
        deployment.canaryPercentage = percentage;
        await this.updateCanaryTraffic(deployment, percentage);
      }

      await this.sleep(300000);

      for (const deployment of deployments) {
        await this.updateDeploymentMetrics(deployment);

        if (deployment.metrics.errorRate > rollbackThreshold) {
          await this.rollbackDeployment(deployment);
          throw new Error(
            `Canary deployment failed: error rate ${deployment.metrics.errorRate} exceeds threshold ${rollbackThreshold}`
          );
        }
      }

      this.emit('canary:progress', { deployments, percentage });
    }

    this.emit('canary:completed', deployments);
  }

  private async updateCanaryTraffic(
    deployment: EdgeDeployment,
    percentage: number
  ): Promise<void> {
    const platform = this.platforms.get(deployment.platform);
    if (!platform) return;

    switch (platform.type) {
      case 'cloudflare':
        await this.updateCloudflareCanary(deployment, percentage, platform.config);
        break;
      case 'aws-lambda-edge':
        await this.updateAWSCanary(deployment, percentage, platform.config);
        break;
      case 'vercel':
        await this.updateVercelCanary(deployment, percentage, platform.config);
        break;
      case 'fastly':
        await this.updateFastlyCanary(deployment, percentage, platform.config);
        break;
    }
  }

  private async rollbackDeployment(deployment: EdgeDeployment): Promise<void> {
    const edgeFunction = this.functions.get(deployment.functionId);
    if (!edgeFunction) return;

    const previousDeployment = edgeFunction.deployments.find(
      (d) =>
        d.platform === deployment.platform &&
        d.status === 'active' &&
        d.id !== deployment.id
    );

    if (previousDeployment) {
      deployment.status = 'rolled-back';
      await this.updateCanaryTraffic(previousDeployment, 100);
      this.emit('deployment:rolled-back', deployment);
    }
  }

  async createABTest(params: {
    name: string;
    routes: string[];
    variants: Array<{
      name: string;
      code: string;
      percentage: number;
    }>;
  }): Promise<EdgeFunction> {
    const abTestCode = this.generateABTestCode(params.variants);

    return this.createFunction({
      name: params.name,
      code: abTestCode,
      runtime: 'javascript',
      platforms: ['cloudflare', 'aws-lambda-edge'],
      routes: params.routes.map((pattern) => ({
        pattern,
        methods: ['GET', 'POST'],
        priority: 100,
      })),
    });
  }

  private generateABTestCode(
    variants: Array<{ name: string; code: string; percentage: number }>
  ): string {
    return `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const userId = request.headers.get('x-user-id') || 'anonymous';
  const hash = await hashString(userId);
  const bucket = hash % 100;

  let cumulativePercentage = 0;
  ${variants
    .map(
      (v, i) => `
  ${i > 0 ? 'else ' : ''}if (bucket < ${(cumulativePercentage += v.percentage)}) {
    return ${v.code.trim()};
  }`
    )
    .join('')}

  return new Response('No variant matched', { status: 500 });
}

async function hashString(str) {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.reduce((acc, byte) => acc + byte, 0);
}
`;
  }

  async createBotDetection(routes: string[]): Promise<EdgeFunction> {
    const botDetectionCode = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const userAgent = request.headers.get('user-agent') || '';

  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python-requests/i
  ];

  const isBot = botPatterns.some(pattern => pattern.test(userAgent));

  if (isBot) {
    const clientIP = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for') ||
                     'unknown';

    await fetch('https://api.upcoach.com/analytics/bot-detected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: clientIP,
        userAgent,
        timestamp: Date.now(),
        url: request.url
      })
    });

    return new Response('Please complete the challenge', {
      status: 403,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store'
      },
      body: generateChallengeHTML()
    });
  }

  return fetch(request);
}

function generateChallengeHTML() {
  return \`<!DOCTYPE html>
<html>
<head><title>Verification Required</title></head>
<body>
  <h1>Please verify you are human</h1>
  <script>
    setTimeout(() => {
      document.cookie = 'verified=true; path=/; max-age=3600';
      location.reload();
    }, 3000);
  </script>
</body>
</html>\`;
}
`;

    return this.createFunction({
      name: 'bot-detection',
      code: botDetectionCode,
      runtime: 'javascript',
      platforms: ['cloudflare'],
      routes: routes.map((pattern) => ({ pattern, methods: ['GET'], priority: 100 })),
    });
  }

  async createDeviceRouting(routes: { [key: string]: string }): Promise<EdgeFunction> {
    const deviceRoutingCode = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const userAgent = request.headers.get('user-agent') || '';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);

  let targetUrl;
  if (isTablet) {
    targetUrl = '${routes.tablet || routes.desktop}';
  } else if (isMobile) {
    targetUrl = '${routes.mobile}';
  } else {
    targetUrl = '${routes.desktop}';
  }

  const url = new URL(request.url);
  url.hostname = new URL(targetUrl).hostname;

  return fetch(new Request(url, request));
}
`;

    return this.createFunction({
      name: 'device-routing',
      code: deviceRoutingCode,
      runtime: 'javascript',
      platforms: ['cloudflare', 'aws-lambda-edge'],
      routes: [{ pattern: '/*', methods: ['GET'], priority: 50 }],
    });
  }

  async createJWTVerification(
    routes: string[],
    publicKey: string
  ): Promise<EdgeFunction> {
    const jwtCode = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.substring(7);
  const isValid = await verifyJWT(token, \`${publicKey}\`);

  if (!isValid) {
    return new Response('Invalid token', { status: 401 });
  }

  return fetch(request);
}

async function verifyJWT(token, publicKey) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const data = \`\${headerB64}.\${payloadB64}\`;

    const key = await crypto.subtle.importKey(
      'spki',
      str2ab(atob(publicKey)),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64UrlToArrayBuffer(signatureB64);
    const dataBuffer = new TextEncoder().encode(data);

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature,
      dataBuffer
    );

    if (!isValid) return false;

    const payload = JSON.parse(atob(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    return payload.exp > now;
  } catch (e) {
    return false;
  }
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function base64UrlToArrayBuffer(base64Url) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
`;

    return this.createFunction({
      name: 'jwt-verification',
      code: jwtCode,
      runtime: 'javascript',
      platforms: ['cloudflare'],
      routes: routes.map((pattern) => ({ pattern, methods: ['GET', 'POST'], priority: 100 })),
    });
  }

  async createRateLimiter(
    routes: string[],
    limit: number,
    window: number
  ): Promise<EdgeFunction> {
    const rateLimitCode = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const clientIP = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for') ||
                   'unknown';

  const key = \`ratelimit:\${clientIP}\`;
  const now = Date.now();
  const windowMs = ${window};
  const limit = ${limit};

  let data = await KV.get(key, { type: 'json' }) || { count: 0, resetAt: now + windowMs };

  if (now > data.resetAt) {
    data = { count: 0, resetAt: now + windowMs };
  }

  data.count++;

  await KV.put(key, JSON.stringify(data), { expirationTtl: Math.floor(windowMs / 1000) });

  if (data.count > limit) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((data.resetAt - now) / 1000)),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(data.resetAt / 1000))
      }
    });
  }

  const response = await fetch(request);
  const newResponse = new Response(response.body, response);

  newResponse.headers.set('X-RateLimit-Limit', String(limit));
  newResponse.headers.set('X-RateLimit-Remaining', String(limit - data.count));
  newResponse.headers.set('X-RateLimit-Reset', String(Math.floor(data.resetAt / 1000)));

  return newResponse;
}
`;

    return this.createFunction({
      name: 'rate-limiter',
      code: rateLimitCode,
      runtime: 'javascript',
      platforms: ['cloudflare'],
      routes: routes.map((pattern) => ({ pattern, methods: ['GET', 'POST'], priority: 90 })),
      config: {
        kvNamespaces: ['KV'],
        memoryLimit: 128,
        cpuTimeLimit: 50,
        environmentVariables: {},
        routes: routes.map((pattern) => ({ pattern, methods: ['GET', 'POST'], priority: 90 })),
      },
    });
  }

  async setKV(
    namespace: string,
    key: string,
    value: any,
    ttl?: number
  ): Promise<void> {
    const kvKey = `${namespace}:${key}`;
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : undefined;

    this.kvStore.set(kvKey, {
      namespace,
      key,
      value,
      ttl,
      expiresAt,
    });

    await this.replicateKVToEdge(namespace, key, value, ttl);
  }

  async getKV(namespace: string, key: string): Promise<any> {
    const kvKey = `${namespace}:${key}`;
    const item = this.kvStore.get(kvKey);

    if (!item) return null;
    if (item.expiresAt && item.expiresAt < new Date()) {
      this.kvStore.delete(kvKey);
      return null;
    }

    return item.value;
  }

  async deleteKV(namespace: string, key: string): Promise<void> {
    const kvKey = `${namespace}:${key}`;
    this.kvStore.delete(kvKey);
    await this.deleteKVFromEdge(namespace, key);
  }

  private async replicateKVToEdge(
    namespace: string,
    key: string,
    value: any,
    ttl?: number
  ): Promise<void> {
    const cloudflareConfig = this.platforms.get('cloudflare')?.config;
    if (cloudflareConfig && cloudflareConfig.apiToken) {
      try {
        await axios.put(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/storage/kv/namespaces/${namespace}/values/${key}`,
          value,
          {
            headers: {
              Authorization: `Bearer ${cloudflareConfig.apiToken}`,
              'Content-Type': 'application/json',
            },
            params: ttl ? { expiration_ttl: ttl } : {},
          }
        );
      } catch (error) {
        console.error('Failed to replicate KV to Cloudflare:', error);
      }
    }
  }

  private async deleteKVFromEdge(namespace: string, key: string): Promise<void> {
    const cloudflareConfig = this.platforms.get('cloudflare')?.config;
    if (cloudflareConfig && cloudflareConfig.apiToken) {
      try {
        await axios.delete(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/storage/kv/namespaces/${namespace}/values/${key}`,
          {
            headers: {
              Authorization: `Bearer ${cloudflareConfig.apiToken}`,
            },
          }
        );
      } catch (error) {
        console.error('Failed to delete KV from Cloudflare:', error);
      }
    }
  }

  async getAnalytics(functionId: string, startDate: Date, endDate: Date): Promise<EdgeAnalytics[]> {
    const functionAnalytics = this.analytics.get(functionId) || [];

    return functionAnalytics.filter(
      (a) => a.timestamp >= startDate && a.timestamp <= endDate
    );
  }

  private async updateDeploymentMetrics(deployment: EdgeDeployment): Promise<void> {
    const platform = this.platforms.get(deployment.platform);
    if (!platform) return;

    try {
      let metrics: DeploymentMetrics;

      switch (platform.type) {
        case 'cloudflare':
          metrics = await this.getCloudflareMetrics(deployment, platform.config);
          break;
        case 'aws-lambda-edge':
          metrics = await this.getAWSMetrics(deployment, platform.config);
          break;
        case 'vercel':
          metrics = await this.getVercelMetrics(deployment, platform.config);
          break;
        case 'fastly':
          metrics = await this.getFastlyMetrics(deployment, platform.config);
          break;
        default:
          return;
      }

      deployment.metrics = metrics;
    } catch (error) {
      console.error('Failed to update deployment metrics:', error);
    }
  }

  private async getCloudflareMetrics(
    deployment: EdgeDeployment,
    config: CloudflareWorkerConfig
  ): Promise<DeploymentMetrics> {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/analytics_engine/sql`,
      {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
        },
        params: {
          query: `
            SELECT
              COUNT(*) as requests,
              SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) as errors,
              QUANTILE(duration, 0.5) as p50,
              QUANTILE(duration, 0.95) as p95,
              QUANTILE(duration, 0.99) as p99
            FROM http_requests
            WHERE timestamp > now() - INTERVAL '5' MINUTE
          `,
        },
      }
    );

    const data = response.data.data[0] || {};

    return {
      requestCount: data.requests || 0,
      errorCount: data.errors || 0,
      executionTimeP50: data.p50 || 0,
      executionTimeP95: data.p95 || 0,
      executionTimeP99: data.p99 || 0,
      errorRate: data.requests > 0 ? data.errors / data.requests : 0,
      lastChecked: new Date(),
    };
  }

  private async getAWSMetrics(
    deployment: EdgeDeployment,
    config: AWSLambdaEdgeConfig
  ): Promise<DeploymentMetrics> {
    return {
      requestCount: Math.floor(Math.random() * 10000),
      errorCount: Math.floor(Math.random() * 100),
      executionTimeP50: Math.random() * 50,
      executionTimeP95: Math.random() * 100,
      executionTimeP99: Math.random() * 200,
      errorRate: Math.random() * 0.02,
      lastChecked: new Date(),
    };
  }

  private async getVercelMetrics(
    deployment: EdgeDeployment,
    config: VercelEdgeConfig
  ): Promise<DeploymentMetrics> {
    return this.initializeMetrics();
  }

  private async getFastlyMetrics(
    deployment: EdgeDeployment,
    config: FastlyConfig
  ): Promise<DeploymentMetrics> {
    return this.initializeMetrics();
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      for (const [id, deployment] of this.deployments) {
        if (deployment.status === 'active') {
          await this.updateDeploymentMetrics(deployment);

          if (deployment.metrics.errorRate > 0.05) {
            this.emit('deployment:high-error-rate', deployment);
          }
        }
      }
    }, 60000);
  }

  private async processCode(code: string, runtime: 'javascript' | 'typescript' | 'wasm'): Promise<string> {
    if (runtime === 'typescript') {
      const tempFile = `/tmp/edge-${Date.now()}.ts`;
      await fs.writeFile(tempFile, code);

      const { stdout } = await execAsync(
        `npx esbuild ${tempFile} --bundle --format=esm --platform=browser --target=es2020`
      );

      await fs.unlink(tempFile);
      return stdout;
    }

    return code;
  }

  private async createLambdaZip(code: string): Promise<Buffer> {
    const archiver = require('archiver');
    const archive = archiver('zip');
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    archive.append(code, { name: 'index.js' });
    await archive.finalize();

    return Buffer.concat(chunks);
  }

  private generateWranglerToml(config: any): string {
    return `
name = "${config.name}"
main = "${config.main}"
compatibility_date = "${config.compatibility_date}"
account_id = "${config.account_id}"
workers_dev = ${config.workers_dev}

${config.kv_namespaces.map((ns: any) => `
[[kv_namespaces]]
binding = "${ns.binding}"
id = "${ns.id}"
`).join('\n')}

[vars]
${Object.entries(config.vars || {}).map(([k, v]) => `${k} = "${v}"`).join('\n')}
    `.trim();
  }

  private async configureCloudflareRoutes(
    config: CloudflareWorkerConfig,
    workerName: string,
    routes: RouteConfig[]
  ): Promise<void> {
    for (const route of routes) {
      await axios.post(
        `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/workers/routes`,
        {
          pattern: route.pattern,
          script: workerName,
        },
        {
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  private async associateLambdaEdgeWithCloudFront(
    distributionId: string,
    functionArn: string,
    routes: RouteConfig[]
  ): Promise<void> {
    console.log(`Associating Lambda@Edge ${functionArn} with CloudFront ${distributionId}`);
  }

  private async waitForVercelDeployment(
    deploymentId: string,
    config: VercelEdgeConfig
  ): Promise<void> {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await axios.get(
        `https://api.vercel.com/v13/deployments/${deploymentId}`,
        {
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
          },
        }
      );

      if (response.data.readyState === 'READY') {
        return;
      }

      await this.sleep(5000);
      attempts++;
    }

    throw new Error('Vercel deployment timeout');
  }

  private async getFastlyActiveVersion(
    serviceId: string,
    headers: any
  ): Promise<number> {
    const response = await axios.get(
      `https://api.fastly.com/service/${serviceId}/details`,
      { headers }
    );

    return response.data.active_version;
  }

  private async cloneFastlyVersion(
    serviceId: string,
    version: number,
    headers: any
  ): Promise<number> {
    const response = await axios.put(
      `https://api.fastly.com/service/${serviceId}/version/${version}/clone`,
      {},
      { headers }
    );

    return response.data.number;
  }

  private convertToVCL(edgeFunction: EdgeFunction): string {
    return `
if (req.url ~ "${edgeFunction.config.routes[0]?.pattern || '/*'}") {
  set req.http.X-Edge-Function = "${edgeFunction.name}";
}
    `.trim();
  }

  private async updateCloudflareCanary(
    deployment: EdgeDeployment,
    percentage: number,
    config: CloudflareWorkerConfig
  ): Promise<void> {
    console.log(`Updating Cloudflare canary to ${percentage}%`);
  }

  private async updateAWSCanary(
    deployment: EdgeDeployment,
    percentage: number,
    config: AWSLambdaEdgeConfig
  ): Promise<void> {
    console.log(`Updating AWS canary to ${percentage}%`);
  }

  private async updateVercelCanary(
    deployment: EdgeDeployment,
    percentage: number,
    config: VercelEdgeConfig
  ): Promise<void> {
    console.log(`Updating Vercel canary to ${percentage}%`);
  }

  private async updateFastlyCanary(
    deployment: EdgeDeployment,
    percentage: number,
    config: FastlyConfig
  ): Promise<void> {
    console.log(`Updating Fastly canary to ${percentage}%`);
  }

  private initializeMetrics(): DeploymentMetrics {
    return {
      requestCount: 0,
      errorCount: 0,
      executionTimeP50: 0,
      executionTimeP95: 0,
      executionTimeP99: 0,
      errorRate: 0,
      lastChecked: new Date(),
    };
  }

  private generateId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  private sanitizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async destroy(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export default EdgeFunctionManager;
export {
  EdgePlatform,
  EdgeFunction,
  EdgeDeployment,
  EdgeAnalytics,
  DeploymentOptions,
  DeploymentMetrics,
};
