/**
 * Optimal Timing Analyzer
 * Phase 11 Week 3
 *
 * Analyzes user check-in patterns to identify optimal times for habits
 * and provides personalized scheduling recommendations
 */

export interface TimeOfDayPattern {
  hour: number;
  dayOfWeek: number;
  completionRate: number;
  totalCheckIns: number;
}

export interface TimingRecommendation {
  habitId: string;
  habitName: string;
  recommendedTime: {
    hour: number;
    minute: number;
    dayOfWeek?: number;
  };
  confidence: number;
  reasoning: string;
  expectedImprovementPercent: number;
}

export interface CircadianAlignment {
  morningScore: number; // 0-100
  afternoonScore: number;
  eveningScore: number;
  nightScore: number;
  optimalWindow: 'morning' | 'afternoon' | 'evening' | 'night';
}

export class OptimalTimingAnalyzer {
  /**
   * Analyze user's check-in patterns to find optimal habit timing
   */
  async analyzeOptimalTiming(
    userId: string,
    habitId: string
  ): Promise<TimingRecommendation> {
    const checkInData = await this.getCheckInHistory(userId, habitId);
    const timePatterns = this.extractTimePatterns(checkInData);
    const circadianProfile = this.analyzeCircadianAlignment(timePatterns);

    const optimalTime = this.findOptimalTimeSlot(timePatterns, circadianProfile);
    const currentTime = this.getCurrentScheduledTime(habitId);

    const expectedImprovement = this.calculateExpectedImprovement(
      timePatterns,
      currentTime,
      optimalTime
    );

    return {
      habitId,
      habitName: checkInData.habitName,
      recommendedTime: optimalTime,
      confidence: this.calculateConfidence(timePatterns),
      reasoning: this.generateReasoning(timePatterns, circadianProfile, optimalTime),
      expectedImprovementPercent: expectedImprovement
    };
  }

  /**
   * Get optimal timing for all user habits
   */
  async analyzeAllHabits(userId: string): Promise<TimingRecommendation[]> {
    const userHabits = await this.getUserHabits(userId);
    const recommendations: TimingRecommendation[] = [];

    for (const habit of userHabits) {
      const recommendation = await this.analyzeOptimalTiming(userId, habit.id);
      recommendations.push(recommendation);
    }

    return recommendations.sort((a, b) =>
      b.expectedImprovementPercent - a.expectedImprovementPercent
    );
  }

  /**
   * Analyze performance by time of day
   */
  async analyzeTimeOfDayPerformance(
    userId: string
  ): Promise<Map<string, CircadianAlignment>> {
    const allHabits = await this.getUserHabits(userId);
    const performanceMap = new Map<string, CircadianAlignment>();

    for (const habit of allHabits) {
      const checkInData = await this.getCheckInHistory(userId, habit.id);
      const timePatterns = this.extractTimePatterns(checkInData);
      const alignment = this.analyzeCircadianAlignment(timePatterns);

      performanceMap.set(habit.id, alignment);
    }

    return performanceMap;
  }

  /**
   * Analyze day-of-week patterns
   */
  async analyzeDayOfWeekPatterns(
    userId: string,
    habitId: string
  ): Promise<Map<number, number>> {
    const checkInData = await this.getCheckInHistory(userId, habitId);
    const dayPatterns = new Map<number, number>();

    // Initialize all days with 0
    for (let day = 0; day < 7; day++) {
      dayPatterns.set(day, 0);
    }

    // Calculate completion rate per day
    const dayGroups = new Map<number, { completed: number; total: number }>();

    checkInData.checkIns.forEach((checkIn: any) => {
      const date = new Date(checkIn.date);
      const dayOfWeek = date.getDay();

      if (!dayGroups.has(dayOfWeek)) {
        dayGroups.set(dayOfWeek, { completed: 0, total: 0 });
      }

      const group = dayGroups.get(dayOfWeek)!;
      group.total++;
      if (checkIn.completed) group.completed++;
    });

    // Calculate completion rates
    dayGroups.forEach((group, day) => {
      const rate = group.total > 0 ? (group.completed / group.total) * 100 : 0;
      dayPatterns.set(day, Math.round(rate));
    });

    return dayPatterns;
  }

