import { Goal } from '../../models/Goal';
import { Task } from '../../models/Task';
import { Mood } from '../../models/Mood';
import { UserProfile } from '../../models/UserProfile';
import { ChatMessage } from '../../models/ChatMessage';
import { Op } from 'sequelize';
import { logger } from '../../utils/logger';
import { aiService } from './AIService';
import { userProfilingService } from './UserProfilingService';

export interface Recommendation {
  id: string;
  type: 'habit' | 'goal' | 'task' | 'content' | 'coaching' | 'wellness';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  actionItems: string[];
  expectedOutcome: string;
  confidence: number; // 0-1
  metadata?: any;
}

export interface RecommendationContext {
  userId: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  currentMood?: string;
  energyLevel?: number;
  recentActivity?: any;
  preferences?: any;
}

export class RecommendationEngine {
  private recommendationStrategies: Map<string, (context: any) => Promise<Recommendation[]>>;

  constructor() {
    this.recommendationStrategies = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies() {
    // Habit recommendations
    this.recommendationStrategies.set('habit', async (context) => {
      return this.generateHabitRecommendations(context);
    });

    // Goal recommendations
    this.recommendationStrategies.set('goal', async (context) => {
      return this.generateGoalRecommendations(context);
    });

    // Task recommendations
    this.recommendationStrategies.set('task', async (context) => {
      return this.generateTaskRecommendations(context);
    });

    // Wellness recommendations
    this.recommendationStrategies.set('wellness', async (context) => {
      return this.generateWellnessRecommendations(context);
    });
  }

  async generateRecommendations(
    userId: string,
    types: string[] = ['habit', 'goal', 'task', 'wellness'],
    limit: number = 5
  ): Promise<Recommendation[]> {
    try {
      // Get user profile
      const profile = await userProfilingService.createOrUpdateProfile(userId);
      
      // Build context
      const context = await this.buildRecommendationContext(userId, profile);
      
      // Generate recommendations from each type
      const allRecommendations: Recommendation[] = [];
      
      for (const type of types) {
        const strategy = this.recommendationStrategies.get(type);
        if (strategy) {
          const recommendations = await strategy(context);
          allRecommendations.push(...recommendations);
        }
      }

      // Sort by priority and confidence
      const sortedRecommendations = allRecommendations.sort((a, b) => {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        const aScore = priorityScore[a.priority] * a.confidence;
        const bScore = priorityScore[b.priority] * b.confidence;
        return bScore - aScore;
      });

      // Apply personalization
      const personalizedRecommendations = await this.personalizeRecommendations(
        sortedRecommendations,
        context
      );

      return personalizedRecommendations.slice(0, limit);
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      return [];
    }
  }

  private async buildRecommendationContext(
    userId: string,
    profile: UserProfile
  ): Promise<RecommendationContext> {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour < 6) timeOfDay = 'night';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    else if (hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Get recent mood
    const recentMood = await Mood.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    // Get recent activity
    const recentTasks = await Task.findAll({
      where: {
        userId,
        updatedAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      limit: 10,
      order: [['updatedAt', 'DESC']]
    });

    return {
      userId,
      timeOfDay,
      dayOfWeek: now.getDay(),
      currentMood: recentMood?.mood,
      energyLevel: recentMood?.energyLevel,
      recentActivity: {
        tasks: recentTasks,
        profile
      },
      preferences: profile.coachingPreferences
    };
  }

  private async generateHabitRecommendations(context: any): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const { profile, tasks } = context.recentActivity;

    // Morning routine recommendation
    if (context.timeOfDay === 'morning' && profile.behaviorPatterns.consistencyScore < 60) {
      recommendations.push({
        id: 'habit-morning-routine',
        type: 'habit',
        title: '5-Minute Morning Routine',
        description: 'Start your day with a simple routine: 2 minutes of stretching, 2 minutes of gratitude journaling, 1 minute of day planning.',
        reason: 'Morning routines significantly improve daily productivity and mood. Your consistency score suggests this could help establish better habits.',
        priority: 'high',
        estimatedTime: 5,
        difficulty: 'easy',
        category: 'wellness',
        actionItems: [
          'Set alarm 5 minutes earlier',
          'Keep journal by bedside',
          'Start with just 3 days this week'
        ],
        expectedOutcome: 'Increased energy and focus throughout the day',
        confidence: 0.85
      });
    }

    // Evening reflection habit
    if (context.timeOfDay === 'evening' && !this.hasRecentReflectionActivity(tasks)) {
      recommendations.push({
        id: 'habit-evening-reflection',
        type: 'habit',
        title: 'Evening Reflection Practice',
        description: 'Spend 3 minutes before bed reflecting on your day: What went well? What could improve? What are you grateful for?',
        reason: 'Evening reflection improves sleep quality and helps process daily experiences for better learning.',
        priority: 'medium',
        estimatedTime: 3,
        difficulty: 'easy',
        category: 'mindfulness',
        actionItems: [
          'Set reminder 30 min before bed',
          'Use voice recording if writing feels hard',
          'Start with just one question'
        ],
        expectedOutcome: 'Better sleep and increased self-awareness',
        confidence: 0.78
      });
    }

    // Hydration habit
    if (profile.coachingPreferences.focusAreas.includes('wellbeing')) {
      recommendations.push({
        id: 'habit-hydration',
        type: 'habit',
        title: 'Hydration Tracking Habit',
        description: 'Track your water intake with a simple method: move a rubber band on your water bottle each time you finish it.',
        reason: 'Proper hydration improves energy, focus, and overall wellbeing - key areas you want to work on.',
        priority: 'medium',
        estimatedTime: 1,
        difficulty: 'easy',
        category: 'health',
        actionItems: [
          'Get a reusable water bottle',
          'Add 4-5 rubber bands',
          'Aim for 8 glasses daily'
        ],
        expectedOutcome: 'Improved energy levels and mental clarity',
        confidence: 0.82
      });
    }

    // Focus session habit
    if (profile.behaviorPatterns.preferredTopics.includes('productivity')) {
      recommendations.push({
        id: 'habit-focus-sessions',
        type: 'habit',
        title: '25-Minute Focus Sessions',
        description: 'Use the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break.',
        reason: 'Your interest in productivity combined with your task patterns suggest this could significantly boost your output.',
        priority: 'high',
        estimatedTime: 30,
        difficulty: 'medium',
        category: 'productivity',
        actionItems: [
          'Choose one important task',
          'Set timer for 25 minutes',
          'Turn off all notifications',
          'Take a real break after'
        ],
        expectedOutcome: 'Complete tasks 40% faster with better quality',
        confidence: 0.88
      });
    }

    return recommendations;
  }

  private async generateGoalRecommendations(context: any): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const profile = context.recentActivity.profile;

    // Get current goals
    const currentGoals = await Goal.findAll({
      where: {
        userId: context.userId,
        status: 'active'
      }
    });

    // Check if user needs more specific goals
    if (currentGoals.length < 3) {
      recommendations.push({
        id: 'goal-quarterly-objective',
        type: 'goal',
        title: 'Set a 90-Day Challenge Goal',
        description: 'Choose one significant area of improvement and commit to a 90-day transformation challenge.',
        reason: 'You have capacity for more goals. 90-day challenges are long enough for real change but short enough to maintain motivation.',
        priority: 'high',
        estimatedTime: 30,
        difficulty: 'medium',
        category: 'personal-growth',
        actionItems: [
          'Identify your biggest pain point',
          'Define what success looks like',
          'Break into monthly milestones',
          'Set weekly check-in reminders'
        ],
        expectedOutcome: 'Significant progress in one key life area',
        confidence: 0.85
      });
    }

    // Learning goal based on growth areas
    if (profile.growthAreas.length > 0) {
      const primaryGrowthArea = profile.growthAreas[0];
      recommendations.push({
        id: `goal-learn-${primaryGrowthArea}`,
        type: 'goal',
        title: `Master ${this.formatGrowthArea(primaryGrowthArea)}`,
        description: `Develop your skills in ${primaryGrowthArea} through structured learning and practice.`,
        reason: `This is identified as your primary growth area. Focusing here will unlock the most potential.`,
        priority: 'high',
        estimatedTime: 60,
        difficulty: 'hard',
        category: 'skill-development',
        actionItems: [
          'Find a course or mentor',
          'Practice 20 minutes daily',
          'Track progress weekly',
          'Apply learning immediately'
        ],
        expectedOutcome: `Noticeable improvement in ${primaryGrowthArea} within 30 days`,
        confidence: 0.79
      });
    }

    // Health goal if low energy
    if (context.energyLevel && context.energyLevel < 5) {
      recommendations.push({
        id: 'goal-energy-optimization',
        type: 'goal',
        title: 'Optimize Your Energy Levels',
        description: 'Implement a comprehensive approach to boost your daily energy through sleep, nutrition, and movement.',
        reason: 'Your current energy levels are below optimal. Improving this will enhance all other areas of your life.',
        priority: 'high',
        estimatedTime: 45,
        difficulty: 'medium',
        category: 'health',
        actionItems: [
          'Track sleep for one week',
          'Add 10-minute walks after meals',
          'Reduce sugar intake by 50%',
          'Create consistent sleep schedule'
        ],
        expectedOutcome: 'Feel 30% more energetic within 2 weeks',
        confidence: 0.87
      });
    }

    return recommendations;
  }

