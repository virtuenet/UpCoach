import { logger } from '../../utils/logger';

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: string;
  effectiveness?: number;
}

export class PromptEngineering {
  private templates: Map<string, PromptTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Goal Setting Templates
    this.addTemplate({
      id: 'goal-setting-smart',
      name: 'SMART Goal Setting',
      template: `Help the user transform their goal into a SMART goal:
- Specific: {goal_description}
- Current situation: {current_state}
- Timeline preference: {timeline}

Guide them to make it Specific, Measurable, Achievable, Relevant, and Time-bound.`,
      variables: ['goal_description', 'current_state', 'timeline'],
      category: 'goal'
    });

    // Habit Formation Templates
    this.addTemplate({
      id: 'habit-formation-tiny',
      name: 'Tiny Habits Method',
      template: `Design a tiny habit for the user:
- Desired habit: {desired_habit}
- Current routine: {current_routine}
- Motivation level: {motivation_level}

Use the Tiny Habits method: After I [ANCHOR], I will [TINY BEHAVIOR]. Then celebrate!`,
      variables: ['desired_habit', 'current_routine', 'motivation_level'],
      category: 'habit'
    });

    // Reflection Templates
    this.addTemplate({
      id: 'reflection-daily',
      name: 'Daily Reflection',
      template: `Guide the user through a daily reflection:
- Today's date: {date}
- Main accomplishments: {accomplishments}
- Challenges faced: {challenges}
- Mood/energy: {mood}

Help them extract insights and plan for tomorrow.`,
      variables: ['date', 'accomplishments', 'challenges', 'mood'],
      category: 'reflection'
    });