  /**
   * Extract time-of-day patterns from check-in data
   */
  private extractTimePatterns(checkInData: any): TimeOfDayPattern[] {
    const patterns: Map<string, TimeOfDayPattern> = new Map();

    checkInData.checkIns.forEach((checkIn: any) => {
      if (!checkIn.completed) return;

      const date = new Date(checkIn.date);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${hour}-${dayOfWeek}`;

      if (!patterns.has(key)) {
        patterns.set(key, {
          hour,
          dayOfWeek,
          completionRate: 0,
          totalCheckIns: 0
        });
      }

      const pattern = patterns.get(key)!;
      pattern.totalCheckIns++;
    });

    // Calculate completion rates
    const totalBySlot = new Map<string, number>();
    checkInData.checkIns.forEach((checkIn: any) => {
      const date = new Date(checkIn.date);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${hour}-${dayOfWeek}`;
      totalBySlot.set(key, (totalBySlot.get(key) || 0) + 1);
    });

    patterns.forEach((pattern, key) => {
      const total = totalBySlot.get(key) || pattern.totalCheckIns;
      pattern.completionRate = (pattern.totalCheckIns / total) * 100;
    });

    return Array.from(patterns.values());
  }

  /**
   * Analyze circadian rhythm alignment
   */
  private analyzeCircadianAlignment(patterns: TimeOfDayPattern[]): CircadianAlignment {
    const timeSlots = {
      morning: { hours: [6, 7, 8, 9, 10, 11], completions: 0, total: 0 },
      afternoon: { hours: [12, 13, 14, 15, 16, 17], completions: 0, total: 0 },
      evening: { hours: [18, 19, 20, 21], completions: 0, total: 0 },
      night: { hours: [22, 23, 0, 1, 2, 3, 4, 5], completions: 0, total: 0 }
    };

    patterns.forEach(pattern => {
      for (const [slot, config] of Object.entries(timeSlots)) {
        if (config.hours.includes(pattern.hour)) {
          config.completions += pattern.totalCheckIns;
          config.total += pattern.totalCheckIns;
        }
      }
    });

    const scores = {
      morningScore: this.calculateSlotScore(timeSlots.morning),
      afternoonScore: this.calculateSlotScore(timeSlots.afternoon),
      eveningScore: this.calculateSlotScore(timeSlots.evening),
      nightScore: this.calculateSlotScore(timeSlots.night)
    };

    const optimalWindow = (Object.entries(scores)
      .sort(([, a], [, b]) => b - a)[0][0]
      .replace('Score', '') as 'morning' | 'afternoon' | 'evening' | 'night');

    return {
      ...scores,
      optimalWindow
    };
  }

  /**
   * Calculate score for a time slot
   */
  private calculateSlotScore(slot: { completions: number; total: number }): number {
    if (slot.total === 0) return 0;
    return Math.round((slot.completions / slot.total) * 100);
  }

  /**
   * Find optimal time slot based on patterns
   */
  private findOptimalTimeSlot(
    patterns: TimeOfDayPattern[],
    circadianProfile: CircadianAlignment
  ): { hour: number; minute: number; dayOfWeek?: number } {
    if (patterns.length === 0) {
      // Default to optimal circadian window
      const defaultHours = {
        morning: 8,
        afternoon: 14,
        evening: 19,
        night: 22
      };
      return {
        hour: defaultHours[circadianProfile.optimalWindow],
        minute: 0
      };
    }

    // Find time with highest completion rate
    const bestPattern = patterns
      .filter(p => p.totalCheckIns >= 3) // Minimum data points
      .sort((a, b) => b.completionRate - a.completionRate)[0];

    if (bestPattern) {
      return {
        hour: bestPattern.hour,
        minute: 0,
        dayOfWeek: bestPattern.dayOfWeek
      };
    }

    // Fallback to circadian window
    const defaultHours = {
      morning: 8,
      afternoon: 14,
      evening: 19,
      night: 22
    };
    return {
      hour: defaultHours[circadianProfile.optimalWindow],
      minute: 0
    };
  }