  private async generateTaskRecommendations(context: any): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const { tasks } = context.recentActivity;

    // Quick win tasks
    recommendations.push({
      id: 'task-quick-wins',
      type: 'task',
      title: 'Complete 3 Quick Wins',
      description: 'Identify and complete 3 tasks that take less than 5 minutes each but have been lingering on your list.',
      reason: 'Quick wins build momentum and clear mental clutter. Perfect for your current energy level.',
      priority: 'medium',
      estimatedTime: 15,
      difficulty: 'easy',
      category: 'productivity',
      actionItems: [
        'List all tasks under 5 minutes',
        'Pick the 3 most annoying ones',
        'Do them right now',
        'Celebrate completion'
      ],
      expectedOutcome: 'Instant mood boost and clearer mind',
      confidence: 0.92
    });

    // Weekly planning session
    if (context.dayOfWeek === 0 || context.dayOfWeek === 1) { // Sunday or Monday
      recommendations.push({
        id: 'task-weekly-planning',
        type: 'task',
        title: 'Weekly Planning Session',
        description: 'Spend 20 minutes planning your week: review last week, set priorities, and schedule important tasks.',
        reason: 'It\'s the perfect time to set up your week for success. Planning reduces stress and increases achievement.',
        priority: 'high',
        estimatedTime: 20,
        difficulty: 'medium',
        category: 'planning',
        actionItems: [
          'Review last week\'s progress',
          'Identify top 3 priorities',
          'Block time for deep work',
          'Schedule self-care activities'
        ],
        expectedOutcome: '40% more productive week ahead',
        confidence: 0.89
      });
    }