    // Motivation Templates
    this.addTemplate({
      id: 'motivation-obstacles',
      name: 'Overcoming Obstacles',
      template: `Help the user overcome their current obstacle:
- Obstacle: {obstacle}
- Previous attempts: {previous_attempts}
- Available resources: {resources}
- Success criteria: {success_criteria}

Provide practical strategies and emotional support.`,
      variables: ['obstacle', 'previous_attempts', 'resources', 'success_criteria'],
      category: 'motivation'
    });
  }

  private addTemplate(template: PromptTemplate) {
    this.templates.set(template.id, template);
  }

  optimizeMessages(messages: any[], options: any): any[] {
    const optimized = [...messages];

    // Apply conversation flow optimization
    if (messages.length > 5) {
      // Summarize earlier messages to reduce context
      const summary = this.summarizeEarlyMessages(messages.slice(0, -5));
      if (summary) {
        optimized.splice(0, messages.length - 5, {
          role: 'assistant',
          content: `Previous conversation summary: ${summary}`
        });
      }
    }

    // Apply role-specific optimizations
    if (options.personality) {
      optimized.forEach(msg => {
        if (msg.role === 'assistant') {
          msg.content = this.applyPersonalityTone(msg.content, options.personality);
        }
      });
    }

    // Add context injections
    if (options.context && Object.keys(options.context).length > 0) {
      const contextString = this.formatContext(options.context);
      if (contextString) {
        const lastUserIndex = optimized.findLastIndex(m => m.role === 'user');
        if (lastUserIndex >= 0) {
          optimized[lastUserIndex].content += `\n\nContext: ${contextString}`;
        }
      }
    }

    return optimized;
  }

  generatePersonalizedPrompt(
    basePrompt: string,
    userContext: any,
    promptType: string
  ): string {
    const template = this.templates.get(`${promptType}-${userContext.preferredMethod || 'default'}`);
    
    if (!template) {
      return this.enhanceBasePrompt(basePrompt, userContext);
    }

    let personalizedPrompt = template.template;
    
    // Replace variables with context values
    template.variables.forEach(variable => {
      const value = this.extractContextValue(userContext, variable);
      personalizedPrompt = personalizedPrompt.replace(`{${variable}}`, value);
    });

    // Add personalization layers
    personalizedPrompt = this.addPersonalizationLayers(personalizedPrompt, userContext);

    return personalizedPrompt;
  }

  private summarizeEarlyMessages(messages: any[]): string {
    // Simple summarization - in production, this could use AI
    const topics = new Set<string>();
    const keyPoints: string[] = [];

    messages.forEach(msg => {
      if (msg.content.length > 50) {
        // Extract key sentences (simplified)
        const sentences = msg.content.split('.').filter(s => s.trim().length > 20);
        if (sentences.length > 0) {
          keyPoints.push(sentences[0].trim());
        }
      }
    });

    return keyPoints.length > 0 
      ? `Key points discussed: ${keyPoints.slice(0, 3).join('; ')}`
      : '';
  }

  private applyPersonalityTone(content: string, personality: string): string {
    // Personality tone adjustments
    const toneAdjustments: Record<string, (content: string) => string> = {
      motivational: (c) => c.replace(/you can/gi, 'you absolutely can')
        .replace(/try to/gi, 'confidently'),
      analytical: (c) => c.replace(/maybe/gi, 'analysis suggests')
        .replace(/probably/gi, 'statistically'),
      empathetic: (c) => c.replace(/you should/gi, 'you might want to')
        .replace(/must/gi, 'could consider'),
      direct: (c) => c.replace(/you might want to/gi, 'you should')
        .replace(/perhaps/gi, 'definitely')
    };

    const adjuster = toneAdjustments[personality];
    return adjuster ? adjuster(content) : content;
  }

  private formatContext(context: any): string {
    const relevantContext: string[] = [];

    if (context.userGoals?.length > 0) {
      relevantContext.push(`Active goals: ${context.userGoals.slice(0, 2).map(g => g.title).join(', ')}`);
    }

    if (context.recentProgress) {
      relevantContext.push(`Recent progress: ${context.recentProgress}`);
    }

    if (context.currentMood) {
      relevantContext.push(`Current mood: ${context.currentMood}`);
    }

    if (context.preferences) {
      relevantContext.push(`Preferences: ${JSON.stringify(context.preferences)}`);
    }

    return relevantContext.join('; ');
  }

  private enhanceBasePrompt(basePrompt: string, userContext: any): string {
    let enhanced = basePrompt;

    // Add user's name if available
    if (userContext.userName) {
      enhanced = enhanced.replace(/the user/gi, userContext.userName);
    }

    // Add time-based context
    const timeOfDay = new Date().getHours();
    if (timeOfDay < 12) {
      enhanced = `Good morning! ${enhanced}`;
    } else if (timeOfDay < 17) {
      enhanced = `Good afternoon! ${enhanced}`;
    } else {
      enhanced = `Good evening! ${enhanced}`;
    }

    // Add progress context
    if (userContext.streakDays > 0) {
      enhanced += ` (You're on a ${userContext.streakDays}-day streak!)`;
    }

    return enhanced;
  }

  private extractContextValue(context: any, variable: string): string {
    // Map variable names to context paths
    const mappings: Record<string, string> = {
      goal_description: 'currentGoal.description',
      current_state: 'currentGoal.currentState',
      timeline: 'currentGoal.timeline',
      desired_habit: 'targetHabit.name',
      current_routine: 'dailyRoutine.summary',
      motivation_level: 'metrics.motivationLevel',
      date: new Date().toLocaleDateString(),
      accomplishments: 'todayAccomplishments',
      challenges: 'todayChallenges',
      mood: 'currentMood',
      obstacle: 'currentChallenge.description',
      previous_attempts: 'currentChallenge.previousAttempts',
      resources: 'availableResources',
      success_criteria: 'currentChallenge.successCriteria'
    };

    const path = mappings[variable];
    if (!path) return `{${variable}}`;

    // Simple path resolution
    const value = path.split('.').reduce((obj, key) => obj?.[key], context);
    return value || `{${variable}}`;
  }

  private addPersonalizationLayers(prompt: string, context: any): string {
    const layers: string[] = [];

    // Learning style layer
    if (context.learningStyle) {
      layers.push(`Adapt your response for a ${context.learningStyle} learner.`);
    }

    // Communication preference layer
    if (context.communicationPreference) {
      layers.push(`Use a ${context.communicationPreference} communication style.`);
    }

    // Current energy level layer
    if (context.energyLevel) {
      if (context.energyLevel < 3) {
        layers.push('Keep suggestions simple and achievable given their low energy.');
      } else if (context.energyLevel > 7) {
        layers.push('They have high energy - suggest ambitious actions.');
      }
    }

    // Progress stage layer
    if (context.progressStage) {
      layers.push(`They are in the ${context.progressStage} stage of their journey.`);
    }

    return layers.length > 0 
      ? `${prompt}\n\nPersonalization notes: ${layers.join(' ')}`
      : prompt;
  }

  // Track prompt effectiveness
  async trackPromptEffectiveness(
    templateId: string,
    userFeedback: number,
    completionRate: number
  ) {
    const template = this.templates.get(templateId);
    if (template) {
      // Update effectiveness score (weighted average)
      const currentScore = template.effectiveness || 0.5;
      const feedbackWeight = 0.7;
      const completionWeight = 0.3;
      
      template.effectiveness = (
        (currentScore * 0.8) + // Historical weight
        (userFeedback * feedbackWeight + completionRate * completionWeight) * 0.2
      );

      logger.info(`Updated prompt effectiveness for ${templateId}: ${template.effectiveness}`);
    }
  }

  // Get best prompt for a given context
  getBestPromptTemplate(category: string, userContext: any): PromptTemplate | null {
    const categoryTemplates = Array.from(this.templates.values())
      .filter(t => t.category === category);

    if (categoryTemplates.length === 0) return null;

    // Sort by effectiveness and contextual relevance
    return categoryTemplates.sort((a, b) => {
      const aScore = (a.effectiveness || 0.5) * this.getContextualRelevance(a, userContext);
      const bScore = (b.effectiveness || 0.5) * this.getContextualRelevance(b, userContext);
      return bScore - aScore;
    })[0];
  }

  private getContextualRelevance(template: PromptTemplate, context: any): number {
    let relevance = 1.0;

    // Check if all required variables are available in context
    const availableVars = template.variables.filter(v => 
      this.extractContextValue(context, v) !== `{${v}}`
    );
    
    relevance *= (availableVars.length / template.variables.length);

    // Boost relevance for user's preferred methods
    if (context.preferredMethods?.includes(template.category)) {
      relevance *= 1.2;
    }

    return Math.min(relevance, 1.0);
  }
}

export const promptEngineering = new PromptEngineering();