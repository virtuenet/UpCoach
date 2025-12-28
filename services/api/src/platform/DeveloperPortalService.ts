import { EventEmitter } from 'events';
import { apiKeyService } from './APIKeyService';
import { webhookService } from './WebhookService';
import { apiAnalyticsService } from './APIAnalyticsService';

/**
 * Developer Account
 */
export interface DeveloperAccount {
  userId: string;
  organizationId?: string;
  tier: 'free' | 'developer' | 'business' | 'enterprise';
  status: 'active' | 'suspended';
  quotas: {
    apiKeys: { used: number; limit: number };
    webhooks: { used: number; limit: number };
    requestsPerMonth: { used: number; limit: number };
  };
  billing: {
    plan: string;
    nextBillingDate?: Date;
    totalSpend: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Documentation Section
 */
export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  category: 'getting-started' | 'authentication' | 'endpoints' | 'webhooks' | 'sdks' | 'examples';
  order: number;
}

/**
 * Code Example
 */
export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: 'curl' | 'javascript' | 'python' | 'ruby' | 'php';
  code: string;
  category: string;
}

/**
 * DeveloperPortalService
 *
 * Manages developer portal functionality including documentation,
 * account management, and code examples.
 */
export class DeveloperPortalService extends EventEmitter {
  private static instance: DeveloperPortalService;
  private developers: Map<string, DeveloperAccount> = new Map();
  private documentation: DocumentationSection[] = [];
  private codeExamples: CodeExample[] = [];

  private constructor() {
    super();
    this.initializeDocumentation();
    this.initializeCodeExamples();
  }

  static getInstance(): DeveloperPortalService {
    if (!DeveloperPortalService.instance) {
      DeveloperPortalService.instance = new DeveloperPortalService();
    }
    return DeveloperPortalService.instance;
  }

  /**
   * Register Developer
   */
  async registerDeveloper(
    userId: string,
    tier: 'free' | 'developer' | 'business' | 'enterprise' = 'free'
  ): Promise<DeveloperAccount> {
    const quotaLimits = {
      free: { apiKeys: 2, webhooks: 5, requestsPerMonth: 10000 },
      developer: { apiKeys: 10, webhooks: 50, requestsPerMonth: 100000 },
      business: { apiKeys: 50, webhooks: 200, requestsPerMonth: 1000000 },
      enterprise: { apiKeys: 999, webhooks: 999, requestsPerMonth: 999999999 },
    };

    const account: DeveloperAccount = {
      userId,
      tier,
      status: 'active',
      quotas: {
        apiKeys: { used: 0, limit: quotaLimits[tier].apiKeys },
        webhooks: { used: 0, limit: quotaLimits[tier].webhooks },
        requestsPerMonth: { used: 0, limit: quotaLimits[tier].requestsPerMonth },
      },
      billing: {
        plan: tier,
        totalSpend: 0,
      },
    };

    this.developers.set(userId, account);

    this.emit('developer:registered', { userId, tier });

    return account;
  }

  /**
   * Get Developer Dashboard
   */
  async getDashboard(userId: string): Promise<{
    account: DeveloperAccount;
    apiKeys: number;
    webhooks: number;
    usage: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    recentActivity: any[];
  }> {
    const account = this.developers.get(userId);
    if (!account) {
      throw new Error('Developer account not found');
    }

    const apiKeys = await apiKeyService.getUserAPIKeys(userId);
    const webhooks = await webhookService.getUserSubscriptions(userId);

    // Calculate usage
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // This would normally query analytics service
    const usage = {
      today: 0,
      thisWeek: 0,
      thisMonth: account.quotas.requestsPerMonth.used,
    };

    return {
      account,
      apiKeys: apiKeys.length,
      webhooks: webhooks.length,
      usage,
      recentActivity: [],
    };
  }

  /**
   * Get Documentation
   */
  async getDocumentation(category?: string): Promise<DocumentationSection[]> {
    if (category) {
      return this.documentation.filter(doc => doc.category === category);
    }
    return this.documentation;
  }

  /**
   * Get Code Examples
   */
  async getCodeExamples(
    language?: string,
    category?: string
  ): Promise<CodeExample[]> {
    let examples = this.codeExamples;

    if (language) {
      examples = examples.filter(ex => ex.language === language);
    }

    if (category) {
      examples = examples.filter(ex => ex.category === category);
    }

    return examples;
  }

  /**
   * Initialize Documentation
   */
  private initializeDocumentation(): void {
    this.documentation = [
      {
        id: '1',
        title: 'Getting Started',
        content: 'Welcome to the UpCoach API. This guide will help you get started...',
        category: 'getting-started',
        order: 1,
      },
      {
        id: '2',
        title: 'Authentication',
        content: 'All API requests require authentication using API keys...',
        category: 'authentication',
        order: 2,
      },
      {
        id: '3',
        title: 'Rate Limiting',
        content: 'API requests are rate limited based on your tier...',
        category: 'getting-started',
        order: 3,
      },
      {
        id: '4',
        title: 'Webhooks',
        content: 'Webhooks allow you to receive real-time notifications...',
        category: 'webhooks',
        order: 4,
      },
    ];
  }

  /**
   * Initialize Code Examples
   */
  private initializeCodeExamples(): void {
    this.codeExamples = [
      {
        id: '1',
        title: 'List Goals',
        description: 'Retrieve all goals for authenticated user',
        language: 'curl',
        code: 'curl -H "Authorization: Bearer YOUR_API_KEY" https://api.upcoach.com/v1/goals',
        category: 'goals',
      },
      {
        id: '2',
        title: 'Create Goal',
        description: 'Create a new goal',
        language: 'javascript',
        code: `const response = await fetch('https://api.upcoach.com/v1/goals', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Learn TypeScript',
    description: 'Master TypeScript in 30 days'
  })
});`,
        category: 'goals',
      },
    ];
  }
}

export const developerPortalService = DeveloperPortalService.getInstance();
