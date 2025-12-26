/**
 * Schedule Optimizer
 * Phase 11 Week 3
 *
 * Automatic habit scheduling based on historical patterns,
 * calendar integration, energy levels, and conflict detection
 */

import { TimingRecommendation } from './OptimalTimingAnalyzer';

export interface ScheduleOptimization {
  userId: string;
  optimizedSchedule: HabitScheduleSlot[];
  conflicts: ScheduleConflict[];
  stackingOpportunities: HabitStackingSuggestion[];
  loadBalanceScore: number; // 0-100
}

export interface HabitScheduleSlot {
  habitId: string;
  habitName: string;
  dayOfWeek: number;
  startTime: { hour: number; minute: number };
  duration: number; // minutes
  priority: number;
  energyLevel: 'high' | 'medium' | 'low';
}

export interface ScheduleConflict {
  habitId1: string;
  habitId2: string;
  conflictType: 'time_overlap' | 'energy_depletion' | 'too_many_habits';
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface HabitStackingSuggestion {
  anchorHabit: string;
  newHabit: string;
  position: 'before' | 'after';
  reasoning: string;
  expectedSuccessBoost: number; // percentage
}

export class ScheduleOptimizer {
  /**
   * Generate optimized schedule for user's habits
   */
  async optimizeSchedule(userId: string): Promise<ScheduleOptimization> {
    const habits = await this.getUserHabits(userId);
    const timingRecommendations = await this.getTimingRecommendations(userId);
    const calendarEvents = await this.getCalendarEvents(userId);
    const energyProfile = await this.predictEnergyLevels(userId);

    // Create initial schedule from timing recommendations
    const schedule = this.createInitialSchedule(habits, timingRecommendations);

    // Detect conflicts
    const conflicts = this.detectConflicts(schedule, calendarEvents, energyProfile);

    // Resolve conflicts
    const optimizedSchedule = this.resolveConflicts(schedule, conflicts, energyProfile);

    // Find stacking opportunities
    const stackingOpportunities = this.findStackingOpportunities(optimizedSchedule, habits);

    // Calculate load balance
    const loadBalanceScore = this.calculateLoadBalance(optimizedSchedule);

    return {
      userId,
      optimizedSchedule,
      conflicts,
      stackingOpportunities,
      loadBalanceScore
    };
  }

  /**
   * Suggest optimal habit stacking opportunities
   */
  async suggestHabitStacking(
    userId: string,
    newHabitId: string
  ): Promise<HabitStackingSuggestion[]> {
    const existingHabits = await this.getUserHabits(userId);
    const newHabit = existingHabits.find(h => h.id === newHabitId);

    if (!newHabit) return [];

    const suggestions: HabitStackingSuggestion[] = [];

    for (const anchorHabit of existingHabits) {
      if (anchorHabit.id === newHabitId) continue;

      // Check if habits are compatible for stacking
      const compatibility = this.calculateStackingCompatibility(
        anchorHabit,
        newHabit
      );

      if (compatibility.score > 60) {
        suggestions.push({
          anchorHabit: anchorHabit.name,
          newHabit: newHabit.name,
          position: compatibility.position,
          reasoning: compatibility.reasoning,
          expectedSuccessBoost: compatibility.score
        });
      }
    }

    return suggestions.sort((a, b) => b.expectedSuccessBoost - a.expectedSuccessBoost);
  }

  /**
   * Balance habit load across week
   */
  async balanceWeeklyLoad(userId: string): Promise<Map<number, number>> {
    const schedule = await this.optimizeSchedule(userId);
    const dailyLoad = new Map<number, number>();

    // Initialize all days
    for (let day = 0; day < 7; day++) {
      dailyLoad.set(day, 0);
    }

    // Calculate daily time commitment
    schedule.optimizedSchedule.forEach(slot => {
      const current = dailyLoad.get(slot.dayOfWeek) || 0;
      dailyLoad.set(slot.dayOfWeek, current + slot.duration);
    });

    return dailyLoad;
  }

