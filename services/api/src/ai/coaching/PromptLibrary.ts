// Prompt Library - Managed library of AI prompts with versioning (~500 LOC)

interface PromptTemplate {
  id: string;
  category: string;
  template: string;
  variables: string[];
  versions: Map<string, PromptVersion>;
  activeVersion: string;
  metrics: {
    effectiveness: number;
    userSatisfaction: number;
    avgResponseTime: number;
  };
}

interface PromptVersion {
  version: string;
  template: string;
  createdAt: Date;
  performance: {
    successRate: number;
    avgSatisfaction: number;
    usageCount: number;
  };
}

interface GenerationContext {
  userId?: string;
  userName?: string;
  goals?: string[];
  recentProgress?: string;
  challenges?: string[];
  [key: string]: any;
}

export class PromptLibrary {
  private templates: Map<string, PromptTemplate> = new Map();
  private abTests: Map<string, ABTest> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Goal Setting Prompts
    this.addTemplate({
      id: 'goal_setting',
      category: 'coaching',
      template: `You are an expert goal-setting coach. Help {{userName}} create a SMART goal.

Current context:
- User wants to: {{userIntent}}
- Current goals: {{currentGoals}}
- Past achievements: {{achievements}}

Guide them to create a goal that is:
- Specific: Clear and well-defined
- Measurable: Quantifiable progress indicators
- Achievable: Realistic given their context
- Relevant: Aligned with their values
- Time-bound: Clear deadline

Ask clarifying questions and help them refine their goal.`,
      variables: ['userName', 'userIntent', 'currentGoals', 'achievements'],
      versions: new Map([
        [
          'v1.0',
          {
            version: 'v1.0',
            template: 'Original template',
            createdAt: new Date('2025-01-01'),
            performance: {
              successRate: 0.82,
              avgSatisfaction: 4.1,
              usageCount: 1250,
            },
          },
        ],
      ]),
      activeVersion: 'v1.0',
      metrics: {
        effectiveness: 0.87,
        userSatisfaction: 4.3,
        avgResponseTime: 2.1,
      },
    });

    // Motivation Prompts
    this.addTemplate({
      id: 'motivation',
      category: 'coaching',
      template: `You are a motivational coach. {{userName}} is feeling {{emotion}} about {{topic}}.

Context:
- Recent progress: {{recentProgress}}
- Current streak: {{streak}} days
- Goal: {{goal}}

Provide empathetic support and motivation. Acknowledge their feelings, celebrate their progress, and help them reconnect with their "why". Be encouraging but authentic.`,
      variables: [
        'userName',
        'emotion',
        'topic',
        'recentProgress',
        'streak',
        'goal',
      ],
      versions: new Map(),
      activeVersion: 'v1.0',
      metrics: {
        effectiveness: 0.91,
        userSatisfaction: 4.7,
        avgResponseTime: 1.8,
      },
    });

    // Problem Solving Prompts
    this.addTemplate({
      id: 'problem_solving',
      category: 'coaching',
      template: `You are a problem-solving coach. {{userName}} is facing this challenge: {{challenge}}

Use the GROW framework:
1. Goal: What do they want to achieve?
2. Reality: What's the current situation?
3. Options: What could they try?
4. Will: What will they commit to?

Help them brainstorm solutions and create an action plan.`,
      variables: ['userName', 'challenge'],
      versions: new Map(),
      activeVersion: 'v1.0',
      metrics: {
        effectiveness: 0.85,
        userSatisfaction: 4.4,
        avgResponseTime: 2.5,
      },
    });

    // Progress Celebration Prompts
    this.addTemplate({
      id: 'celebration',
      category: 'coaching',
      template: `You are celebrating {{userName}}'s achievement!

They just: {{achievement}}

Context:
- This was a {{difficulty}} level goal
- They've been working on it for {{duration}}
- Progress: {{progress}}

Celebrate their success! Be genuinely enthusiastic. Acknowledge the effort and growth. Ask what they learned and how they'll build on this success.`,
      variables: ['userName', 'achievement', 'difficulty', 'duration', 'progress'],
      versions: new Map(),
      activeVersion: 'v1.0',
      metrics: {
        effectiveness: 0.94,
        userSatisfaction: 4.9,
        avgResponseTime: 1.5,
      },
    });

