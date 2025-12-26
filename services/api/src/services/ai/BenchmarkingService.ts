/**
 * Benchmarking Service
 * Phase 11 Week 3
 *
 * Compare user progress against anonymized cohorts with
 * privacy-preserving aggregations and motivational insights
 */

export interface BenchmarkComparison {
  userId: string;
  metric: 'streak_length' | 'completion_rate' | 'consistency_score' | 'habit_count';
  userValue: number;
  cohortStats: {
    mean: number;
    median: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
  };
  percentileRank: number; // 0-100
  category?: string;
  insight: string;
  badge?: string;
}

export interface CohortDefinition {
  cohortId: string;
  name: string;
  filters: {
    ageRange?: string;
    fitnessLevel?: string;
    goal?: string;
    category?: string;
  };
  memberCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  value: number;
  badge?: string;
  isCurrentUser: boolean;
}

export class BenchmarkingService {
  private readonly MIN_COHORT_SIZE = 50; // K-anonymity guarantee

  /**
   * Get comprehensive benchmark comparison for user
   */
  async getUserBenchmarks(userId: string): Promise<BenchmarkComparison[]> {
    const userData = await this.getUserData(userId);
    const cohorts = await this.findMatchingCohorts(userId);

    const benchmarks: BenchmarkComparison[] = [];

    // Benchmark streak length
    benchmarks.push(await this.benchmarkMetric(
      userId,
      'streak_length',
      userData.longestStreak,
      cohorts,
      userData.category
    ));

    // Benchmark completion rate
    benchmarks.push(await this.benchmarkMetric(
      userId,
      'completion_rate',
      userData.completionRate,
      cohorts,
      userData.category
    ));

    // Benchmark consistency score
    benchmarks.push(await this.benchmarkMetric(
      userId,
      'consistency_score',
      userData.consistencyScore,
      cohorts,
      userData.category
    ));

    // Benchmark habit count
    benchmarks.push(await this.benchmarkMetric(
      userId,
      'habit_count',
      userData.activeHabits,
      cohorts,
      userData.category
    ));

    return benchmarks;
  }

  /**
   * Get category-specific benchmarks
   */
  async getCategoryBenchmarks(
    userId: string,
    category: string
  ): Promise<BenchmarkComparison[]> {
    const userData = await this.getUserData(userId);
    const cohort = await this.getCohortByCategory(category);

    const benchmarks: BenchmarkComparison[] = [];

    benchmarks.push(await this.benchmarkMetric(
      userId,
      'completion_rate',
      userData.categoryStats[category]?.completionRate || 0,
      [cohort],
      category
    ));

    benchmarks.push(await this.benchmarkMetric(
      userId,
      'streak_length',
      userData.categoryStats[category]?.longestStreak || 0,
      [cohort],
      category
    ));

    return benchmarks;
  }

  /**
   * Get leaderboard (opt-in only)
   */
  async getLeaderboard(
    category: string,
    metric: 'streak_length' | 'completion_rate',
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    // Only users who opted in to leaderboards
    const optedInUsers = await this.getOptedInUsers(category);

    if (optedInUsers.length < this.MIN_COHORT_SIZE) {
      throw new Error('Insufficient participants for leaderboard');
    }

    const leaderboard = optedInUsers
      .map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        displayName: user.displayName,
        value: user.stats[metric],
        badge: this.assignBadge(index + 1),
        isCurrentUser: false
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    return leaderboard;
  }

  /**
   * Check if user qualifies for achievement badges
   */
  async checkAchievementBadges(userId: string): Promise<string[]> {
    const benchmarks = await this.getUserBenchmarks(userId);
    const badges: string[] = [];

    benchmarks.forEach(benchmark => {
      if (benchmark.percentileRank >= 95) {
        badges.push(`Top 5% - ${this.getMetricLabel(benchmark.metric)}`);
      } else if (benchmark.percentileRank >= 90) {
        badges.push(`Top 10% - ${this.getMetricLabel(benchmark.metric)}`);
      } else if (benchmark.percentileRank >= 75) {
        badges.push(`Top 25% - ${this.getMetricLabel(benchmark.metric)}`);
      }
    });

    return badges;
  }