    // Task batching recommendation
    if (this.hasFragmentedTasks(tasks)) {
      recommendations.push({
        id: 'task-batching',
        type: 'task',
        title: 'Batch Similar Tasks',
        description: 'Group similar tasks together and complete them in one focused session.',
        reason: 'Your task pattern shows frequent context switching. Batching will save time and mental energy.',
        priority: 'medium',
        estimatedTime: 60,
        difficulty: 'medium',
        category: 'productivity',
        actionItems: [
          'Group tasks by type',
          'Schedule batch sessions',
          'Eliminate distractions',
          'Take breaks between batches'
        ],
        expectedOutcome: 'Save 2+ hours per week',
        confidence: 0.83
      });
    }

    return recommendations;
  }

  private async generateWellnessRecommendations(context: any): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Mood-based recommendations
    if (context.currentMood === 'stressed' || context.currentMood === 'anxious') {
      recommendations.push({
        id: 'wellness-stress-relief',
        type: 'wellness',
        title: '5-Minute Stress Relief Practice',
        description: 'Use the 4-7-8 breathing technique: Inhale for 4, hold for 7, exhale for 8. Repeat 4 times.',
        reason: 'Your current stress levels need immediate attention. This technique activates your parasympathetic nervous system.',
        priority: 'high',
        estimatedTime: 5,
        difficulty: 'easy',
        category: 'mental-health',
        actionItems: [
          'Find a quiet spot',
          'Set phone to do not disturb',
          'Practice the breathing pattern',
          'Notice how you feel after'
        ],
        expectedOutcome: 'Immediate 30% reduction in stress feelings',
        confidence: 0.91
      });
    }

    // Energy-based recommendations
    if (context.energyLevel && context.energyLevel < 4) {
      recommendations.push({
        id: 'wellness-energy-boost',
        type: 'wellness',
        title: 'Natural Energy Booster',
        description: 'Take a 10-minute walk outside, preferably in nature or sunlight.',
        reason: 'Your energy is low. Natural light and movement are the fastest ways to boost energy without caffeine.',
        priority: 'high',
        estimatedTime: 10,
        difficulty: 'easy',
        category: 'physical-health',
        actionItems: [
          'Step outside right now',
          'Walk at moderate pace',
          'Focus on breathing',
          'Notice nature around you'
        ],
        expectedOutcome: 'Feel 40% more energized for next 2 hours',
        confidence: 0.88
      });
    }

    // Time-based wellness
    if (context.timeOfDay === 'afternoon') {
      recommendations.push({
        id: 'wellness-afternoon-recharge',
        type: 'wellness',
        title: 'Afternoon Recharge Routine',
        description: 'Combat afternoon slump with a mini routine: stretch, hydrate, and do 20 jumping jacks.',
        reason: 'It\'s prime time for energy dips. This routine prevents the 3pm crash.',
        priority: 'medium',
        estimatedTime: 5,
        difficulty: 'easy',
        category: 'energy',
        actionItems: [
          'Stand and stretch arms overhead',
          'Drink a full glass of water',
          'Do 20 jumping jacks',
          'Take 5 deep breaths'
        ],
        expectedOutcome: 'Maintain productivity through afternoon',
        confidence: 0.84
      });
    }

    // Sleep optimization
    if (context.timeOfDay === 'night') {
      recommendations.push({
        id: 'wellness-sleep-prep',
        type: 'wellness',
        title: 'Sleep Optimization Routine',
        description: 'Prepare for quality sleep: dim lights, no screens, and gentle stretching.',
        reason: 'Quality sleep is the foundation of wellbeing. Your evening routine directly impacts tomorrow\'s energy.',
        priority: 'high',
        estimatedTime: 15,
        difficulty: 'easy',
        category: 'sleep',
        actionItems: [
          'Dim all lights',
          'Put phone in another room',
          'Do gentle yoga stretches',
          'Read or journal briefly'
        ],
        expectedOutcome: 'Fall asleep 50% faster, wake refreshed',
        confidence: 0.86
      });
    }

    return recommendations;
  }

  private async personalizeRecommendations(
    recommendations: Recommendation[],
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    // Adjust based on learning style
    const profile = context.recentActivity?.profile;
    if (!profile) return recommendations;

    return recommendations.map(rec => {
      // Adjust for learning style
      switch (profile.learningStyle) {
        case 'visual':
          rec.actionItems = rec.actionItems.map(item => 
            `📌 ${item} (visualize the outcome)`
          );
          break;
        case 'auditory':
          rec.actionItems.push('🎵 Explain this aloud to yourself');
          break;
        case 'kinesthetic':
          rec.actionItems.push('🏃 Take action immediately, even a small step');
          break;
        case 'reading':
          rec.actionItems.push('📚 Research more about this topic');
          break;
      }

      // Adjust difficulty based on current state
      if (context.energyLevel && context.energyLevel < 3) {
        if (rec.difficulty === 'hard') rec.difficulty = 'medium';
        if (rec.difficulty === 'medium') rec.difficulty = 'easy';
      }

      // Adjust priority based on mood
      if (context.currentMood === 'motivated' || context.currentMood === 'energetic') {
        if (rec.difficulty === 'hard' && rec.priority === 'medium') {
          rec.priority = 'high';
        }
      }

      return rec;
    });
  }

  private hasRecentReflectionActivity(tasks: any[]): boolean {
    return tasks.some(task => 
      task.title.toLowerCase().includes('reflect') ||
      task.title.toLowerCase().includes('journal') ||
      task.title.toLowerCase().includes('review')
    );
  }

  private hasFragmentedTasks(tasks: any[]): boolean {
    if (tasks.length < 5) return false;
    
    // Check if tasks are spread throughout the day
    const taskHours = tasks.map((t: any) => new Date(t.createdAt).getHours());
    const uniqueHours = new Set(taskHours);
    
    return uniqueHours.size > tasks.length * 0.7;
  }

  private formatGrowthArea(area: string): string {
    const formatted = area.replace(/_/g, ' ').replace(/-/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  async getOptimalTiming(userId: string, activityType: string): Promise<{
    bestTime: string;
    reason: string;
    alternativeTimes: string[];
  }> {
    const profile = await userProfilingService.createOrUpdateProfile(userId);
    const patterns = profile.metadata?.timePreferences || {};

    // Analyze when user is most active
    const preferredHours = patterns.preferredHours || [9, 14, 19];
    const mostActiveTime = patterns.mostActiveTime || 'morning';

    const timingMap = {
      'deep-work': {
        bestTime: mostActiveTime === 'morning' ? '9:00 AM' : '2:00 PM',
        reason: `Your cognitive performance peaks in the ${mostActiveTime}`,
        alternativeTimes: ['10:00 AM', '3:00 PM', '7:00 PM']
      },
      'exercise': {
        bestTime: profile.behaviorPatterns.avgSessionDuration > 30 ? '7:00 AM' : '5:30 PM',
        reason: 'Based on your energy patterns and session durations',
        alternativeTimes: ['6:00 AM', '12:00 PM', '6:00 PM']
      },
      'reflection': {
        bestTime: '9:00 PM',
        reason: 'Evening reflection helps process the day and improves sleep',
        alternativeTimes: ['8:00 PM', '10:00 PM', '7:00 AM']
      },
      'planning': {
        bestTime: mostActiveTime === 'morning' ? '8:00 AM' : '5:00 PM',
        reason: 'Planning when fresh helps set clear intentions',
        alternativeTimes: ['7:00 AM', '4:00 PM', '9:00 PM']
      }
    };

    return timingMap[activityType] || timingMap['deep-work'];
  }

  async generateAdaptiveSchedule(userId: string, date: Date): Promise<{
    schedule: Array<{
      time: string;
      activity: string;
      duration: number;
      type: string;
      priority: string;
    }>;
    tips: string[];
  }> {
    const recommendations = await this.generateRecommendations(userId, ['task', 'habit', 'wellness'], 10);
    const profile = await userProfilingService.createOrUpdateProfile(userId);
    
    const schedule = [];
    const tips = [];

    // Morning routine
    if (profile.coachingPreferences.preferredTimes.includes('morning')) {
      schedule.push({
        time: '7:00 AM',
        activity: 'Morning Routine',
        duration: 15,
        type: 'wellness',
        priority: 'high'
      });
    }

    // Add recommendations to schedule
    const timeSlots = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '7:00 PM'];
    let slotIndex = 0;

    for (const rec of recommendations.slice(0, 5)) {
      if (slotIndex < timeSlots.length) {
        schedule.push({
          time: timeSlots[slotIndex],
          activity: rec.title,
          duration: rec.estimatedTime || 30,
          type: rec.type,
          priority: rec.priority
        });
        slotIndex++;
      }
    }

    // Add tips based on profile
    if (profile.behaviorPatterns.consistencyScore < 50) {
      tips.push('Start with just 2-3 activities to build consistency');
    }
    if (profile.progressMetrics.currentStreak > 7) {
      tips.push('Your streak is strong! Consider adding a challenge today');
    }
    if (profile.behaviorPatterns.preferredTopics.includes('productivity')) {
      tips.push('Block time for deep work during your peak hours');
    }

    return { schedule, tips };
  }
}

export const recommendationEngine = new RecommendationEngine();