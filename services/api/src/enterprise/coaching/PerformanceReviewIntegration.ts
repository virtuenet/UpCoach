import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';

/**
 * Performance Review Integration
 *
 * Integrates coaching data with enterprise performance review systems.
 * Links coaching progress with formal performance evaluations.
 *
 * Features:
 * - Performance review cycle management
 * - Goal alignment with coaching
 * - 360-degree feedback integration
 * - Performance metrics tracking
 * - Review workflow automation
 * - Analytics and reporting
 */

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  cycleId: string;
  type: 'annual' | 'quarterly' | 'mid-year' | '360' | 'self-review';
  status: 'draft' | 'submitted' | 'in-review' | 'completed' | 'acknowledged';
  ratings: ReviewRating[];
  goals: ReviewGoal[];
  feedback: FeedbackSection[];
  overallScore: number;
  coachingRecommendations: string[];
  developmentPlan: DevelopmentPlan;
  submittedAt?: Date;
  completedAt?: Date;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewCycle {
  id: string;
  organizationId: string;
  name: string;
  type: 'annual' | 'quarterly' | 'continuous';
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'active' | 'in-progress' | 'completed';
  participants: string[]; // Employee IDs
  template: ReviewTemplate;
}

export interface ReviewRating {
  category: string;
  dimension: string;
  score: number; // 1-5
  weight: number;
  comments?: string;
  evidence?: string[];
}

export interface ReviewGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  achievement: number; // 0-100%
  status: 'not-started' | 'in-progress' | 'achieved' | 'not-achieved';
  coachingGoalId?: string; // Link to coaching goal
}

export interface FeedbackSection {
  type: 'strengths' | 'improvements' | 'achievements' | 'challenges' | 'development';
  content: string;
  examples?: string[];
}

export interface DevelopmentPlan {
  areas: DevelopmentArea[];
  timeline: string;
  supportNeeded: string[];
  coachingAlignment: boolean;
}

export interface DevelopmentArea {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  actions: string[];
  resources: string[];
  deadline: Date;
}

export interface ReviewTemplate {
  id: string;
  name: string;
  categories: string[];
  ratingScale: number;
  customFields: CustomField[];
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'rating' | 'multiselect';
  required: boolean;
  options?: string[];
}

export interface FeedbackRequest {
  id: string;
  reviewId: string;
  requesterId: string;
  respondentId: string;
  type: 'peer' | 'direct-report' | 'manager' | 'stakeholder';
  questions: string[];
  responses?: Record<string, any>;
  status: 'pending' | 'completed' | 'expired';
  dueDate: Date;
}

export class PerformanceReviewIntegration extends EventEmitter {
  private logger: Logger;
  private reviews: Map<string, PerformanceReview>;
  private cycles: Map<string, ReviewCycle>;
  private feedbackRequests: Map<string, FeedbackRequest>;

  constructor() {
    super();
    this.logger = new Logger('PerformanceReviewIntegration');
    this.reviews = new Map();
    this.cycles = new Map();
    this.feedbackRequests = new Map();
  }

  /**
   * Initialize the integration
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing performance review integration...');

      await this.loadReviews();
      await this.loadCycles();
      this.setupEventListeners();

      this.logger.info('Performance review integration initialized');
    } catch (error) {
      this.logger.error('Failed to initialize integration', error);
      throw error;
    }
  }

  /**
   * Create review cycle
   */
  async createCycle(config: Partial<ReviewCycle>): Promise<ReviewCycle> {
    try {
      const cycle: ReviewCycle = {
        id: this.generateCycleId(),
        organizationId: config.organizationId || '',
        name: config.name || '',
        type: config.type || 'quarterly',
        startDate: config.startDate || new Date(),
        endDate: config.endDate || new Date(),
        status: 'planned',
        participants: config.participants || [],
        template: config.template || this.getDefaultTemplate(),
      };

      await this.saveCycle(cycle);
      this.cycles.set(cycle.id, cycle);

      this.emit('cycle:created', cycle);
      this.logger.info('Review cycle created', { cycleId: cycle.id });

      return cycle;
    } catch (error) {
      this.logger.error('Failed to create cycle', error);
      throw error;
    }
  }

  /**
   * Start review cycle
   */
  async startCycle(cycleId: string): Promise<void> {
    try {
      const cycle = this.cycles.get(cycleId);

      if (!cycle) {
        throw new Error('Cycle not found');
      }

      cycle.status = 'active';

      // Create reviews for all participants
      for (const employeeId of cycle.participants) {
        await this.createReview({
          employeeId,
          cycleId,
          type: cycle.type === 'annual' ? 'annual' : 'quarterly',
        });
      }

      await this.saveCycle(cycle);

      this.emit('cycle:started', cycle);
      this.logger.info('Review cycle started', { cycleId });
    } catch (error) {
      this.logger.error('Failed to start cycle', { cycleId, error });
      throw error;
    }
  }