  /**
   * Benchmark a specific metric
   */
  private async benchmarkMetric(
    userId: string,
    metric: BenchmarkComparison['metric'],
    userValue: number,
    cohorts: CohortDefinition[],
    category?: string
  ): Promise<BenchmarkComparison> {
    // Aggregate cohort statistics
    const cohortStats = await this.aggregateCohortStats(cohorts, metric);

    // Calculate percentile rank
    const percentileRank = this.calculatePercentile(userValue, cohortStats);

    // Generate insight
    const insight = this.generateInsight(metric, userValue, percentileRank, cohortStats);

    // Assign badge if earned
    const badge = this.assignBadge(percentileRank);

    return {
      userId,
      metric,
      userValue,
      cohortStats,
      percentileRank,
      category,
      insight,
      badge
    };
  }

  /**
   * Aggregate statistics across cohorts
   */
  private async aggregateCohortStats(
    cohorts: CohortDefinition[],
    metric: string
  ): Promise<BenchmarkComparison['cohortStats']> {
    // Mock implementation - in production, query anonymized aggregations
    const allValues: number[] = [];

    for (const cohort of cohorts) {
      const cohortData = await this.getCohortData(cohort.cohortId, metric);
      allValues.push(...cohortData);
    }

    if (allValues.length === 0) {
      return {
        mean: 0,
        median: 0,
        p25: 0,
        p75: 0,
        p90: 0,
        p95: 0
      };
    }

    const sorted = allValues.sort((a, b) => a - b);

    return {
      mean: Math.round(allValues.reduce((sum, v) => sum + v, 0) / allValues.length),
      median: this.percentile(sorted, 50),
      p25: this.percentile(sorted, 25),
      p75: this.percentile(sorted, 75),
      p90: this.percentile(sorted, 90),
      p95: this.percentile(sorted, 95)
    };
  }

  /**
   * Calculate percentile rank for user value
   */
  private calculatePercentile(
    userValue: number,
    cohortStats: BenchmarkComparison['cohortStats']
  ): number {
    if (userValue >= cohortStats.p95) return 95 + (userValue - cohortStats.p95) / cohortStats.p95 * 5;
    if (userValue >= cohortStats.p90) return 90 + (userValue - cohortStats.p90) / (cohortStats.p95 - cohortStats.p90) * 5;
    if (userValue >= cohortStats.p75) return 75 + (userValue - cohortStats.p75) / (cohortStats.p90 - cohortStats.p75) * 15;
    if (userValue >= cohortStats.median) return 50 + (userValue - cohortStats.median) / (cohortStats.p75 - cohortStats.median) * 25;
    if (userValue >= cohortStats.p25) return 25 + (userValue - cohortStats.p25) / (cohortStats.median - cohortStats.p25) * 25;

    return userValue / cohortStats.p25 * 25;
  }

  /**
   * Generate motivational insight
   */
  private generateInsight(
    metric: BenchmarkComparison['metric'],
    userValue: number,
    percentileRank: number,
    cohortStats: BenchmarkComparison['cohortStats']
  ): string {
    const metricLabel = this.getMetricLabel(metric);

    if (percentileRank >= 95) {
      return `Exceptional! You're in the top 5% for ${metricLabel}. Keep up the amazing work!`;
    }

    if (percentileRank >= 90) {
      return `Outstanding! You're in the top 10% for ${metricLabel}.`;
    }

    if (percentileRank >= 75) {
      return `Great job! You're in the top 25% for ${metricLabel}.`;
    }

    if (percentileRank >= 50) {
      return `You're above average for ${metricLabel}. ${this.getSuggestion(metric, cohortStats)}`;
    }

    return `You're at ${Math.round(percentileRank)}th percentile for ${metricLabel}. ${this.getSuggestion(metric, cohortStats)}`;
  }

