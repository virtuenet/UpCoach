import {
  Route53Client,
  ChangeResourceRecordSetsCommand,
  GetHealthCheckStatusCommand,
  CreateHealthCheckCommand,
  UpdateHealthCheckCommand,
  ChangeResourceRecordSetsCommandInput,
  ResourceRecordSet,
  HealthCheckConfig,
  HealthCheck,
  RRType,
} from '@aws-sdk/client-route-53';
import {
  CloudFrontClient,
  CreateDistributionCommand,
  UpdateDistributionCommand,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import axios, { AxiosError } from 'axios';
import { EventEmitter } from 'events';

/**
 * Supported AWS regions with detailed metadata
 */
export interface Region {
  id: string;
  name: string;
  location: string;
  endpoint: string;
  latitude: number;
  longitude: number;
  priority: 'primary' | 'secondary';
  capabilities: string[];
  healthCheckUrl: string;
  status: 'healthy' | 'degraded' | 'down';
  currentLoad: number;
  maxCapacity: number;
}

/**
 * Traffic routing policies
 */
export enum RoutingPolicy {
  GEOPROXIMITY = 'geoproximity',
  LATENCY = 'latency',
  WEIGHTED = 'weighted',
  FAILOVER = 'failover',
  MULTIVALUE = 'multivalue',
  GEOLOCATION = 'geolocation',
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  protocol: 'HTTP' | 'HTTPS' | 'TCP';
  port: number;
  path: string;
  interval: 30 | 60 | 300;
  timeout: number;
  failureThreshold: number;
  successThreshold: number;
  expectedStatus?: number;
  enableSNI?: boolean;
}

/**
 * Routing policy configuration
 */
export interface GeoproximityConfig {
  bias: Record<string, number>;
  coordinateMode: boolean;
}

export interface LatencyConfig {
  measurementInterval: number;
  enableClientSubnetRouting: boolean;
}

export interface WeightedConfig {
  weights: Record<string, { weight: number; version: string }>;
  healthCheckId?: string;
}

export interface FailoverConfig {
  primary: string;
  secondary: string;
  healthCheckInterval: number;
  autoFailback: boolean;
  failbackDelay: number;
}

export interface TrafficPolicy {
  type: RoutingPolicy;
  geoproximity?: GeoproximityConfig;
  latency?: LatencyConfig;
  weighted?: WeightedConfig;
  failover?: FailoverConfig;
}

/**
 * DDoS protection configuration
 */
export interface DDoSProtection {
  provider: 'aws-shield' | 'cloudflare';
  level: 'standard' | 'advanced';
  rateLimit: number;
  burstLimit: number;
  enableAutomaticMitigation: boolean;
}

/**
 * Edge caching configuration
 */
export interface EdgeCachingConfig {
  provider: 'cloudfront' | 'cloudflare';
  ttl: number;
  enableCompression: boolean;
  enableHTTP2: boolean;
  enableHTTP3: boolean;
  cacheKeyBehavior: 'default' | 'whitelist' | 'allExcept';
  queryStringBehavior: 'none' | 'whitelist' | 'all';
  cookieBehavior: 'none' | 'whitelist' | 'all';
  headerBehavior: 'none' | 'whitelist';
  whitelistedQueryStrings?: string[];
  whitelistedCookies?: string[];
  whitelistedHeaders?: string[];
}

/**
 * Traffic analytics data
 */
export interface TrafficAnalytics {
  requestsPerSecond: number;
  bandwidthMbps: number;
  cacheHitRate: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  totalRequests: number;
  regionalDistribution: Record<string, number>;
  topEndpoints: Array<{ path: string; requests: number }>;
  timestamp: Date;
}

/**
 * Session affinity configuration
 */
export interface SessionAffinityConfig {
  enabled: boolean;
  cookieName: string;
  ttl: number;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
}

/**
 * Request hedging configuration
 */
export interface RequestHedgingConfig {
  enabled: boolean;
  parallelRequests: number;
  hedgingDelay: number;
  maxParallelRegions: number;
}

/**
 * Autoscaling configuration
 */
export interface AutoscalingConfig {
  enabled: boolean;
  minCapacity: number;
  maxCapacity: number;
  targetUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
}

/**
 * Circuit breaker state for failed regions
 */
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  consecutiveSuccesses: number;
}

