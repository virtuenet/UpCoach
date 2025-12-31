/**
 * Content Generation Engine
 *
 * AI-powered content generation system using GPT-4 for creating personalized
 * coaching content, motivational messages, goal descriptions, and more.
 *
 * @module ml/ContentGenerationEngine
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';
import OpenAI from 'openai';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ContentRequest {
  type: ContentType;
  context: ContentContext;
  options?: ContentOptions;
}

type ContentType =
  | 'goal_description'
  | 'habit_suggestion'
  | 'coaching_question'
  | 'motivational_message'
  | 'progress_report'
  | 'email_template'
  | 'sms_message'
  | 'social_post'
  | 'blog_article'
  | 'worksheet'
  | 'exercise_description'
  | 'reflection_prompt'
  | 'affirmation'
  | 'success_story';

interface ContentContext {
  userId?: string;
  userName?: string;
  userGoals?: string[];
  currentProgress?: number;
  coachName?: string;
  tone?: 'formal' | 'casual' | 'inspirational' | 'professional' | 'friendly';
  targetAudience?: string;
  keywords?: string[];
  subject?: string;
  template?: string;
}

interface ContentOptions {
  maxLength?: number;
  minLength?: number;
  temperature?: number;
  variants?: number;
  includeEmoji?: boolean;
  brandVoice?: string;
  format?: 'plain' | 'html' | 'markdown';
}

interface GeneratedContent {
  content: string;
  variants?: string[];
  metadata: {
    type: ContentType;
    wordCount: number;
    readabilityScore: number;
    sentimentScore: number;
    engagementPotential: number;
    generatedAt: Date;
    modelUsed: string;
    tokensUsed: number;
  };
  qualityScore: number;
}

interface ContentQuality {
  readability: number;
  sentiment: number;
  engagement: number;
  brandAlignment: number;
  grammarScore: number;
  overall: number;
}

interface ABTestVariant {
  id: string;
  content: string;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
  };
}

interface Template {
  id: string;
  name: string;
  type: ContentType;
  prompt: string;
  variables: string[];
  examples: string[];
}

interface ContentCache {
  content: string;
  timestamp: number;
  hits: number;
}

// ============================================================================
// Content Generation Engine
// ============================================================================

export class ContentGenerationEngine extends EventEmitter {
  private redis: Redis;
  private openai: OpenAI;
  private templates: Map<string, Template>;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly MAX_TOKENS = 4096;

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.templates = new Map();
    this.initializeTemplates();
  }

  // ============================================================================
  // Template Initialization
  // ============================================================================

  private initializeTemplates(): void {
    const templates: Template[] = [
      {
        id: 'goal_description',
        name: 'Goal Description Generator',
        type: 'goal_description',
        prompt: 'Generate a compelling and specific goal description for {goalType}. Make it SMART (Specific, Measurable, Achievable, Relevant, Time-bound).',
        variables: ['goalType', 'userContext', 'timeframe'],
        examples: [
          'Lose 15 pounds in 3 months through a combination of regular exercise and balanced nutrition',
          'Complete a marathon in under 4 hours by following a structured 16-week training plan',
        ],
      },
      {
        id: 'habit_suggestion',
        name: 'Habit Suggestion Generator',
        type: 'habit_suggestion',
        prompt: 'Suggest a keystone habit that will help achieve {goal}. Explain why this habit is effective.',
        variables: ['goal', 'currentHabits', 'lifestyle'],
        examples: [
          'Morning meditation for 10 minutes to build mental clarity and emotional resilience',
          'Daily 30-minute walk to boost energy levels and improve cardiovascular health',
        ],
      },
      {
        id: 'coaching_question',
        name: 'Coaching Question Generator',
        type: 'coaching_question',
        prompt: 'Generate a powerful coaching question about {topic} that encourages deep reflection.',
        variables: ['topic', 'context', 'questionType'],
        examples: [
          'What would success look like if you had unlimited resources and confidence?',
          'What patterns do you notice in situations where you feel most energized?',
        ],
      },
      {
        id: 'motivational_message',
        name: 'Motivational Message Generator',
        type: 'motivational_message',
        prompt: 'Create an inspiring and authentic motivational message for someone working on {goal}.',
        variables: ['goal', 'currentProgress', 'challenge'],
        examples: [
          'Every small step forward is a victory. Your consistency today builds the success of tomorrow.',
          'Progress isn\'t always linear, but your commitment to showing up every day is what creates transformation.',
        ],
      },
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    this.emit('templates:initialized', { count: templates.length });
  }

  // ============================================================================
  // Goal Description Generation
  // ============================================================================

  async generateGoalDescription(
    goalType: string,
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    const cacheKey = `content:goal_description:${goalType}:${JSON.stringify(context)}`;

    try {
      const cached = await this.getCachedContent(cacheKey);
      if (cached) return cached;

      const prompt = this.buildPrompt('goal_description', {
        goalType,
        userContext: context.userName ? `for ${context.userName}` : '',
        tone: context.tone || 'professional',
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert goal-setting coach. Create SMART goals that are specific, measurable, achievable, relevant, and time-bound.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxLength || 200,
        n: options?.variants || 1,
      });

      const content = response.choices[0].message.content || '';
      const variants = response.choices.slice(1).map(c => c.message.content || '');

      const result = await this.processGeneratedContent(
        content,
        variants,
        'goal_description',
        response.usage?.total_tokens || 0
      );

      await this.cacheContent(cacheKey, result);
      this.emit('content:generated', { type: 'goal_description', qualityScore: result.qualityScore });

      return result;
    } catch (error) {
      this.emit('error', { operation: 'generateGoalDescription', error });
      throw error;
    }
  }

  // ============================================================================
  // Habit Suggestion Generation
  // ============================================================================

  async generateHabitSuggestion(
    goal: string,
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Suggest a powerful keystone habit that will help someone achieve: "${goal}".

Context:
${context.userGoals ? `Current goals: ${context.userGoals.join(', ')}` : ''}
${context.keywords ? `Focus areas: ${context.keywords.join(', ')}` : ''}

Provide:
1. The specific habit
2. Why it's effective (research-backed)
3. How to implement it (practical steps)
4. Expected timeline for results

Keep it ${context.tone || 'professional'} and actionable.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a behavioral psychology expert specializing in habit formation. Base suggestions on scientific research.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxLength || 400,
      });

      const content = response.choices[0].message.content || '';

      const result = await this.processGeneratedContent(
        content,
        [],
        'habit_suggestion',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'habit_suggestion', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'generateHabitSuggestion', error });
      throw error;
    }
  }

  // ============================================================================
  // Coaching Question Generation
  // ============================================================================

  async generateCoachingQuestion(
    topic: string,
    context: ContentContext,
    questionType: 'open-ended' | 'socratic' | 'scaling' | 'miracle' = 'open-ended',
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const systemPrompts = {
        'open-ended': 'You are a professional coach skilled in asking powerful open-ended questions that promote self-discovery.',
        'socratic': 'You are a Socratic questioner who helps people examine their assumptions and think critically.',
        'scaling': 'You are a solution-focused coach who uses scaling questions to measure progress and identify next steps.',
        'miracle': 'You are a coach who uses miracle questions to help clients envision their ideal future.',
      };

      const questionGuidelines = {
        'open-ended': 'Ask a question that cannot be answered with yes/no and encourages exploration.',
        'socratic': 'Ask a question that challenges assumptions and promotes deeper thinking.',
        'scaling': 'Ask a scaling question (1-10) that helps measure current state and identify next steps.',
        'miracle': 'Ask a miracle question that helps envision an ideal future state.',
      };

      const prompt = `Topic: ${topic}

${questionGuidelines[questionType]}

Make the question:
- Thought-provoking
- Relevant to their journey
- ${context.tone || 'professional'} in tone
- Empowering and forward-looking

Generate 1 powerful coaching question.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompts[questionType],
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options?.temperature || 0.8,
        max_tokens: 150,
        n: options?.variants || 3,
      });

      const content = response.choices[0].message.content || '';
      const variants = response.choices.slice(1).map(c => c.message.content || '');

      const result = await this.processGeneratedContent(
        content,
        variants,
        'coaching_question',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'coaching_question', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'generateCoachingQuestion', error });
      throw error;
    }
  }

  // ============================================================================
  // Motivational Message Creation
  // ============================================================================

  async createMotivationalMessage(
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Create an authentic, inspiring motivational message for someone:

${context.userGoals ? `Working on: ${context.userGoals.join(', ')}` : ''}
${context.currentProgress ? `Current progress: ${context.currentProgress}%` : ''}
${context.subject ? `Facing: ${context.subject}` : ''}

Tone: ${context.tone || 'inspirational'}
Length: ${options?.maxLength ? `Max ${options.maxLength} characters` : 'Brief and impactful'}
${options?.includeEmoji ? 'Include 1-2 relevant emojis' : 'No emojis'}

Make it:
- Genuine and personal
- Actionable, not just platitudes
- Empowering and forward-looking
- Specific to their situation`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an inspiring coach who creates authentic, personalized motivational messages. Avoid clichés and generic statements.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options?.temperature || 0.8,
        max_tokens: 200,
        n: options?.variants || 2,
      });

      const content = response.choices[0].message.content || '';
      const variants = response.choices.slice(1).map(c => c.message.content || '');

      const result = await this.processGeneratedContent(
        content,
        variants,
        'motivational_message',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'motivational_message', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'createMotivationalMessage', error });
      throw error;
    }
  }

  // ============================================================================
  // Progress Report Writing
  // ============================================================================

  async writeProgressReport(
    userId: string,
    data: {
      period: string;
      achievements: string[];
      challenges: string[];
      metrics: Record<string, number>;
    },
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Write a comprehensive progress report for ${context.userName || 'the user'}.

Period: ${data.period}

Achievements:
${data.achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Challenges:
${data.challenges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Key Metrics:
${Object.entries(data.metrics).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Create a report that:
1. Celebrates achievements specifically
2. Acknowledges challenges with empathy
3. Provides data-driven insights
4. Offers actionable recommendations
5. Ends with encouraging next steps

Tone: ${context.tone || 'professional'}
Format: ${options?.format || 'markdown'}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an insightful coach who writes detailed, encouraging progress reports that balance data with empathy.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: options?.maxLength || 800,
      });

      const content = response.choices[0].message.content || '';

      const result = await this.processGeneratedContent(
        content,
        [],
        'progress_report',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'progress_report', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'writeProgressReport', error });
      throw error;
    }
  }

  // ============================================================================
  // Email Template Generation
  // ============================================================================

  async generateEmailTemplate(
    purpose: string,
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Create a professional email template for: ${purpose}

${context.coachName ? `From: ${context.coachName}` : ''}
${context.userName ? `To: ${context.userName}` : 'To: [User Name]'}
${context.subject ? `Subject: ${context.subject}` : ''}

Include:
- Compelling subject line
- Personalized greeting
- Clear value proposition
- Call-to-action
- Professional signature

Tone: ${context.tone || 'professional'}
Brand voice: ${context.brandVoice || 'warm and professional'}

Make it:
- Scannable with clear sections
- Action-oriented
- Personalized, not templated-feeling
- Mobile-friendly (short paragraphs)`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email copywriter specializing in coaching and personal development. Create emails that get opened and read.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      });

      const content = response.choices[0].message.content || '';

      const result = await this.processGeneratedContent(
        content,
        [],
        'email_template',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'email_template', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'generateEmailTemplate', error });
      throw error;
    }
  }

  // ============================================================================
  // SMS Message Optimization
  // ============================================================================

  async optimizeSMSMessage(
    message: string,
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const maxChars = 160;

      const prompt = `Optimize this message for SMS (max ${maxChars} characters):

Original: "${message}"

Requirements:
- Stay under ${maxChars} characters
- Keep the core message and CTA
- Make it conversational
- ${context.tone || 'friendly'} tone
- Include link placeholder if needed: [link]

Return only the optimized message, nothing else.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing concise, engaging SMS messages that drive action.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
        n: options?.variants || 3,
      });

      const content = response.choices[0].message.content || '';
      const variants = response.choices.slice(1)
        .map(c => c.message.content || '')
        .filter(v => v.length <= maxChars);

      // Ensure main content is under limit
      const finalContent = content.length <= maxChars ? content : content.substring(0, maxChars - 3) + '...';

      const result = await this.processGeneratedContent(
        finalContent,
        variants,
        'sms_message',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'sms_message', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'optimizeSMSMessage', error });
      throw error;
    }
  }

  // ============================================================================
  // Social Media Post Creation
  // ============================================================================

  async createSocialMediaPost(
    platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook',
    topic: string,
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const platformSpecs = {
        twitter: { maxLength: 280, hashtags: 2, style: 'concise and punchy' },
        linkedin: { maxLength: 1300, hashtags: 5, style: 'professional and insightful' },
        instagram: { maxLength: 2200, hashtags: 10, style: 'visual and engaging' },
        facebook: { maxLength: 500, hashtags: 3, style: 'conversational and relatable' },
      };

      const specs = platformSpecs[platform];

      const prompt = `Create a ${platform} post about: ${topic}

Style: ${specs.style}
Max length: ${specs.maxLength} characters
Include: ${specs.hashtags} relevant hashtags
Tone: ${context.tone || 'professional'}
${options?.includeEmoji ? 'Include relevant emojis' : ''}

${context.keywords ? `Keywords: ${context.keywords.join(', ')}` : ''}
${context.targetAudience ? `Audience: ${context.targetAudience}` : ''}

Make it:
- Engaging and shareable
- Value-driven
- Include a clear CTA
- Optimized for ${platform}'s algorithm`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a social media expert specializing in ${platform}. Create posts that drive engagement and align with platform best practices.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 400,
        n: options?.variants || 2,
      });

      const content = response.choices[0].message.content || '';
      const variants = response.choices.slice(1).map(c => c.message.content || '');

      const result = await this.processGeneratedContent(
        content,
        variants,
        'social_post',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'social_post', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'createSocialMediaPost', error });
      throw error;
    }
  }

  // ============================================================================
  // Blog Article Drafting
  // ============================================================================

  async draftBlogArticle(
    title: string,
    outline: string[],
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Write a comprehensive blog article:

Title: ${title}

Outline:
${outline.map((section, i) => `${i + 1}. ${section}`).join('\n')}

Requirements:
- Engaging introduction with hook
- Well-researched, authoritative content
- Practical, actionable advice
- Real-world examples
- Compelling conclusion with CTA
- SEO-optimized (keywords: ${context.keywords?.join(', ') || 'coaching, personal development'})

Tone: ${context.tone || 'professional'}
Target word count: ${options?.maxLength || 1500}
Format: ${options?.format || 'markdown'}
Audience: ${context.targetAudience || 'coaching professionals'}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content writer specializing in coaching and personal development. Write engaging, well-researched articles.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: options?.maxLength || 2000,
      });

      const content = response.choices[0].message.content || '';

      const result = await this.processGeneratedContent(
        content,
        [],
        'blog_article',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'blog_article', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'draftBlogArticle', error });
      throw error;
    }
  }

  // ============================================================================
  // Worksheet Creation
  // ============================================================================

  async createWorksheet(
    topic: string,
    type: 'reflection' | 'goal-setting' | 'habit-tracker' | 'assessment',
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const worksheetTypes = {
        reflection: 'thoughtful reflection prompts that encourage self-discovery',
        'goal-setting': 'structured goal-setting framework with SMART criteria',
        'habit-tracker': 'habit tracking system with progress monitoring',
        assessment: 'comprehensive self-assessment with scoring',
      };

      const prompt = `Create a ${type} worksheet on: ${topic}

Include:
- Clear instructions
- ${worksheetTypes[type]}
- Space for written responses
- Action items or next steps
- Coaching tips throughout

Tone: ${context.tone || 'professional'}
Format: ${options?.format || 'markdown'}
Make it practical and immediately usable.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an instructional designer creating effective coaching worksheets. Make them practical and engaging.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const content = response.choices[0].message.content || '';

      const result = await this.processGeneratedContent(
        content,
        [],
        'worksheet',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'worksheet', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'createWorksheet', error });
      throw error;
    }
  }

  // ============================================================================
  // Exercise Description Writing
  // ============================================================================

  async writeExerciseDescription(
    exerciseName: string,
    purpose: string,
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Write a clear, engaging description for this coaching exercise:

Exercise: ${exerciseName}
Purpose: ${purpose}

Include:
1. What it is (overview)
2. Why it's effective (benefits)
3. How to do it (step-by-step)
4. Time required
5. Tips for success
6. Common pitfalls to avoid

Tone: ${context.tone || 'professional'}
Make it actionable and encouraging.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a coaching expert writing clear, practical exercise descriptions. Balance detail with readability.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 600,
      });

      const content = response.choices[0].message.content || '';

      const result = await this.processGeneratedContent(
        content,
        [],
        'exercise_description',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'exercise_description', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'writeExerciseDescription', error });
      throw error;
    }
  }

  // ============================================================================
  // Reflection Prompt Generation
  // ============================================================================

  async generateReflectionPrompt(
    theme: string,
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Create a powerful reflection prompt on: ${theme}

Make it:
- Open-ended and thought-provoking
- Personally relevant
- Encouraging deeper self-awareness
- ${context.tone || 'thoughtful'} in tone

Generate ${options?.variants || 3} different prompts.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a contemplative coach who creates reflection prompts that lead to meaningful insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
        n: options?.variants || 3,
      });

      const content = response.choices[0].message.content || '';
      const variants = response.choices.slice(1).map(c => c.message.content || '');

      const result = await this.processGeneratedContent(
        content,
        variants,
        'reflection_prompt',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'reflection_prompt', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'generateReflectionPrompt', error });
      throw error;
    }
  }

  // ============================================================================
  // Personalized Affirmations
  // ============================================================================

  async createPersonalizedAffirmation(
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Create personalized affirmations for someone:

${context.userGoals ? `Goals: ${context.userGoals.join(', ')}` : ''}
${context.subject ? `Focus area: ${context.subject}` : ''}

Create ${options?.variants || 5} powerful affirmations that:
- Use "I am" or "I" statements
- Are present tense
- Are specific and believable
- Build confidence and motivation
- Are authentic, not cheesy

Return one affirmation per line.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a positive psychology expert creating evidence-based affirmations that build genuine self-belief.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      const content = response.choices[0].message.content || '';

      const result = await this.processGeneratedContent(
        content,
        [],
        'affirmation',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'affirmation', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'createPersonalizedAffirmation', error });
      throw error;
    }
  }

  // ============================================================================
  // Success Story Templates
  // ============================================================================

  async generateSuccessStory(
    userJourney: {
      before: string;
      challenge: string;
      action: string;
      result: string;
      lesson: string;
    },
    context: ContentContext,
    options?: ContentOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = `Write a compelling success story using this journey:

Before: ${userJourney.before}
Challenge: ${userJourney.challenge}
Action Taken: ${userJourney.action}
Result: ${userJourney.result}
Key Lesson: ${userJourney.lesson}

Structure:
- Engaging opening (hook)
- Relatable struggle
- Turning point
- Specific actions taken
- Measurable results
- Inspirational takeaway

Tone: ${context.tone || 'inspirational'}
Length: ${options?.maxLength || 500} words
Make it authentic and relatable.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a storyteller who crafts inspiring success stories that motivate without exaggeration.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: options?.maxLength || 700,
      });

      const content = response.choices[0].message.content || '';

      const result = await this.processGeneratedContent(
        content,
        [],
        'success_story',
        response.usage?.total_tokens || 0
      );

      this.emit('content:generated', { type: 'success_story', qualityScore: result.qualityScore });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'generateSuccessStory', error });
      throw error;
    }
  }

  // ============================================================================
  // Content Quality Assessment
  // ============================================================================

  async assessContentQuality(content: string): Promise<ContentQuality> {
    try {
      // Readability (Flesch Reading Ease approximation)
      const readability = this.calculateReadabilityScore(content);

      // Sentiment analysis (basic)
      const sentiment = this.analyzeSentiment(content);

      // Engagement potential
      const engagement = this.calculateEngagementPotential(content);

      // Brand alignment (keyword presence, tone consistency)
      const brandAlignment = this.assessBrandAlignment(content);

      // Grammar score (basic checks)
      const grammarScore = this.assessGrammar(content);

      const overall = (
        readability * 0.2 +
        sentiment * 0.2 +
        engagement * 0.3 +
        brandAlignment * 0.15 +
        grammarScore * 0.15
      );

      return {
        readability,
        sentiment,
        engagement,
        brandAlignment,
        grammarScore,
        overall,
      };
    } catch (error) {
      this.emit('error', { operation: 'assessContentQuality', error });
      throw error;
    }
  }

  // ============================================================================
  // A/B Testing Support
  // ============================================================================

  async createABTestVariants(
    baseContent: string,
    context: ContentContext,
    numVariants: number = 2
  ): Promise<ABTestVariant[]> {
    try {
      const variants: ABTestVariant[] = [];

      // Create base variant
      variants.push({
        id: 'control',
        content: baseContent,
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          conversionRate: 0,
        },
      });

      // Generate variations
      for (let i = 0; i < numVariants; i++) {
        const prompt = `Create a variation of this content that tests a different approach:

Original: "${baseContent}"

Variation ${i + 1} should:
- ${i === 0 ? 'Use a more direct, action-oriented approach' : 'Use a more empathetic, story-driven approach'}
- Keep the core message
- Test a different hook or CTA
- Maintain ${context.tone || 'professional'} tone

Return only the variation, nothing else.`;

        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an A/B testing expert creating meaningful content variations.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 300,
        });

        variants.push({
          id: `variant_${i + 1}`,
          content: response.choices[0].message.content || '',
          performance: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            conversionRate: 0,
          },
        });
      }

      this.emit('ab_test:created', { variantCount: variants.length });
      return variants;
    } catch (error) {
      this.emit('error', { operation: 'createABTestVariants', error });
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async processGeneratedContent(
    content: string,
    variants: string[],
    type: ContentType,
    tokensUsed: number
  ): Promise<GeneratedContent> {
    const quality = await this.assessContentQuality(content);
    const wordCount = content.split(/\s+/).length;

    return {
      content,
      variants: variants.length > 0 ? variants : undefined,
      metadata: {
        type,
        wordCount,
        readabilityScore: quality.readability,
        sentimentScore: quality.sentiment,
        engagementPotential: quality.engagement,
        generatedAt: new Date(),
        modelUsed: 'gpt-4-turbo-preview',
        tokensUsed,
      },
      qualityScore: quality.overall,
    };
  }

  private buildPrompt(templateId: string, variables: Record<string, any>): string {
    const template = this.templates.get(templateId);
    if (!template) return '';

    let prompt = template.prompt;
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(`{${key}}`, value);
    });

    return prompt;
  }

  private calculateReadabilityScore(text: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = this.countSyllables(text);

    // Flesch Reading Ease
    if (words === 0 || sentences === 0) return 0.5;

    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(1, score / 100));
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;

    words.forEach(word => {
      word = word.replace(/[^a-z]/g, '');
      if (word.length <= 3) {
        count += 1;
      } else {
        const vowels = word.match(/[aeiouy]+/g);
        count += vowels ? vowels.length : 1;
      }
    });

    return count;
  }

  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis using keyword matching
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'success', 'achieve', 'grow', 'improve', 'benefit'];
    const negativeWords = ['fail', 'difficult', 'struggle', 'problem', 'issue', 'challenge', 'hard', 'never'];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0.5; // Neutral baseline

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) score += 0.02;
      if (negativeWords.some(nw => word.includes(nw))) score -= 0.02;
    });

    return Math.max(0, Math.min(1, score));
  }

  private calculateEngagementPotential(text: string): number {
    let score = 0.5;

    // Check for questions
    if (text.includes('?')) score += 0.1;

    // Check for calls to action
    const ctaWords = ['click', 'start', 'join', 'discover', 'learn', 'try', 'get'];
    if (ctaWords.some(word => text.toLowerCase().includes(word))) score += 0.1;

    // Check for power words
    const powerWords = ['you', 'your', 'now', 'new', 'proven', 'results'];
    const powerWordCount = powerWords.filter(word => text.toLowerCase().includes(word)).length;
    score += powerWordCount * 0.05;

    // Check length (ideal 50-200 words for engagement)
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 200) score += 0.1;

    return Math.min(1, score);
  }

  private assessBrandAlignment(text: string): number {
    // Simple brand alignment check
    let score = 0.7; // Baseline

    // Check for professional language
    const professionalWords = ['coach', 'goal', 'progress', 'success', 'development'];
    const matches = professionalWords.filter(word => text.toLowerCase().includes(word)).length;
    score += matches * 0.06;

    return Math.min(1, score);
  }

  private assessGrammar(text: string): number {
    // Basic grammar checks
    let score = 1.0;

    // Check for common issues
    if (/\s{2,}/.test(text)) score -= 0.1; // Multiple spaces
    if (/[.!?]{2,}/.test(text)) score -= 0.1; // Multiple punctuation
    if (!/[.!?]$/.test(text.trim())) score -= 0.05; // Missing end punctuation

    return Math.max(0, score);
  }

  private async getCachedContent(key: string): Promise<GeneratedContent | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        const data: ContentCache = JSON.parse(cached);
        // Update hit count
        data.hits++;
        await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(data));
        this.emit('cache:hit', { key });
        return JSON.parse(data.content);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private async cacheContent(key: string, content: GeneratedContent): Promise<void> {
    try {
      const cacheData: ContentCache = {
        content: JSON.stringify(content),
        timestamp: Date.now(),
        hits: 0,
      };
      await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(cacheData));
    } catch (error) {
      // Silent fail for caching
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async close(): Promise<void> {
    await this.redis.quit();
    this.removeAllListeners();
  }
}

export default ContentGenerationEngine;