  /**
   * Get improvement suggestion
   */
  private getSuggestion(
    metric: BenchmarkComparison['metric'],
    cohortStats: BenchmarkComparison['cohortStats']
  ): string {
    const targetValue = cohortStats.p75;

    switch (metric) {
      case 'streak_length':
        return `Try to reach a ${targetValue}-day streak to join the top 25%!`;
      case 'completion_rate':
        return `Aim for ${targetValue}% completion rate to reach top quartile.`;
      case 'consistency_score':
        return `Improve consistency to ${targetValue} to match top performers.`;
      case 'habit_count':
        return `Build up to ${targetValue} active habits.`;
      default:
        return '';
    }
  }

  /**
   * Assign badge based on percentile
   */
  private assignBadge(percentileRank: number): string | undefined {
    if (percentileRank >= 95) return '🏆 Elite Performer';
    if (percentileRank >= 90) return '🥇 Top 10%';
    if (percentileRank >= 75) return '🥈 Top 25%';
    if (percentileRank >= 50) return '🥉 Above Average';
    return undefined;
  }

  /**
   * Get metric label
   */
  private getMetricLabel(metric: BenchmarkComparison['metric']): string {
    const labels = {
      streak_length: 'streak length',
      completion_rate: 'completion rate',
      consistency_score: 'consistency',
      habit_count: 'active habits'
    };
    return labels[metric] || metric;
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Find matching cohorts for user
   */
  private async findMatchingCohorts(userId: string): Promise<CohortDefinition[]> {
    const userData = await this.getUserData(userId);

    return [
      {
        cohortId: 'general',
        name: 'All Users',
        filters: {},
        memberCount: 10000
      },
      {
        cohortId: `age_${userData.ageRange}`,
        name: `Age ${userData.ageRange}`,
        filters: { ageRange: userData.ageRange },
        memberCount: 2500
      },
      {
        cohortId: `fitness_${userData.fitnessLevel}`,
        name: `${userData.fitnessLevel} fitness level`,
        filters: { fitnessLevel: userData.fitnessLevel },
        memberCount: 1800
      }
    ];
  }

  /**
   * Get cohort by category
   */
  private async getCohortByCategory(category: string): Promise<CohortDefinition> {
    return {
      cohortId: `category_${category}`,
      name: `${category} habits`,
      filters: { category },
      memberCount: 3000
    };
  }

  /**
   * Get cohort data (mock)
   */
  private async getCohortData(cohortId: string, metric: string): Promise<number[]> {
    // Mock data - in production, query anonymized aggregations
    const data: number[] = [];
    const sampleSize = 100;

    for (let i = 0; i < sampleSize; i++) {
      if (metric === 'streak_length') {
        data.push(Math.floor(Math.random() * 90) + 1);
      } else if (metric === 'completion_rate') {
        data.push(Math.floor(Math.random() * 40) + 60);
      } else if (metric === 'consistency_score') {
        data.push(Math.floor(Math.random() * 50) + 50);
      } else {
        data.push(Math.floor(Math.random() * 10) + 1);
      }
    }

    return data;
  }

  /**
   * Get user data (mock)
   */
  private async getUserData(userId: string): Promise<any> {
    return {
      longestStreak: 45,
      completionRate: 78,
      consistencyScore: 82,
      activeHabits: 5,
      category: 'fitness',
      ageRange: '25-34',
      fitnessLevel: 'intermediate',
      categoryStats: {
        fitness: {
          completionRate: 85,
          longestStreak: 45
        }
      }
    };
  }

  /**
   * Get opted-in users (mock)
   */
  private async getOptedInUsers(category: string): Promise<any[]> {
    const users = [];
    for (let i = 0; i < 100; i++) {
      users.push({
        id: `user_${i}`,
        displayName: `User ${i}`,
        stats: {
          streak_length: Math.floor(Math.random() * 90) + 1,
          completion_rate: Math.floor(Math.random() * 40) + 60
        }
      });
    }
    return users;
  }
}