  /**
   * Create initial schedule from timing recommendations
   */
  private createInitialSchedule(
    habits: any[],
    timingRecommendations: TimingRecommendation[]
  ): HabitScheduleSlot[] {
    return habits.map(habit => {
      const recommendation = timingRecommendations.find(r => r.habitId === habit.id);

      return {
        habitId: habit.id,
        habitName: habit.name,
        dayOfWeek: recommendation?.recommendedTime.dayOfWeek || 1,
        startTime: {
          hour: recommendation?.recommendedTime.hour || 9,
          minute: recommendation?.recommendedTime.minute || 0
        },
        duration: habit.estimatedTimeMinutes || 20,
        priority: habit.priority || 5,
        energyLevel: this.determineEnergyRequirement(habit)
      };
    });
  }

  /**
   * Detect scheduling conflicts
   */
  private detectConflicts(
    schedule: HabitScheduleSlot[],
    calendarEvents: any[],
    energyProfile: Map<number, number>
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // Check for time overlaps
    for (let i = 0; i < schedule.length; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        const slot1 = schedule[i];
        const slot2 = schedule[j];

        if (this.hasTimeOverlap(slot1, slot2)) {
          conflicts.push({
            habitId1: slot1.habitId,
            habitId2: slot2.habitId,
            conflictType: 'time_overlap',
            severity: 'high',
            recommendation: `Reschedule ${slot2.habitName} to avoid overlap with ${slot1.habitName}`
          });
        }
      }
    }

    // Check for energy depletion
    const habitsByTime = schedule.sort((a, b) =>
      (a.startTime.hour * 60 + a.startTime.minute) -
      (b.startTime.hour * 60 + b.startTime.minute)
    );

    let cumulativeEnergyDrain = 0;
    habitsByTime.forEach((slot, index) => {
      const energyCost = this.calculateEnergyCost(slot);
      cumulativeEnergyDrain += energyCost;

      if (cumulativeEnergyDrain > 80 && index < habitsByTime.length - 1) {
        conflicts.push({
          habitId1: slot.habitId,
          habitId2: habitsByTime[index + 1].habitId,
          conflictType: 'energy_depletion',
          severity: 'medium',
          recommendation: `Space out high-energy habits to prevent burnout`
        });
      }
    });

    // Check for too many habits per day
    const habitsPerDay = new Map<number, number>();
    schedule.forEach(slot => {
      habitsPerDay.set(slot.dayOfWeek, (habitsPerDay.get(slot.dayOfWeek) || 0) + 1);
    });

    habitsPerDay.forEach((count, day) => {
      if (count > 5) {
        conflicts.push({
          habitId1: 'multiple',
          habitId2: 'multiple',
          conflictType: 'too_many_habits',
          severity: 'medium',
          recommendation: `${count} habits scheduled for day ${day}. Consider spreading across the week.`
        });
      }
    });

    return conflicts;
  }

  /**
   * Resolve scheduling conflicts
   */
  private resolveConflicts(
    schedule: HabitScheduleSlot[],
    conflicts: ScheduleConflict[],
    energyProfile: Map<number, number>
  ): HabitScheduleSlot[] {
    const optimized = [...schedule];

    conflicts.forEach(conflict => {
      if (conflict.conflictType === 'time_overlap') {
        // Shift lower priority habit by 1 hour
        const slot1 = optimized.find(s => s.habitId === conflict.habitId1);
        const slot2 = optimized.find(s => s.habitId === conflict.habitId2);

        if (slot1 && slot2) {
          const lowerPrioritySlot = slot1.priority < slot2.priority ? slot1 : slot2;
          lowerPrioritySlot.startTime.hour = (lowerPrioritySlot.startTime.hour + 1) % 24;
        }
      }

      if (conflict.conflictType === 'energy_depletion') {
        // Move high-energy habits to morning
        const slot = optimized.find(s => s.habitId === conflict.habitId2);
        if (slot && slot.energyLevel === 'high') {
          slot.startTime.hour = 7;
        }
      }
    });

    return optimized;
  }