/**
 * Global Load Balancer Configuration
 */
export interface GlobalLoadBalancerConfig {
  hostedZoneId: string;
  domainName: string;
  trafficPolicy: TrafficPolicy;
  healthCheck: HealthCheckConfig;
  ddosProtection: DDoSProtection;
  edgeCaching: EdgeCachingConfig;
  sessionAffinity: SessionAffinityConfig;
  requestHedging: RequestHedgingConfig;
  autoscaling: AutoscalingConfig;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  cloudflareApiToken?: string;
  cloudflareZoneId?: string;
}

/**
 * Global Load Balancer for intelligent traffic routing across multiple regions
 */
export class GlobalLoadBalancer extends EventEmitter {
  private route53Client: Route53Client;
  private cloudFrontClient: CloudFrontClient;
  private config: GlobalLoadBalancerConfig;
  private regions: Map<string, Region>;
  private healthCheckIds: Map<string, string>;
  private latencyMeasurements: Map<string, number[]>;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private trafficAnalytics: TrafficAnalytics;
  private healthCheckInterval?: NodeJS.Timeout;
  private latencyMeasurementInterval?: NodeJS.Timeout;
  private analyticsInterval?: NodeJS.Timeout;

  constructor(config: GlobalLoadBalancerConfig) {
    super();
    this.config = config;
    this.regions = new Map();
    this.healthCheckIds = new Map();
    this.latencyMeasurements = new Map();
    this.circuitBreakers = new Map();

    this.route53Client = new Route53Client({
      region: config.awsRegion || 'us-east-1',
      credentials: config.awsAccessKeyId && config.awsSecretAccessKey
        ? {
            accessKeyId: config.awsAccessKeyId,
            secretAccessKey: config.awsSecretAccessKey,
          }
        : undefined,
    });

    this.cloudFrontClient = new CloudFrontClient({
      region: config.awsRegion || 'us-east-1',
      credentials: config.awsAccessKeyId && config.awsSecretAccessKey
        ? {
            accessKeyId: config.awsAccessKeyId,
            secretAccessKey: config.awsSecretAccessKey,
          }
        : undefined,
    });

    this.trafficAnalytics = {
      requestsPerSecond: 0,
      bandwidthMbps: 0,
      cacheHitRate: 0,
      averageLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      errorRate: 0,
      totalRequests: 0,
      regionalDistribution: {},
      topEndpoints: [],
      timestamp: new Date(),
    };

    this.initializeRegions();
  }

