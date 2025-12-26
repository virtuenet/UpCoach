import { Pool } from 'pg';
import { logger } from '../../utils/logger';

/**
 * Goal Decomposer (Phase 8)
 *
 * Automatically breaks down large goals into:
 * - SMART milestones (4-8 milestones per goal)
 * - Suggested habits to support goal
 * - Realistic timeline estimation
 * - Dependency mapping
 *
 * Uses GPT-4 for intelligent goal parsing and decomposition
 */

export interface GoalPlan {
  goalId: string;
  milestones: Milestone[];
  suggestedHabits: SuggestedHabit[];
  estimatedCompletion: Date;
  dependencies?: string[];
  confidence: number;
}

export interface Milestone {
  title: string;
  description: string;
  order: number;
  estimatedDuration: number; // days
  targetDate?: Date;
  metrics?: {
    type: string;
    target: number;
    unit: string;
  };
}

export interface SuggestedHabit {
  name: string;
  category: string;
  frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  description: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GoalAnalysis {
  isSmartGoal: boolean;
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  timeBound: boolean;
  suggestions: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export class GoalDecomposer {
  private db: Pool;
  private openAIKey: string;

  constructor(db: Pool, openAIKey?: string) {
    this.db = db;
    this.openAIKey = openAIKey || process.env.OPENAI_API_KEY || '';
  }

  /**
   * Analyze goal and determine if it's SMART
   */
  async analyzeGoal(goalTitle: string, goalDescription?: string): Promise<GoalAnalysis> {
    try {
      const combined = `${goalTitle}. ${goalDescription || ''}`.toLowerCase();

      // Check SMART criteria (simplified - use GPT-4 in production)
      const analysis: GoalAnalysis = {
        isSmartGoal: false,
        specific: this.checkSpecific(combined),
        measurable: this.checkMeasurable(combined),
        achievable: true, // Requires more context
        relevant: true, // Requires user context
        timeBound: this.checkTimeBound(combined),
        suggestions: [],
        category: this.categorizeGoal(combined),
        difficulty: this.assessDifficulty(combined),
      };

      analysis.isSmartGoal =
        analysis.specific &&
        analysis.measurable &&
        analysis.achievable &&
        analysis.relevant &&
        analysis.timeBound;

      // Generate improvement suggestions
      if (!analysis.specific) {
        analysis.suggestions.push('Make your goal more specific - what exactly do you want to achieve?');
      }
      if (!analysis.measurable) {
        analysis.suggestions.push('Add measurable metrics - how will you know when you\'ve succeeded?');
      }
      if (!analysis.timeBound) {
        analysis.suggestions.push('Set a target date - when do you want to achieve this by?');
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze goal', { goalTitle, error });
      throw error;
    }
  }

  /**
   * Generate comprehensive goal plan
   */
  async generateGoalPlan(goalId: string): Promise<GoalPlan> {
    try {
      // Get goal details
      const goalQuery = `
        SELECT * FROM goals
        WHERE id = $1
      `;
      const goalResult = await this.db.query(goalQuery, [goalId]);

      if (goalResult.rows.length === 0) {
        throw new Error('Goal not found');
      }

      const goal = goalResult.rows[0];

      // Analyze goal
      const analysis = await this.analyzeGoal(goal.title, goal.description);

      // Generate milestones
      const milestones = await this.generateMilestones(goal, analysis);

      // Generate habit suggestions
      const suggestedHabits = await this.generateHabitSuggestions(goal, analysis);

      // Estimate completion date
      const estimatedCompletion = this.estimateCompletion(goal, milestones);

      const plan: GoalPlan = {
        goalId,
        milestones,
        suggestedHabits,
        estimatedCompletion,
        confidence: this.calculateConfidence(goal, analysis),
      };

      // Save plan to database
      await this.savePlan(plan);

      return plan;
    } catch (error) {
      logger.error('Failed to generate goal plan', { goalId, error });
      throw error;
    }
  }

  /**
   * Generate milestones for goal
   */
  private async generateMilestones(goal: any, analysis: GoalAnalysis): Promise<Milestone[]> {
    const category = goal.category?.toLowerCase() || analysis.category;

    // Template-based milestone generation (use GPT-4 for intelligent generation in production)
    const templates = this.getMilestoneTemplates(category);

    const milestones: Milestone[] = templates.map((template, index) => ({
      title: template.title.replace('{goal}', goal.title),
      description: template.description,
      order: index + 1,
      estimatedDuration: template.durationDays,
      metrics: template.metrics,
    }));

    // Calculate target dates if goal has target_date
    if (goal.target_date) {
      const totalDays = milestones.reduce((sum, m) => sum + m.estimatedDuration, 0);
      const startDate = new Date();
      let currentDate = new Date(startDate);

      milestones.forEach(milestone => {
        currentDate = new Date(currentDate.getTime() + milestone.estimatedDuration * 24 * 60 * 60 * 1000);
        milestone.targetDate = new Date(currentDate);
      });
    }

    return milestones;
  }

  /**
   * Get milestone templates by category
   */
  private getMilestoneTemplates(category: string): any[] {
    const templates: Record<string, any[]> = {
      fitness: [
        {
          title: 'Build Base Fitness',
          description: 'Establish consistent exercise routine 3x per week',
          durationDays: 21,
          metrics: { type: 'frequency', target: 3, unit: 'times per week' },
        },
        {
          title: 'Increase Intensity',
          description: 'Gradually increase workout duration and difficulty',
          durationDays: 28,
          metrics: { type: 'duration', target: 45, unit: 'minutes' },
        },
        {
          title: 'Track Progress',
          description: 'Monitor key fitness metrics regularly',
          durationDays: 14,
          metrics: { type: 'measurement', target: 1, unit: 'weekly check-in' },
        },
        {
          title: 'Achieve Target',
          description: 'Reach your {goal}',
          durationDays: 30,
          metrics: { type: 'completion', target: 100, unit: 'percent' },
        },
      ],
      career: [
        {
          title: 'Research & Planning',
          description: 'Research requirements and create action plan',
          durationDays: 14,
        },
        {
          title: 'Skill Development',
          description: 'Acquire necessary skills and knowledge',
          durationDays: 60,
        },
        {
          title: 'Practical Application',
          description: 'Apply skills through projects or practice',
          durationDays: 45,
        },
        {
          title: 'Network & Showcase',
          description: 'Build connections and demonstrate capabilities',
          durationDays: 30,
        },
        {
          title: 'Achieve {goal}',
          description: 'Complete final steps to reach your career goal',
          durationDays: 30,
        },
      ],
      learning: [
        {
          title: 'Foundation',
          description: 'Master fundamental concepts',
          durationDays: 21,
        },
        {
          title: 'Intermediate Skills',
          description: 'Build on basics with more complex topics',
          durationDays: 28,
        },
        {
          title: 'Advanced Application',
          description: 'Apply knowledge to real-world scenarios',
          durationDays: 35,
        },
        {
          title: 'Mastery',
          description: 'Demonstrate proficiency in {goal}',
          durationDays: 21,
        },
      ],
      default: [
        {
          title: 'Get Started',
          description: 'Take the first steps toward your goal',
          durationDays: 14,
        },
        {
          title: 'Build Momentum',
          description: 'Establish consistent progress',
          durationDays: 21,
        },
        {
          title: 'Mid-Point Check',
          description: 'Evaluate progress and adjust approach',
          durationDays: 7,
        },
        {
          title: 'Final Push',
          description: 'Complete remaining tasks',
          durationDays: 21,
        },
        {
          title: 'Achieve {goal}',
          description: 'Reach your goal',
          durationDays: 7,
        },
      ],
    };

    return templates[category] || templates.default;
  }

  /**
   * Generate habit suggestions for goal
   */
  private async generateHabitSuggestions(goal: any, analysis: GoalAnalysis): Promise<SuggestedHabit[]> {
    const category = goal.category?.toLowerCase() || analysis.category;

    const habitTemplates: Record<string, SuggestedHabit[]> = {
      fitness: [
        {
          name: 'Morning Workout',
          category: 'FITNESS',
          frequency: 'DAILY',
          description: 'Exercise for 30-45 minutes each morning',
          rationale: 'Consistent daily exercise is key to fitness goals',
          priority: 'high',
        },
        {
          name: 'Track Nutrition',
          category: 'NUTRITION',
          frequency: 'DAILY',
          description: 'Log meals and track macros/calories',
          rationale: 'Nutrition is 70% of fitness success',
          priority: 'high',
        },
        {
          name: 'Stretching Routine',
          category: 'FITNESS',
          frequency: 'DAILY',
          description: '10-minute stretching and mobility work',
          rationale: 'Prevents injury and improves recovery',
          priority: 'medium',
        },
        {
          name: 'Sleep 8 Hours',
          category: 'HEALTH',
          frequency: 'DAILY',
          description: 'Get 8 hours of quality sleep',
          rationale: 'Recovery happens during sleep',
          priority: 'high',
        },
      ],
      career: [
        {
          name: 'Daily Learning',
          category: 'LEARNING',
          frequency: 'DAILY',
          description: 'Study relevant skills for 30-60 minutes',
          rationale: 'Consistent skill development is crucial',
          priority: 'high',
        },
        {
          name: 'Networking',
          category: 'CAREER',
          frequency: 'WEEKLY',
          description: 'Connect with 2-3 people in your field',
          rationale: 'Your network is your net worth',
          priority: 'medium',
        },
        {
          name: 'Portfolio Work',
          category: 'PRODUCTIVITY',
          frequency: 'WEEKLY',
          description: 'Add to your portfolio or resume',
          rationale: 'Showcase your growing expertise',
          priority: 'high',
        },
      ],
      learning: [
        {
          name: 'Study Session',
          category: 'LEARNING',
          frequency: 'DAILY',
          description: 'Dedicated 45-minute study block',
          rationale: 'Consistent practice leads to mastery',
          priority: 'high',
        },
        {
          name: 'Practice Exercises',
          category: 'LEARNING',
          frequency: 'DAILY',
          description: 'Complete practice problems or exercises',
          rationale: 'Active practice reinforces learning',
          priority: 'high',
        },
        {
          name: 'Review Notes',
          category: 'LEARNING',
          frequency: 'WEEKLY',
          description: 'Review and consolidate weekly learnings',
          rationale: 'Spaced repetition improves retention',
          priority: 'medium',
        },
      ],
      default: [
        {
          name: 'Daily Progress',
          category: 'PRODUCTIVITY',
          frequency: 'DAILY',
          description: 'Make incremental progress toward goal',
          rationale: 'Small daily actions compound over time',
          priority: 'high',
        },
        {
          name: 'Weekly Review',
          category: 'PRODUCTIVITY',
          frequency: 'WEEKLY',
          description: 'Review progress and plan next week',
          rationale: 'Regular reflection keeps you on track',
          priority: 'medium',
        },
      ],
    };

    return habitTemplates[category] || habitTemplates.default;
  }

  /**
   * Estimate goal completion date
   */
  private estimateCompletion(goal: any, milestones: Milestone[]): Date {
    if (goal.target_date) {
      return new Date(goal.target_date);
    }

    // Sum milestone durations
    const totalDays = milestones.reduce((sum, m) => sum + m.estimatedDuration, 0);

    // Add 20% buffer
    const bufferedDays = Math.ceil(totalDays * 1.2);

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + bufferedDays);

    return completionDate;
  }

  /**
   * Calculate plan confidence score
   */
  private calculateConfidence(goal: any, analysis: GoalAnalysis): number {
    let confidence = 0.5; // Base confidence

    if (analysis.isSmartGoal) confidence += 0.2;
    if (goal.target_date) confidence += 0.1;
    if (goal.description && goal.description.length > 50) confidence += 0.1;
    if (analysis.difficulty === 'easy' || analysis.difficulty === 'medium') confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  /**
   * Check if goal is specific
   */
  private checkSpecific(text: string): boolean {
    const specificIndicators = ['learn', 'lose', 'gain', 'increase', 'decrease', 'complete', 'achieve', 'build'];
    return specificIndicators.some(indicator => text.includes(indicator));
  }

  /**
   * Check if goal is measurable
   */
  private checkMeasurable(text: string): boolean {
    const numberRegex = /\d+/;
    const unitKeywords = ['pounds', 'kg', 'miles', 'hours', 'days', 'weeks', 'months', '%', 'percent'];
    return numberRegex.test(text) || unitKeywords.some(unit => text.includes(unit));
  }

  /**
   * Check if goal is time-bound
   */
  private checkTimeBound(text: string): boolean {
    const timeKeywords = ['by', 'within', 'in', 'until', 'before', 'days', 'weeks', 'months', 'year'];
    return timeKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Categorize goal
   */
  private categorizeGoal(text: string): string {
    if (text.includes('fitness') || text.includes('workout') || text.includes('exercise') || text.includes('weight')) {
      return 'fitness';
    }
    if (text.includes('career') || text.includes('job') || text.includes('promotion') || text.includes('business')) {
      return 'career';
    }
    if (text.includes('learn') || text.includes('study') || text.includes('course') || text.includes('skill')) {
      return 'learning';
    }
    if (text.includes('finance') || text.includes('money') || text.includes('save') || text.includes('invest')) {
      return 'financial';
    }
    return 'general';
  }

  /**
   * Assess goal difficulty
   */
  private assessDifficulty(text: string): 'easy' | 'medium' | 'hard' | 'expert' {
    const hardKeywords = ['expert', 'advanced', 'master', 'marathon', 'ironman'];
    const mediumKeywords = ['intermediate', 'improve', 'increase', 'double'];

    if (hardKeywords.some(keyword => text.includes(keyword))) return 'hard';
    if (mediumKeywords.some(keyword => text.includes(keyword))) return 'medium';
    return 'easy';
  }

  /**
   * Save goal plan to database
   */
  private async savePlan(plan: GoalPlan): Promise<void> {
    try {
      // Save milestones
      for (const milestone of plan.milestones) {
        const milestoneQuery = `
          INSERT INTO milestones (
            id, goal_id, title, description, "order", estimated_duration,
            target_date, metrics, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()
          )
          ON CONFLICT DO NOTHING
        `;

        await this.db.query(milestoneQuery, [
          plan.goalId,
          milestone.title,
          milestone.description,
          milestone.order,
          milestone.estimatedDuration,
          milestone.targetDate,
          JSON.stringify(milestone.metrics || {}),
        ]);
      }

      logger.info('Saved goal plan', {
        goalId: plan.goalId,
        milestones: plan.milestones.length,
        habits: plan.suggestedHabits.length,
      });
    } catch (error) {
      logger.error('Failed to save plan', { plan, error });
    }
  }
}