  /**
   * Calculate confidence in recommendation
   */
  private calculateConfidence(patterns: TimeOfDayPattern[]): number {
    const totalDataPoints = patterns.reduce((sum, p) => sum + p.totalCheckIns, 0);

    if (totalDataPoints < 10) return 30;
    if (totalDataPoints < 30) return 50;
    if (totalDataPoints < 60) return 70;
    if (totalDataPoints < 100) return 85;
    return 95;
  }

  /**
   * Calculate expected improvement percentage
   */
  private calculateExpectedImprovement(
    patterns: TimeOfDayPattern[],
    currentTime: { hour: number },
    optimalTime: { hour: number }
  ): number {
    const currentPattern = patterns.find(p => p.hour === currentTime.hour);
    const optimalPattern = patterns.find(p => p.hour === optimalTime.hour);

    if (!currentPattern || !optimalPattern) return 0;

    const currentRate = currentPattern.completionRate;
    const optimalRate = optimalPattern.completionRate;

    if (currentRate === 0) return 0;

    return Math.round(((optimalRate - currentRate) / currentRate) * 100);
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateReasoning(
    patterns: TimeOfDayPattern[],
    circadianProfile: CircadianAlignment,
    optimalTime: { hour: number; dayOfWeek?: number }
  ): string {
    const timeOfDay = this.getTimeOfDayLabel(optimalTime.hour);
    const windowScore = circadianProfile[`${circadianProfile.optimalWindow}Score` as keyof CircadianAlignment];

    const pattern = patterns.find(p => p.hour === optimalTime.hour);

    if (pattern && pattern.completionRate > 70) {
      return `You complete this habit ${Math.round(pattern.completionRate)}% of the time at ${timeOfDay}. This is your most successful time window.`;
    }

    return `Your ${circadianProfile.optimalWindow} performance (${windowScore}% success rate) suggests ${timeOfDay} would be optimal for this habit.`;
  }

  /**
   * Get time of day label
   */
  private getTimeOfDayLabel(hour: number): string {
    if (hour >= 6 && hour < 12) return `${hour}:00 AM (morning)`;
    if (hour >= 12 && hour < 18) return `${hour === 12 ? 12 : hour - 12}:00 PM (afternoon)`;
    if (hour >= 18 && hour < 22) return `${hour - 12}:00 PM (evening)`;
    return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'AM' : 'PM'} (night)`;
  }

  /**
   * Get current scheduled time for habit (mock)
   */
  private getCurrentScheduledTime(habitId: string): { hour: number } {
    // Mock - in production, retrieve from database
    return { hour: 9 };
  }

  /**
   * Get user habits (mock)
   */
  private async getUserHabits(userId: string): Promise<any[]> {
    // Mock data
    return [
      { id: 'habit1', name: 'Morning Exercise' },
      { id: 'habit2', name: 'Meditation' },
      { id: 'habit3', name: 'Reading' }
    ];
  }

  /**
   * Get check-in history (mock)
   */
  private async getCheckInHistory(userId: string, habitId: string): Promise<any> {
    // Mock data - in production, query from database
    const checkIns = [];
    const now = new Date();

    for (let i = 0; i < 60; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Simulate patterns: better completion in mornings
      const hour = Math.floor(Math.random() * 24);
      const completed = hour >= 6 && hour <= 10 ? Math.random() > 0.3 : Math.random() > 0.6;

      checkIns.push({
        date: date.toISOString(),
        completed
      });
    }

    return {
      habitName: 'Morning Exercise',
      checkIns
    };
  }
}