  /**
   * Create performance review
   */
  async createReview(config: Partial<PerformanceReview>): Promise<PerformanceReview> {
    try {
      const review: PerformanceReview = {
        id: this.generateReviewId(),
        employeeId: config.employeeId || '',
        reviewerId: config.reviewerId || '',
        cycleId: config.cycleId || '',
        type: config.type || 'quarterly',
        status: 'draft',
        ratings: config.ratings || [],
        goals: config.goals || [],
        feedback: config.feedback || [],
        overallScore: 0,
        coachingRecommendations: [],
        developmentPlan: config.developmentPlan || {
          areas: [],
          timeline: '',
          supportNeeded: [],
          coachingAlignment: false,
        },
        dueDate: config.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Link coaching goals
      await this.linkCoachingGoals(review);

      await this.saveReview(review);
      this.reviews.set(review.id, review);

      this.emit('review:created', review);
      this.logger.info('Review created', { reviewId: review.id, employeeId: review.employeeId });

      return review;
    } catch (error) {
      this.logger.error('Failed to create review', error);
      throw error;
    }
  }

  /**
   * Update review
   */
  async updateReview(
    reviewId: string,
    updates: Partial<PerformanceReview>
  ): Promise<PerformanceReview> {
    try {
      const review = this.reviews.get(reviewId);

      if (!review) {
        throw new Error('Review not found');
      }

      const updated: PerformanceReview = {
        ...review,
        ...updates,
        updatedAt: new Date(),
      };

      // Recalculate overall score if ratings changed
      if (updates.ratings) {
        updated.overallScore = this.calculateOverallScore(updated.ratings);
      }

      await this.saveReview(updated);
      this.reviews.set(reviewId, updated);

      this.emit('review:updated', updated);

      return updated;
    } catch (error) {
      this.logger.error('Failed to update review', { reviewId, error });
      throw error;
    }
  }

  /**
   * Submit review
   */
  async submitReview(reviewId: string): Promise<void> {
    try {
      const review = this.reviews.get(reviewId);

      if (!review) {
        throw new Error('Review not found');
      }

      // Validate review is complete
      if (!this.isReviewComplete(review)) {
        throw new Error('Review is incomplete');
      }

      review.status = 'submitted';
      review.submittedAt = new Date();
      review.overallScore = this.calculateOverallScore(review.ratings);

      await this.saveReview(review);

      // Generate coaching recommendations
      await this.generateCoachingRecommendations(reviewId);

      this.emit('review:submitted', review);
      this.logger.info('Review submitted', { reviewId });
    } catch (error) {
      this.logger.error('Failed to submit review', { reviewId, error });
      throw error;
    }
  }

  /**
   * Request 360 feedback
   */
  async request360Feedback(
    reviewId: string,
    respondents: Array<{ id: string; type: FeedbackRequest['type'] }>
  ): Promise<FeedbackRequest[]> {
    try {
      const review = this.reviews.get(reviewId);

      if (!review) {
        throw new Error('Review not found');
      }

      const requests: FeedbackRequest[] = [];

      for (const respondent of respondents) {
        const request: FeedbackRequest = {
          id: this.generateFeedbackRequestId(),
          reviewId,
          requesterId: review.employeeId,
          respondentId: respondent.id,
          type: respondent.type,
          questions: this.get360Questions(respondent.type),
          status: 'pending',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        };

        await this.saveFeedbackRequest(request);
        this.feedbackRequests.set(request.id, request);
        requests.push(request);
      }

      this.emit('feedback:requested', { reviewId, requests });
      this.logger.info('360 feedback requested', { reviewId, count: requests.length });

      return requests;
    } catch (error) {
      this.logger.error('Failed to request feedback', { reviewId, error });
      throw error;
    }
  }

  /**
   * Submit feedback response
   */
  async submitFeedback(
    requestId: string,
    responses: Record<string, any>
  ): Promise<void> {
    try {
      const request = this.feedbackRequests.get(requestId);

      if (!request) {
        throw new Error('Feedback request not found');
      }

      request.responses = responses;
      request.status = 'completed';

      await this.saveFeedbackRequest(request);

      // Update related review
      await this.aggregateFeedback(request.reviewId);

      this.emit('feedback:submitted', request);
      this.logger.info('Feedback submitted', { requestId });
    } catch (error) {
      this.logger.error('Failed to submit feedback', { requestId, error });
      throw error;
    }
  }

  /**
   * Link coaching goals to review
   */
  async linkCoachingGoals(review: PerformanceReview): Promise<void> {
    try {
      // Mock implementation - would query coaching goals from database
      // and link them to review goals

      this.logger.info('Linked coaching goals to review', { reviewId: review.id });
    } catch (error) {
      this.logger.error('Failed to link coaching goals', error);
    }
  }

  /**
   * Generate coaching recommendations
   */
  async generateCoachingRecommendations(reviewId: string): Promise<void> {
    try {
      const review = this.reviews.get(reviewId);

      if (!review) {
        return;
      }

      const recommendations: string[] = [];

      // Analyze ratings and generate recommendations
      for (const rating of review.ratings) {
        if (rating.score < 3) {
          recommendations.push(
            `Focus on developing ${rating.dimension} through targeted coaching`
          );
        }
      }

      // Analyze goals
      const unachievedGoals = review.goals.filter(
        g => g.status === 'not-achieved' || g.achievement < 70
      );

      if (unachievedGoals.length > 0) {
        recommendations.push(
          'Consider coaching support for goal achievement and accountability'
        );
      }

      review.coachingRecommendations = recommendations;
      await this.saveReview(review);

      this.emit('recommendations:generated', { reviewId, recommendations });
    } catch (error) {
      this.logger.error('Failed to generate recommendations', { reviewId, error });
    }
  }

  /**
   * Get review analytics
   */
  async getReviewAnalytics(organizationId: string): Promise<any> {
    try {
      const orgReviews = Array.from(this.reviews.values()).filter(r => {
        const cycle = this.cycles.get(r.cycleId);
        return cycle && cycle.organizationId === organizationId;
      });

      const totalReviews = orgReviews.length;
      const completedReviews = orgReviews.filter(r => r.status === 'completed').length;
      const averageScore =
        orgReviews.reduce((sum, r) => sum + r.overallScore, 0) / totalReviews || 0;

      return {
        totalReviews,
        completedReviews,
        completionRate: totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0,
        averageScore,
        coachingRecommendationRate:
          (orgReviews.filter(r => r.coachingRecommendations.length > 0).length /
            totalReviews) *
            100 || 0,
      };
    } catch (error) {
      this.logger.error('Failed to get analytics', { organizationId, error });
      return null;
    }
  }

  // Private helper methods

  private calculateOverallScore(ratings: ReviewRating[]): number {
    if (ratings.length === 0) return 0;

    const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);
    const weightedSum = ratings.reduce((sum, r) => sum + r.score * r.weight, 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private isReviewComplete(review: PerformanceReview): boolean {
    return (
      review.ratings.length > 0 &&
      review.goals.length > 0 &&
      review.feedback.length > 0
    );
  }

  private async aggregateFeedback(reviewId: string): Promise<void> {
    const requests = Array.from(this.feedbackRequests.values()).filter(
      r => r.reviewId === reviewId && r.status === 'completed'
    );

    // Aggregate feedback responses into review
    this.logger.info('Aggregated feedback', { reviewId, count: requests.length });
  }

  private get360Questions(type: FeedbackRequest['type']): string[] {
    const questions = [
      'What are this person\'s key strengths?',
      'What areas could this person develop?',
      'How effectively does this person communicate?',
      'How well does this person collaborate with others?',
      'What impact has this person made on the team/organization?',
    ];

    return questions;
  }

  private getDefaultTemplate(): ReviewTemplate {
    return {
      id: 'default',
      name: 'Standard Review Template',
      categories: ['Performance', 'Collaboration', 'Leadership', 'Technical Skills'],
      ratingScale: 5,
      customFields: [],
    };
  }

  private generateReviewId(): string {
    return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCycleId(): string {
    return `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFeedbackRequestId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadReviews(): Promise<void> {
    // Mock implementation
    this.logger.info('Loaded reviews', { count: this.reviews.size });
  }

  private async loadCycles(): Promise<void> {
    // Mock implementation
    this.logger.info('Loaded cycles', { count: this.cycles.size });
  }

  private async saveReview(review: PerformanceReview): Promise<void> {
    // Mock implementation
  }

  private async saveCycle(cycle: ReviewCycle): Promise<void> {
    // Mock implementation
  }

  private async saveFeedbackRequest(request: FeedbackRequest): Promise<void> {
    // Mock implementation
  }

  private setupEventListeners(): void {
    this.on('review:submitted', (review) => {
      this.logger.info('Review submitted event', { reviewId: review.id });
    });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down performance review integration...');
    this.reviews.clear();
    this.cycles.clear();
    this.feedbackRequests.clear();
    this.removeAllListeners();
  }
}

export default PerformanceReviewIntegration;