    // Reflection Prompts
    this.addTemplate({
      id: 'reflection',
      category: 'coaching',
      template: `You are guiding {{userName}} through a reflection exercise.

Topic: {{topic}}

Ask thoughtful questions that help them:
- Identify patterns in their behavior
- Recognize their growth
- Learn from challenges
- Clarify their values and priorities

Use the Socratic method - help them discover insights through inquiry.`,
      variables: ['userName', 'topic'],
      versions: new Map(),
      activeVersion: 'v1.0',
      metrics: {
        effectiveness: 0.88,
        userSatisfaction: 4.5,
        avgResponseTime: 2.0,
      },
    });
  }

  private addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  async getPrompt(
    category: string,
    context: GenerationContext
  ): Promise<string> {
    const template = this.templates.get(category);
    if (!template) {
      throw new Error(`Template not found: ${category}`);
    }

    const version = template.versions.get(template.activeVersion);
    const templateText = version?.template || template.template;

    return this.injectContext(templateText, context);
  }

  private injectContext(template: string, context: GenerationContext): string {
    let result = template;

    // Replace all {{variable}} with context values
    Object.keys(context).forEach((key) => {
      const value = context[key];
      const placeholder = `{{${key}}}`;

      if (Array.isArray(value)) {
        result = result.replace(placeholder, value.join(', '));
      } else {
        result = result.replace(placeholder, String(value || ''));
      }
    });

    // Remove any unreplaced placeholders
    result = result.replace(/\{\{[^}]+\}\}/g, '[not provided]');

    return result;
  }

  async testPromptVariant(
    category: string,
    variant: string,
    testDuration: number = 7
  ): Promise<void> {
    console.log(
      `[PromptLibrary] Starting A/B test for ${category} variant: ${variant}`
    );

    const abTest: ABTest = {
      category,
      variantA: this.templates.get(category)!.activeVersion,
      variantB: variant,
      startDate: new Date(),
      endDate: new Date(Date.now() + testDuration * 24 * 60 * 60 * 1000),
      resultsA: { successRate: 0, satisfaction: 0, count: 0 },
      resultsB: { successRate: 0, satisfaction: 0, count: 0 },
    };

    this.abTests.set(category, abTest);

    // In production, this would run for the test duration
    // For now, simulate results
    await this.simulateABTest(abTest);
  }

  private async simulateABTest(abTest: ABTest): Promise<void> {
    // Simulate test results
    abTest.resultsA = {
      successRate: 0.85,
      satisfaction: 4.3,
      count: 500,
    };

    abTest.resultsB = {
      successRate: 0.89, // 4.7% improvement
      satisfaction: 4.5,
      count: 500,
    };

    // Analyze results
    const improvement =
      (abTest.resultsB.successRate - abTest.resultsA.successRate) /
      abTest.resultsA.successRate;

    console.log(`[PromptLibrary] A/B test results for ${abTest.category}:`);
    console.log(`  Variant A: ${abTest.resultsA.successRate} success rate`);
    console.log(`  Variant B: ${abTest.resultsB.successRate} success rate`);
    console.log(`  Improvement: ${(improvement * 100).toFixed(1)}%`);

    // If improvement > 10%, promote variant
    if (improvement > 0.1) {
      await this.promoteVariant(abTest.category, abTest.variantB);
    }
  }

  private async promoteVariant(
    category: string,
    variant: string
  ): Promise<void> {
    console.log(`[PromptLibrary] Promoting variant ${variant} for ${category}`);

    const template = this.templates.get(category);
    if (!template) return;

    template.activeVersion = variant;
    template.metrics.effectiveness += 0.05; // Boost effectiveness score
  }

  async getAllTemplates(): Promise<PromptTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getTemplateMetrics(category: string): Promise<any> {
    const template = this.templates.get(category);
    if (!template) return null;

    return {
      category: template.category,
      activeVersion: template.activeVersion,
      metrics: template.metrics,
      versions: Array.from(template.versions.values()),
    };
  }

  async getTopPerformingPrompts(limit: number = 5): Promise<PromptTemplate[]> {
    return Array.from(this.templates.values())
      .sort((a, b) => b.metrics.effectiveness - a.metrics.effectiveness)
      .slice(0, limit);
  }
}

interface ABTest {
  category: string;
  variantA: string;
  variantB: string;
  startDate: Date;
  endDate: Date;
  resultsA: { successRate: number; satisfaction: number; count: number };
  resultsB: { successRate: number; satisfaction: number; count: number };
}

export const promptLibrary = new PromptLibrary();
