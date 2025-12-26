/**
 * Goal Template Service
 * Phase 11 Week 2
 *
 * Manages goal templates and customization for users
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface GoalTemplate {
  id: string;
  category: string;
  goalName: string;
  duration: number;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  habits: HabitTemplate[];
  milestones: Milestone[];
  tags: string[];
}

export interface HabitTemplate {
  name: string;
  frequency: string;
  priority: number;
  difficulty: number;
  estimatedTimeMinutes: number;
  startDay?: number;
}

export interface Milestone {
  day: number;
  target: string;
  reward: string;
}

export class GoalTemplateService {
  private templatesPath: string;
  private templates: GoalTemplate[] = [];

  constructor() {
    this.templatesPath = path.join(__dirname, '../../../../../data/templates/goal_templates.json');
  }

  /**
   * Load all goal templates
   */
  async loadTemplates(): Promise<GoalTemplate[]> {
    try {
      const data = await fs.readFile(this.templatesPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.templates = parsed.templates || [];
      return this.templates;
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<GoalTemplate[]> {
    if (this.templates.length === 0) {
      await this.loadTemplates();
    }

    return this.templates.filter(t => t.category === category);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<GoalTemplate | null> {
    if (this.templates.length === 0) {
      await this.loadTemplates();
    }

    return this.templates.find(t => t.id === id) || null;
  }

  /**
   * Search templates by tags or name
   */
  async searchTemplates(query: string): Promise<GoalTemplate[]> {
    if (this.templates.length === 0) {
      await this.loadTemplates();
    }

    const lowerQuery = query.toLowerCase();

    return this.templates.filter(t =>
      t.goalName.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get recommended templates for user
   */
  async getRecommendedTemplates(userProfile: any): Promise<GoalTemplate[]> {
    if (this.templates.length === 0) {
      await this.loadTemplates();
    }

    // Score templates based on user profile
    const scored = this.templates.map(template => ({
      template,
      score: this.scoreTemplateForUser(template, userProfile)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.template);
  }

  /**
   * Score template relevance for user
   */
  private scoreTemplateForUser(template: GoalTemplate, userProfile: any): number {
    let score = 50; // Base score

    // Match user's interests/categories
    if (userProfile.interests?.includes(template.category)) {
      score += 30;
    }

    // Match difficulty level with user experience
    if (userProfile.experienceLevel === template.difficulty) {
      score += 20;
    } else if (
      (userProfile.experienceLevel === 'beginner' && template.difficulty === 'intermediate') ||
      (userProfile.experienceLevel === 'intermediate' && template.difficulty === 'advanced')
    ) {
      score += 10; // Slightly challenging is good
    }

    // Prefer shorter duration for beginners
    if (userProfile.experienceLevel === 'beginner' && template.duration <= 30) {
      score += 15;
    }

    // Match with user's available time
    const totalTimePerWeek = template.habits.reduce((sum, h) =>
      sum + (h.estimatedTimeMinutes * this.frequencyToWeeklyCount(h.frequency)), 0
    );

    if (totalTimePerWeek <= (userProfile.availableTimePerWeek || 300)) {
      score += 10;
    }

    return score;
  }

  /**
   * Convert frequency string to weekly count
   */
  private frequencyToWeeklyCount(frequency: string): number {
    if (frequency === 'daily') return 7;
    if (frequency === '5x_per_week') return 5;
    if (frequency === '3x_per_week') return 3;
    if (frequency === 'weekly') return 1;
    return 7;
  }

  /**
   * Customize template for user
   */
  async customizeTemplate(
    templateId: string,
    customizations: {
      duration?: number;
      habitModifications?: { habitName: string; newFrequency?: string; newDuration?: number }[];
      addHabits?: HabitTemplate[];
      removeHabits?: string[];
    }
  ): Promise<GoalTemplate | null> {
    const template = await this.getTemplateById(templateId);

    if (!template) return null;

    // Create customized copy
    const customized = JSON.parse(JSON.stringify(template));

    // Apply duration change
    if (customizations.duration) {
      customized.duration = customizations.duration;

      // Adjust milestones proportionally
      const ratio = customizations.duration / template.duration;
      customized.milestones = customized.milestones.map((m: Milestone) => ({
        ...m,
        day: Math.round(m.day * ratio)
      }));
    }

    // Modify existing habits
    if (customizations.habitModifications) {
      customizations.habitModifications.forEach(mod => {
        const habit = customized.habits.find((h: HabitTemplate) => h.name === mod.habitName);
        if (habit) {
          if (mod.newFrequency) habit.frequency = mod.newFrequency;
          if (mod.newDuration) habit.estimatedTimeMinutes = mod.newDuration;
        }
      });
    }

    // Add new habits
    if (customizations.addHabits) {
      customized.habits.push(...customizations.addHabits);
    }

    // Remove habits
    if (customizations.removeHabits) {
      customized.habits = customized.habits.filter(
        (h: HabitTemplate) => !customizations.removeHabits!.includes(h.name)
      );
    }

    return customized;
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    if (this.templates.length === 0) {
      await this.loadTemplates();
    }

    return Array.from(new Set(this.templates.map(t => t.category)));
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(templateId: string): Promise<any> {
    // Mock implementation - would query actual user data
    return {
      totalAdoptions: Math.floor(Math.random() * 1000) + 100,
      averageCompletionRate: 0.65 + Math.random() * 0.25,
      averageSuccessRate: 0.60 + Math.random() * 0.25,
      userRating: 4.0 + Math.random() * 1.0
    };
  }
}