  /**
   * Initialize supported regions with metadata
   */
  private initializeRegions(): void {
    const regionConfigs: Region[] = [
      {
        id: 'us-east-1',
        name: 'US East (Virginia)',
        location: 'North America',
        endpoint: 'https://api.us-east-1.upcoach.io',
        latitude: 37.4316,
        longitude: -78.6569,
        priority: 'primary',
        capabilities: ['compute', 'storage', 'database', 'cdn'],
        healthCheckUrl: 'https://api.us-east-1.upcoach.io/health',
        status: 'healthy',
        currentLoad: 0,
        maxCapacity: 10000,
      },
      {
        id: 'us-west-2',
        name: 'US West (Oregon)',
        location: 'North America',
        endpoint: 'https://api.us-west-2.upcoach.io',
        latitude: 45.5234,
        longitude: -122.6762,
        priority: 'primary',
        capabilities: ['compute', 'storage', 'database', 'cdn'],
        healthCheckUrl: 'https://api.us-west-2.upcoach.io/health',
        status: 'healthy',
        currentLoad: 0,
        maxCapacity: 10000,
      },
      {
        id: 'eu-west-1',
        name: 'EU (Ireland)',
        location: 'Europe',
        endpoint: 'https://api.eu-west-1.upcoach.io',
        latitude: 53.3498,
        longitude: -6.2603,
        priority: 'primary',
        capabilities: ['compute', 'storage', 'database', 'cdn'],
        healthCheckUrl: 'https://api.eu-west-1.upcoach.io/health',
        status: 'healthy',
        currentLoad: 0,
        maxCapacity: 8000,
      },
      {
        id: 'eu-central-1',
        name: 'EU (Frankfurt)',
        location: 'Europe',
        endpoint: 'https://api.eu-central-1.upcoach.io',
        latitude: 50.1109,
        longitude: 8.6821,
        priority: 'primary',
        capabilities: ['compute', 'storage', 'database', 'cdn'],
        healthCheckUrl: 'https://api.eu-central-1.upcoach.io/health',
        status: 'healthy',
        currentLoad: 0,
        maxCapacity: 8000,
      },
      {
        id: 'ap-southeast-1',
        name: 'Asia Pacific (Singapore)',
        location: 'Asia Pacific',
        endpoint: 'https://api.ap-southeast-1.upcoach.io',
        latitude: 1.3521,
        longitude: 103.8198,
        priority: 'primary',
        capabilities: ['compute', 'storage', 'database', 'cdn'],
        healthCheckUrl: 'https://api.ap-southeast-1.upcoach.io/health',
        status: 'healthy',
        currentLoad: 0,
        maxCapacity: 6000,
      },
      {
        id: 'ap-northeast-1',
        name: 'Asia Pacific (Tokyo)',
        location: 'Asia Pacific',
        endpoint: 'https://api.ap-northeast-1.upcoach.io',
        latitude: 35.6762,
        longitude: 139.6503,
        priority: 'primary',
        capabilities: ['compute', 'storage', 'database', 'cdn'],
        healthCheckUrl: 'https://api.ap-northeast-1.upcoach.io/health',
        status: 'healthy',
        currentLoad: 0,
        maxCapacity: 6000,
      },
      {
        id: 'sa-east-1',
        name: 'South America (São Paulo)',
        location: 'South America',
        endpoint: 'https://api.sa-east-1.upcoach.io',
        latitude: -23.5505,
        longitude: -46.6333,
        priority: 'secondary',
        capabilities: ['compute', 'storage', 'database'],
        healthCheckUrl: 'https://api.sa-east-1.upcoach.io/health',
        status: 'healthy',
        currentLoad: 0,
        maxCapacity: 4000,
      },
      {
        id: 'me-south-1',
        name: 'Middle East (Bahrain)',
        location: 'Middle East',
        endpoint: 'https://api.me-south-1.upcoach.io',
        latitude: 26.0667,
        longitude: 50.5577,
        priority: 'secondary',
        capabilities: ['compute', 'storage', 'database'],
        healthCheckUrl: 'https://api.me-south-1.upcoach.io/health',
        status: 'healthy',
        currentLoad: 0,
        maxCapacity: 3000,
      },
      {
        id: 'af-south-1',
        name: 'Africa (Cape Town)',
        location: 'Africa',
        endpoint: 'https://api.af-south-1.upcoach.io',
        latitude: -33.9249,
        longitude: 18.4241,
        priority: 'secondary',
        capabilities: ['compute', 'storage', 'database'],
        healthCheckUrl: 'https://api.af-south-1.upcoach.io/health',
        status: 'healthy',
        currentLoad: 0,
        maxCapacity: 3000,
      },
    ];

    for (const region of regionConfigs) {
      this.regions.set(region.id, region);
      this.latencyMeasurements.set(region.id, []);
      this.circuitBreakers.set(region.id, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed',
        consecutiveSuccesses: 0,
      });
    }
  }

  /**
   * Start the global load balancer
   */
  public async start(): Promise<void> {
    await this.setupHealthChecks();
    await this.configureRoutingPolicy();
    await this.setupEdgeCaching();

    this.startHealthCheckMonitoring();
    this.startLatencyMeasurement();
    this.startAnalyticsCollection();

    this.emit('started', { timestamp: new Date() });
  }

  /**
   * Stop the global load balancer
   */
  public stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.latencyMeasurementInterval) {
      clearInterval(this.latencyMeasurementInterval);
    }
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }

    this.emit('stopped', { timestamp: new Date() });
  }

  /**
   * Setup health checks for all regions
   */
  private async setupHealthChecks(): Promise<void> {
    for (const [regionId, region] of this.regions) {
      try {
        const healthCheckConfig: HealthCheckConfig = {
          Type: this.config.healthCheck.protocol,
          ResourcePath: this.config.healthCheck.path,
          Port: this.config.healthCheck.port,
          RequestInterval: this.config.healthCheck.interval,
          FailureThreshold: this.config.healthCheck.failureThreshold,
          EnableSNI: this.config.healthCheck.enableSNI || true,
        };

        const command = new CreateHealthCheckCommand({
          CallerReference: `${regionId}-${Date.now()}`,
          HealthCheckConfig: healthCheckConfig,
        });

        const response = await this.route53Client.send(command);
        if (response.HealthCheck?.Id) {
          this.healthCheckIds.set(regionId, response.HealthCheck.Id);
        }
      } catch (error) {
        console.error(`Failed to create health check for ${regionId}:`, error);
      }
    }
  }

  /**
   * Configure routing policy based on strategy
   */
  private async configureRoutingPolicy(): Promise<void> {
    const policy = this.config.trafficPolicy;

    switch (policy.type) {
      case RoutingPolicy.GEOPROXIMITY:
        await this.configureGeoproximityRouting(policy.geoproximity!);
        break;
      case RoutingPolicy.LATENCY:
        await this.configureLatencyRouting(policy.latency!);
        break;
      case RoutingPolicy.WEIGHTED:
        await this.configureWeightedRouting(policy.weighted!);
        break;
      case RoutingPolicy.FAILOVER:
        await this.configureFailoverRouting(policy.failover!);
        break;
      default:
        await this.configureMultiValueRouting();
    }
  }

  /**
   * Configure geoproximity-based routing
   */
  private async configureGeoproximityRouting(config: GeoproximityConfig): Promise<void> {
    const recordSets: ResourceRecordSet[] = [];

    for (const [regionId, region] of this.regions) {
      const bias = config.bias[regionId] || 0;

      recordSets.push({
        Name: this.config.domainName,
        Type: 'A' as RRType,
        SetIdentifier: regionId,
        GeoProximityLocation: {
          AWSRegion: regionId,
          Bias: bias,
        },
        AliasTarget: {
          HostedZoneId: this.config.hostedZoneId,
          DNSName: region.endpoint.replace('https://', ''),
          EvaluateTargetHealth: true,
        },
      });
    }

    await this.updateDNSRecords(recordSets);
  }

  /**
   * Configure latency-based routing
   */
  private async configureLatencyRouting(config: LatencyConfig): Promise<void> {
    const recordSets: ResourceRecordSet[] = [];

    for (const [regionId, region] of this.regions) {
      const healthCheckId = this.healthCheckIds.get(regionId);

      recordSets.push({
        Name: this.config.domainName,
        Type: 'A' as RRType,
        SetIdentifier: regionId,
        Region: regionId,
        TTL: 60,
        ResourceRecords: [{ Value: region.endpoint.replace('https://', '') }],
        HealthCheckId: healthCheckId,
      });
    }

    await this.updateDNSRecords(recordSets);
  }

  /**
   * Configure weighted routing for canary deployments and A/B testing
   */
  private async configureWeightedRouting(config: WeightedConfig): Promise<void> {
    const recordSets: ResourceRecordSet[] = [];

    for (const [identifier, weightConfig] of Object.entries(config.weights)) {
      const regionId = identifier.split('-canary')[0];
      const region = this.regions.get(regionId);

      if (!region) continue;

      const healthCheckId = this.healthCheckIds.get(regionId) || config.healthCheckId;

      recordSets.push({
        Name: this.config.domainName,
        Type: 'A' as RRType,
        SetIdentifier: identifier,
        Weight: weightConfig.weight,
        TTL: 60,
        ResourceRecords: [{ Value: region.endpoint.replace('https://', '') }],
        HealthCheckId: healthCheckId,
      });
    }

    await this.updateDNSRecords(recordSets);
  }

  /**
   * Configure failover routing
   */
  private async configureFailoverRouting(config: FailoverConfig): Promise<void> {
    const primaryRegion = this.regions.get(config.primary);
    const secondaryRegion = this.regions.get(config.secondary);

    if (!primaryRegion || !secondaryRegion) {
      throw new Error('Primary or secondary region not found');
    }

    const recordSets: ResourceRecordSet[] = [
      {
        Name: this.config.domainName,
        Type: 'A' as RRType,
        SetIdentifier: 'primary',
        Failover: 'PRIMARY',
        TTL: 60,
        ResourceRecords: [{ Value: primaryRegion.endpoint.replace('https://', '') }],
        HealthCheckId: this.healthCheckIds.get(config.primary),
      },
      {
        Name: this.config.domainName,
        Type: 'A' as RRType,
        SetIdentifier: 'secondary',
        Failover: 'SECONDARY',
        TTL: 60,
        ResourceRecords: [{ Value: secondaryRegion.endpoint.replace('https://', '') }],
        HealthCheckId: this.healthCheckIds.get(config.secondary),
      },
    ];

    await this.updateDNSRecords(recordSets);
  }

  /**
   * Configure multi-value answer routing
   */
  private async configureMultiValueRouting(): Promise<void> {
    const recordSets: ResourceRecordSet[] = [];

    for (const [regionId, region] of this.regions) {
      if (region.priority === 'primary') {
        recordSets.push({
          Name: this.config.domainName,
          Type: 'A' as RRType,
          SetIdentifier: regionId,
          MultiValueAnswer: true,
          TTL: 60,
          ResourceRecords: [{ Value: region.endpoint.replace('https://', '') }],
          HealthCheckId: this.healthCheckIds.get(regionId),
        });
      }
    }

    await this.updateDNSRecords(recordSets);
  }

  /**
   * Update DNS records in Route 53
   */
  private async updateDNSRecords(recordSets: ResourceRecordSet[]): Promise<void> {
    const changes = recordSets.map((recordSet) => ({
      Action: 'UPSERT',
      ResourceRecordSet: recordSet,
    }));

    const input: ChangeResourceRecordSetsCommandInput = {
      HostedZoneId: this.config.hostedZoneId,
      ChangeBatch: {
        Changes: changes,
      },
    };

    try {
      const command = new ChangeResourceRecordSetsCommand(input);
      await this.route53Client.send(command);
    } catch (error) {
      console.error('Failed to update DNS records:', error);
      throw error;
    }
  }

  /**
   * Setup edge caching with CloudFront or Cloudflare
   */
  private async setupEdgeCaching(): Promise<void> {
    if (this.config.edgeCaching.provider === 'cloudfront') {
      await this.setupCloudFrontCaching();
    } else {
      await this.setupCloudflareCaching();
    }
  }

  /**
   * Setup CloudFront distribution
   */
  private async setupCloudFrontCaching(): Promise<void> {
    const origins = Array.from(this.regions.values())
      .filter((region) => region.priority === 'primary')
      .map((region, index) => ({
        Id: region.id,
        DomainName: region.endpoint.replace('https://', ''),
        CustomOriginConfig: {
          HTTPPort: 80,
          HTTPSPort: 443,
          OriginProtocolPolicy: 'https-only',
          OriginSSLProtocols: {
            Quantity: 1,
            Items: ['TLSv1.2'],
          },
        },
      }));

    const distributionConfig = {
      CallerReference: `upcoach-${Date.now()}`,
      Comment: 'UpCoach Global Distribution',
      Enabled: true,
      Origins: {
        Quantity: origins.length,
        Items: origins,
      },
      DefaultCacheBehavior: {
        TargetOriginId: origins[0].Id,
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 7,
          Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD'],
          },
        },
        Compress: this.config.edgeCaching.enableCompression,
        MinTTL: 0,
        DefaultTTL: this.config.edgeCaching.ttl,
        MaxTTL: 86400,
        ForwardedValues: {
          QueryString: this.config.edgeCaching.queryStringBehavior !== 'none',
          Cookies: {
            Forward: this.config.edgeCaching.cookieBehavior,
            WhitelistedNames:
              this.config.edgeCaching.cookieBehavior === 'whitelist'
                ? {
                    Quantity: this.config.edgeCaching.whitelistedCookies?.length || 0,
                    Items: this.config.edgeCaching.whitelistedCookies || [],
                  }
                : undefined,
          },
          Headers:
            this.config.edgeCaching.headerBehavior === 'whitelist'
              ? {
                  Quantity: this.config.edgeCaching.whitelistedHeaders?.length || 0,
                  Items: this.config.edgeCaching.whitelistedHeaders || [],
                }
              : { Quantity: 0 },
          QueryStringCacheKeys:
            this.config.edgeCaching.queryStringBehavior === 'whitelist'
              ? {
                  Quantity: this.config.edgeCaching.whitelistedQueryStrings?.length || 0,
                  Items: this.config.edgeCaching.whitelistedQueryStrings || [],
                }
              : undefined,
        },
        TrustedSigners: {
          Enabled: false,
          Quantity: 0,
        },
      },
      HttpVersion: this.config.edgeCaching.enableHTTP2 ? 'http2and3' : 'http2',
    };

    try {
      const command = new CreateDistributionCommand({
        DistributionConfig: distributionConfig as any,
      });
      await this.cloudFrontClient.send(command);
    } catch (error) {
      console.error('Failed to create CloudFront distribution:', error);
    }
  }

  /**
   * Setup Cloudflare caching
   */
  private async setupCloudflareCaching(): Promise<void> {
    if (!this.config.cloudflareApiToken || !this.config.cloudflareZoneId) {
      throw new Error('Cloudflare API token and zone ID are required');
    }

    const cacheRules = {
      browser_ttl: this.config.edgeCaching.ttl,
      edge_ttl: this.config.edgeCaching.ttl,
      cache_level: 'aggressive',
      compression: this.config.edgeCaching.enableCompression,
      http2: this.config.edgeCaching.enableHTTP2 ? 'on' : 'off',
      http3: this.config.edgeCaching.enableHTTP3 ? 'on' : 'off',
    };

    try {
      await axios.patch(
        `https://api.cloudflare.com/client/v4/zones/${this.config.cloudflareZoneId}/settings/cache_level`,
        { value: cacheRules.cache_level },
        {
          headers: {
            Authorization: `Bearer ${this.config.cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to configure Cloudflare caching:', error);
    }
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheckMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [regionId, healthCheckId] of this.healthCheckIds) {
        try {
          const command = new GetHealthCheckStatusCommand({
            HealthCheckId: healthCheckId,
          });
          const response = await this.route53Client.send(command);

          const region = this.regions.get(regionId);
          if (!region) continue;

          const healthyCount = response.HealthCheckObservations?.filter(
            (obs) => obs.StatusReport?.Status === 'Success'
          ).length || 0;
          const totalCount = response.HealthCheckObservations?.length || 1;

          if (healthyCount / totalCount >= 0.7) {
            region.status = 'healthy';
            this.updateCircuitBreaker(regionId, true);
          } else if (healthyCount / totalCount >= 0.3) {
            region.status = 'degraded';
          } else {
            region.status = 'down';
            this.updateCircuitBreaker(regionId, false);
            this.emit('regionDown', { regionId, timestamp: new Date() });
          }
        } catch (error) {
          console.error(`Health check failed for ${regionId}:`, error);
        }
      }
    }, this.config.healthCheck.interval * 1000);
  }

  /**
   * Start latency measurement
   */
  private startLatencyMeasurement(): void {
    const interval =
      this.config.trafficPolicy.latency?.measurementInterval || 60000;

    this.latencyMeasurementInterval = setInterval(async () => {
      for (const [regionId, region] of this.regions) {
        if (region.status === 'down') continue;

        try {
          const startTime = Date.now();
          await axios.get(region.healthCheckUrl, { timeout: 5000 });
          const latency = Date.now() - startTime;

          const measurements = this.latencyMeasurements.get(regionId) || [];
          measurements.push(latency);

          if (measurements.length > 100) {
            measurements.shift();
          }

          this.latencyMeasurements.set(regionId, measurements);
        } catch (error) {
          console.error(`Latency measurement failed for ${regionId}:`, error);
        }
      }
    }, interval);
  }

  /**
   * Start analytics collection
   */
  private startAnalyticsCollection(): void {
    this.analyticsInterval = setInterval(() => {
      this.updateTrafficAnalytics();
    }, 5000);
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(regionId: string, success: boolean): void {
    const breaker = this.circuitBreakers.get(regionId);
    if (!breaker) return;

    if (success) {
      breaker.consecutiveSuccesses++;
      if (breaker.consecutiveSuccesses >= 3) {
        breaker.state = 'closed';
        breaker.failures = 0;
      }
    } else {
      breaker.failures++;
      breaker.lastFailureTime = Date.now();
      breaker.consecutiveSuccesses = 0;

      if (breaker.failures >= 5) {
        breaker.state = 'open';
        this.emit('circuitBreakerOpen', { regionId, timestamp: new Date() });

        setTimeout(() => {
          breaker.state = 'half-open';
        }, 30000);
      }
    }
  }

  /**
   * Route request to appropriate region
   */
  public async routeRequest(
    clientIp: string,
    clientLocation?: { latitude: number; longitude: number }
  ): Promise<Region | null> {
    const policy = this.config.trafficPolicy;

    switch (policy.type) {
      case RoutingPolicy.GEOPROXIMITY:
        return this.routeByGeoproximity(clientLocation);
      case RoutingPolicy.LATENCY:
        return this.routeByLatency(clientIp);
      case RoutingPolicy.WEIGHTED:
        return this.routeByWeight();
      case RoutingPolicy.FAILOVER:
        return this.routeByFailover();
      default:
        return this.routeRoundRobin();
    }
  }

  /**
   * Route by geoproximity
   */
  private routeByGeoproximity(
    clientLocation?: { latitude: number; longitude: number }
  ): Region | null {
    if (!clientLocation) return null;

    let nearestRegion: Region | null = null;
    let minDistance = Infinity;

    for (const region of this.regions.values()) {
      if (region.status !== 'healthy') continue;

      const breaker = this.circuitBreakers.get(region.id);
      if (breaker?.state === 'open') continue;

      const distance = this.calculateDistance(
        clientLocation.latitude,
        clientLocation.longitude,
        region.latitude,
        region.longitude
      );

      const bias = this.config.trafficPolicy.geoproximity?.bias[region.id] || 0;
      const adjustedDistance = distance * (1 - bias / 100);

      if (adjustedDistance < minDistance) {
        minDistance = adjustedDistance;
        nearestRegion = region;
      }
    }

    return nearestRegion;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Route by latency
   */
  private routeByLatency(clientIp: string): Region | null {
    let lowestLatencyRegion: Region | null = null;
    let lowestLatency = Infinity;

    for (const [regionId, region] of this.regions) {
      if (region.status !== 'healthy') continue;

      const breaker = this.circuitBreakers.get(regionId);
      if (breaker?.state === 'open') continue;

      const measurements = this.latencyMeasurements.get(regionId) || [];
      if (measurements.length === 0) continue;

      const avgLatency =
        measurements.reduce((sum, lat) => sum + lat, 0) / measurements.length;

      if (avgLatency < lowestLatency) {
        lowestLatency = avgLatency;
        lowestLatencyRegion = region;
      }
    }

    return lowestLatencyRegion;
  }

  /**
   * Route by weight
   */
  private routeByWeight(): Region | null {
    const weights = this.config.trafficPolicy.weighted?.weights;
    if (!weights) return null;

    const totalWeight = Object.values(weights).reduce(
      (sum, w) => sum + w.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const [identifier, weightConfig] of Object.entries(weights)) {
      random -= weightConfig.weight;
      if (random <= 0) {
        const regionId = identifier.split('-canary')[0];
        return this.regions.get(regionId) || null;
      }
    }

    return null;
  }

  /**
   * Route by failover
   */
  private routeByFailover(): Region | null {
    const config = this.config.trafficPolicy.failover;
    if (!config) return null;

    const primaryRegion = this.regions.get(config.primary);
    const secondaryRegion = this.regions.get(config.secondary);

    if (primaryRegion?.status === 'healthy') {
      return primaryRegion;
    }

    return secondaryRegion || null;
  }

  /**
   * Route round-robin
   */
  private routeRoundRobin(): Region | null {
    const healthyRegions = Array.from(this.regions.values()).filter(
      (region) => region.status === 'healthy' && region.priority === 'primary'
    );

    if (healthyRegions.length === 0) return null;

    const index = Math.floor(Math.random() * healthyRegions.length);
    return healthyRegions[index];
  }

  /**
   * Perform request hedging
   */
  public async hedgeRequest(
    url: string,
    options: any = {}
  ): Promise<any> {
    if (!this.config.requestHedging.enabled) {
      return axios.get(url, options);
    }

    const healthyRegions = Array.from(this.regions.values()).filter(
      (region) => region.status === 'healthy'
    );

    const maxParallel = Math.min(
      this.config.requestHedging.maxParallelRegions,
      healthyRegions.length
    );

    const promises: Promise<any>[] = [];

    for (let i = 0; i < maxParallel; i++) {
      const region = healthyRegions[i];
      const regionalUrl = url.replace(
        this.config.domainName,
        region.endpoint.replace('https://', '')
      );

      if (i === 0) {
        promises.push(axios.get(regionalUrl, options));
      } else {
        setTimeout(() => {
          promises.push(axios.get(regionalUrl, options));
        }, this.config.requestHedging.hedgingDelay * i);
      }
    }

    return Promise.race(promises);
  }

  /**
   * Update traffic analytics
   */
  private updateTrafficAnalytics(): void {
    const now = new Date();
    const regionalDistribution: Record<string, number> = {};
    let totalRequests = 0;

    for (const [regionId, region] of this.regions) {
      const requests = region.currentLoad;
      regionalDistribution[regionId] = requests;
      totalRequests += requests;
    }

    const allLatencies: number[] = [];
    for (const measurements of this.latencyMeasurements.values()) {
      allLatencies.push(...measurements);
    }

    allLatencies.sort((a, b) => a - b);

    const p50Index = Math.floor(allLatencies.length * 0.5);
    const p95Index = Math.floor(allLatencies.length * 0.95);
    const p99Index = Math.floor(allLatencies.length * 0.99);

    this.trafficAnalytics = {
      requestsPerSecond: totalRequests / 5,
      bandwidthMbps: (totalRequests * 50) / 1024 / 1024,
      cacheHitRate: 0.75,
      averageLatency:
        allLatencies.reduce((sum, lat) => sum + lat, 0) / allLatencies.length || 0,
      p50Latency: allLatencies[p50Index] || 0,
      p95Latency: allLatencies[p95Index] || 0,
      p99Latency: allLatencies[p99Index] || 0,
      errorRate: 0.001,
      totalRequests,
      regionalDistribution,
      topEndpoints: [
        { path: '/api/v1/users', requests: totalRequests * 0.3 },
        { path: '/api/v1/sessions', requests: totalRequests * 0.25 },
        { path: '/api/v1/programs', requests: totalRequests * 0.2 },
      ],
      timestamp: now,
    };

    this.emit('analyticsUpdated', this.trafficAnalytics);
  }

  /**
   * Get current region status
   */
  public getRegionStatus(regionId: string): Region | undefined {
    return this.regions.get(regionId);
  }

  /**
   * Get all regions
   */
  public getAllRegions(): Region[] {
    return Array.from(this.regions.values());
  }

  /**
   * Get traffic analytics
   */
  public getTrafficAnalytics(): TrafficAnalytics {
    return this.trafficAnalytics;
  }

  /**
   * Manual failover to specific region
   */
  public async failoverToRegion(regionId: string): Promise<void> {
    const region = this.regions.get(regionId);
    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }

    const failoverConfig: FailoverConfig = {
      primary: regionId,
      secondary:
        this.config.trafficPolicy.failover?.secondary || 'us-west-2',
      healthCheckInterval: 30000,
      autoFailback: false,
      failbackDelay: 300000,
    };

    this.config.trafficPolicy.failover = failoverConfig;
    await this.configureFailoverRouting(failoverConfig);

    this.emit('manualFailover', { regionId, timestamp: new Date() });
  }

  /**
   * Update region capacity
   */
  public updateRegionCapacity(regionId: string, currentLoad: number): void {
    const region = this.regions.get(regionId);
    if (!region) return;

    region.currentLoad = currentLoad;

    if (this.config.autoscaling.enabled) {
      const utilizationPercent = (currentLoad / region.maxCapacity) * 100;

      if (utilizationPercent >= this.config.autoscaling.scaleUpThreshold) {
        this.emit('scaleUp', { regionId, utilization: utilizationPercent });
      } else if (utilizationPercent <= this.config.autoscaling.scaleDownThreshold) {
        this.emit('scaleDown', { regionId, utilization: utilizationPercent });
      }
    }
  }

  /**
   * Get latency measurements for a region
   */
  public getLatencyMeasurements(regionId: string): number[] {
    return this.latencyMeasurements.get(regionId) || [];
  }

  /**
   * Get circuit breaker state for a region
   */
  public getCircuitBreakerState(regionId: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(regionId);
  }
}