  /**
   * Find habit stacking opportunities
   */
  private findStackingOpportunities(
    schedule: HabitScheduleSlot[],
    habits: any[]
  ): HabitStackingSuggestion[] {
    const suggestions: HabitStackingSuggestion[] = [];

    // Look for habits that could be stacked
    schedule.forEach(slot => {
      const compatibleHabits = habits.filter(h =>
        h.id !== slot.habitId &&
        this.canStack(slot, h)
      );

      compatibleHabits.forEach(habit => {
        suggestions.push({
          anchorHabit: slot.habitName,
          newHabit: habit.name,
          position: 'after',
          reasoning: `Stack "${habit.name}" after "${slot.habitName}" for ${habit.estimatedTimeMinutes || 10} minutes`,
          expectedSuccessBoost: 35
        });
      });
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Calculate load balance score
   */
  private calculateLoadBalance(schedule: HabitScheduleSlot[]): number {
    const dailyMinutes = new Map<number, number>();

    for (let day = 0; day < 7; day++) {
      dailyMinutes.set(day, 0);
    }

    schedule.forEach(slot => {
      const current = dailyMinutes.get(slot.dayOfWeek) || 0;
      dailyMinutes.set(slot.dayOfWeek, current + slot.duration);
    });

    const values = Array.from(dailyMinutes.values());
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = better balance
    const maxStdDev = 60; // minutes
    const balanceScore = Math.max(0, 100 - (stdDev / maxStdDev) * 100);

    return Math.round(balanceScore);
  }

  /**
   * Check if two habits have time overlap
   */
  private hasTimeOverlap(slot1: HabitScheduleSlot, slot2: HabitScheduleSlot): boolean {
    if (slot1.dayOfWeek !== slot2.dayOfWeek) return false;

    const start1 = slot1.startTime.hour * 60 + slot1.startTime.minute;
    const end1 = start1 + slot1.duration;

    const start2 = slot2.startTime.hour * 60 + slot2.startTime.minute;
    const end2 = start2 + slot2.duration;

    return (start1 < end2 && end1 > start2);
  }

  /**
   * Calculate energy cost of a habit
   */
  private calculateEnergyCost(slot: HabitScheduleSlot): number {
    const energyLevelCost = {
      high: 30,
      medium: 15,
      low: 5
    };

    return energyLevelCost[slot.energyLevel] || 15;
  }

  /**
   * Determine energy requirement for habit
   */
  private determineEnergyRequirement(habit: any): 'high' | 'medium' | 'low' {
    const category = habit.category?.toLowerCase() || '';

    if (category.includes('exercise') || category.includes('workout')) return 'high';
    if (category.includes('meditation') || category.includes('reading')) return 'low';
    return 'medium';
  }

  /**
   * Calculate stacking compatibility
   */
  private calculateStackingCompatibility(
    anchorHabit: any,
    newHabit: any
  ): { score: number; position: 'before' | 'after'; reasoning: string } {
    let score = 50;
    let position: 'before' | 'after' = 'after';
    let reasoning = '';

    // Similar categories stack well
    if (anchorHabit.category === newHabit.category) {
      score += 20;
      reasoning = 'Same category makes stacking natural';
    }

    // Short duration habits stack better
    if (newHabit.estimatedTimeMinutes <= 10) {
      score += 15;
      reasoning += '. Quick habit easy to add';
    }

    return { score, position, reasoning };
  }

  /**
   * Check if habit can be stacked
   */
  private canStack(slot: HabitScheduleSlot, habit: any): boolean {
    return habit.estimatedTimeMinutes <= 15 && slot.duration < 45;
  }

  /**
   * Get timing recommendations (mock)
   */
  private async getTimingRecommendations(userId: string): Promise<TimingRecommendation[]> {
    return [];
  }

  /**
   * Get calendar events (mock)
   */
  private async getCalendarEvents(userId: string): Promise<any[]> {
    return [];
  }

  /**
   * Predict energy levels throughout day (mock)
   */
  private async predictEnergyLevels(userId: string): Promise<Map<number, number>> {
    const energyMap = new Map<number, number>();
    // Morning: high, afternoon: medium, evening: low
    for (let hour = 0; hour < 24; hour++) {
      if (hour >= 6 && hour < 12) energyMap.set(hour, 80);
      else if (hour >= 12 && hour < 18) energyMap.set(hour, 60);
      else energyMap.set(hour, 40);
    }
    return energyMap;
  }

  /**
   * Get user habits (mock)
   */
  private async getUserHabits(userId: string): Promise<any[]> {
    return [
      { id: '1', name: 'Exercise', category: 'fitness', estimatedTimeMinutes: 30, priority: 8 },
      { id: '2', name: 'Meditation', category: 'wellness', estimatedTimeMinutes: 15, priority: 7 },
      { id: '3', name: 'Reading', category: 'education', estimatedTimeMinutes: 20, priority: 5 }
    ];
  }
}
