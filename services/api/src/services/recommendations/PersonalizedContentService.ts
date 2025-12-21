/**
 * Personalized Content Service
 *
 * Generates and ranks personalized content for users based on their
 * preferences, behavior, and goals.
 */

export type ContentType = 'article' | 'video' | 'course' | 'podcast' | 'exercise' | 'meditation';

export type ContentCategory =
  | 'fitness'
  | 'nutrition'
  | 'mindfulness'
  | 'productivity'
  | 'leadership'
  | 'career'
  | 'relationships'
  | 'finance'
  | 'wellness'
  | 'personal_development';

export interface ContentItem {
  id: string;
  type: ContentType;
  category: ContentCategory;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  author: string;
  rating: number;
  totalRatings: number;
  tags: string[];
  publishedAt: Date;
}

export interface PersonalizedContent extends ContentItem {
  relevanceScore: number;
  reasons: string[];
  isNew: boolean;
  isRecommended: boolean;
  progress?: number;
}

export interface ContentFeed {
  featured: PersonalizedContent[];
  forYou: PersonalizedContent[];
  trending: PersonalizedContent[];
  continueLearning: PersonalizedContent[];
  basedOnGoals: PersonalizedContent[];
  newReleases: PersonalizedContent[];
}

export interface UserContentProfile {
  preferredTypes: ContentType[];
  preferredCategories: ContentCategory[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  viewHistory: Array<{ contentId: string; completionRate: number; rating?: number }>;
  savedItems: string[];
  goals: string[];
}

export class PersonalizedContentService {
  /**
   * Get personalized content feed for a user
   */
  async getPersonalizedFeed(userId: string): Promise<ContentFeed> {
    const profile = await this.getUserContentProfile(userId);
    const allContent = await this.getAvailableContent();

    // Score and rank content
    const scoredContent = allContent.map((content) =>
      this.scoreContent(content, profile)
    );

    // Sort by relevance
    scoredContent.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      featured: this.getFeaturedContent(scoredContent),
      forYou: this.getForYouContent(scoredContent, profile),
      trending: this.getTrendingContent(scoredContent),
      continueLearning: this.getContinueLearning(scoredContent, profile),
      basedOnGoals: this.getGoalBasedContent(scoredContent, profile),
      newReleases: this.getNewReleases(scoredContent),
    };
  }

  /**
   * Get content by category with personalization
   */
  async getContentByCategory(
    userId: string,
    category: ContentCategory,
    options: {
      limit?: number;
      offset?: number;
      type?: ContentType;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
    } = {}
  ): Promise<PersonalizedContent[]> {
    const profile = await this.getUserContentProfile(userId);
    const allContent = await this.getAvailableContent();

    let filtered = allContent.filter((c) => c.category === category);

    if (options.type) {
      filtered = filtered.filter((c) => c.type === options.type);
    }

    if (options.difficulty) {
      filtered = filtered.filter((c) => c.difficulty === options.difficulty);
    }

    const scored = filtered.map((c) => this.scoreContent(c, profile));
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const offset = options.offset || 0;
    const limit = options.limit || 20;

    return scored.slice(offset, offset + limit);
  }

  /**
   * Search content with personalized ranking
   */
  async searchContent(
    userId: string,
    query: string,
    options: {
      types?: ContentType[];
      categories?: ContentCategory[];
      limit?: number;
    } = {}
  ): Promise<PersonalizedContent[]> {
    const profile = await this.getUserContentProfile(userId);
    const allContent = await this.getAvailableContent();

    const queryLower = query.toLowerCase();

    let matched = allContent.filter((c) => {
      const matchesQuery =
        c.title.toLowerCase().includes(queryLower) ||
        c.description.toLowerCase().includes(queryLower) ||
        c.tags.some((t) => t.toLowerCase().includes(queryLower));

      const matchesType = !options.types?.length || options.types.includes(c.type);
      const matchesCategory =
        !options.categories?.length || options.categories.includes(c.category);

      return matchesQuery && matchesType && matchesCategory;
    });

    const scored = matched.map((c) => this.scoreContent(c, profile));
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scored.slice(0, options.limit || 20);
  }

  /**
   * Get similar content
   */
  async getSimilarContent(
    userId: string,
    contentId: string,
    limit = 5
  ): Promise<PersonalizedContent[]> {
    const profile = await this.getUserContentProfile(userId);
    const allContent = await this.getAvailableContent();
    const sourceContent = allContent.find((c) => c.id === contentId);

    if (!sourceContent) {
      return [];
    }

    const similar = allContent
      .filter((c) => c.id !== contentId)
      .map((c) => ({
        ...this.scoreContent(c, profile),
        similarity: this.calculateSimilarity(sourceContent, c),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similar;
  }

  /**
   * Record content interaction
   */
  async recordInteraction(
    userId: string,
    contentId: string,
    action: 'view' | 'complete' | 'save' | 'share' | 'rate',
    metadata?: { completionRate?: number; rating?: number }
  ): Promise<void> {
    console.log(`Content interaction: ${userId} ${action} ${contentId}`, metadata);
    // In production, store to database for personalization
  }

  // Private methods

  private async getUserContentProfile(userId: string): Promise<UserContentProfile> {
    // Mock implementation
    return {
      preferredTypes: ['article', 'video', 'course'],
      preferredCategories: ['fitness', 'productivity', 'mindfulness'],
      difficulty: 'intermediate',
      viewHistory: [
        { contentId: 'c1', completionRate: 100, rating: 5 },
        { contentId: 'c2', completionRate: 75 },
        { contentId: 'c3', completionRate: 50 },
      ],
      savedItems: ['c4', 'c5'],
      goals: ['fitness', 'productivity'],
    };
  }

  private async getAvailableContent(): Promise<ContentItem[]> {
    // Mock content library
    return [
      {
        id: 'c1',
        type: 'article',
        category: 'fitness',
        title: '10 Morning Exercises for Energy',
        description: 'Start your day with these energizing exercises that take only 10 minutes.',
        thumbnailUrl: '/images/content/exercise-morning.jpg',
        duration: 5,
        difficulty: 'beginner',
        author: 'Dr. Sarah Johnson',
        rating: 4.8,
        totalRatings: 1250,
        tags: ['morning', 'exercise', 'energy', 'beginner'],
        publishedAt: new Date('2024-01-15'),
      },
      {
        id: 'c2',
        type: 'video',
        category: 'mindfulness',
        title: 'Guided Meditation for Focus',
        description: 'A 15-minute guided meditation to improve concentration and mental clarity.',
        thumbnailUrl: '/images/content/meditation-focus.jpg',
        duration: 15,
        difficulty: 'beginner',
        author: 'Michael Chen',
        rating: 4.9,
        totalRatings: 2340,
        tags: ['meditation', 'focus', 'mindfulness', 'calm'],
        publishedAt: new Date('2024-01-10'),
      },
      {
        id: 'c3',
        type: 'course',
        category: 'productivity',
        title: 'Master Your Morning Routine',
        description: 'Learn to design a morning routine that sets you up for success all day.',
        thumbnailUrl: '/images/content/morning-routine.jpg',
        duration: 120,
        difficulty: 'intermediate',
        author: 'Emily Rodriguez',
        rating: 4.7,
        totalRatings: 890,
        tags: ['morning', 'routine', 'productivity', 'habits'],
        publishedAt: new Date('2024-01-05'),
      },
      {
        id: 'c4',
        type: 'article',
        category: 'nutrition',
        title: 'Meal Prep for Busy Professionals',
        description: 'Simple meal prep strategies that save time and improve your nutrition.',
        thumbnailUrl: '/images/content/meal-prep.jpg',
        duration: 8,
        difficulty: 'beginner',
        author: 'Chef David Kim',
        rating: 4.6,
        totalRatings: 750,
        tags: ['nutrition', 'meal prep', 'healthy eating', 'time saving'],
        publishedAt: new Date('2024-01-18'),
      },
      {
        id: 'c5',
        type: 'podcast',
        category: 'leadership',
        title: 'The Leadership Mindset',
        description: 'Insights from top executives on developing a leadership mindset.',
        thumbnailUrl: '/images/content/leadership-podcast.jpg',
        duration: 45,
        difficulty: 'advanced',
        author: 'Lisa Thompson',
        rating: 4.5,
        totalRatings: 560,
        tags: ['leadership', 'mindset', 'career', 'executive'],
        publishedAt: new Date('2024-01-20'),
      },
      {
        id: 'c6',
        type: 'exercise',
        category: 'fitness',
        title: 'HIIT Workout - 20 Minutes',
        description: 'High-intensity interval training for maximum calorie burn.',
        thumbnailUrl: '/images/content/hiit-workout.jpg',
        duration: 20,
        difficulty: 'intermediate',
        author: 'Coach Alex',
        rating: 4.8,
        totalRatings: 1890,
        tags: ['hiit', 'workout', 'fitness', 'cardio'],
        publishedAt: new Date('2024-01-12'),
      },
      {
        id: 'c7',
        type: 'meditation',
        category: 'wellness',
        title: 'Sleep Better Tonight',
        description: 'A relaxing meditation to help you fall asleep faster and sleep deeper.',
        thumbnailUrl: '/images/content/sleep-meditation.jpg',
        duration: 30,
        difficulty: 'beginner',
        author: 'Michael Chen',
        rating: 4.9,
        totalRatings: 3200,
        tags: ['sleep', 'relaxation', 'meditation', 'wellness'],
        publishedAt: new Date('2024-01-08'),
      },
      {
        id: 'c8',
        type: 'video',
        category: 'personal_development',
        title: 'Goal Setting Masterclass',
        description: 'Learn the science-backed method for setting and achieving goals.',
        thumbnailUrl: '/images/content/goal-setting.jpg',
        duration: 60,
        difficulty: 'intermediate',
        author: 'Dr. Sarah Johnson',
        rating: 4.7,
        totalRatings: 1120,
        tags: ['goals', 'motivation', 'planning', 'success'],
        publishedAt: new Date('2024-01-02'),
      },
    ];
  }

  private scoreContent(
    content: ContentItem,
    profile: UserContentProfile
  ): PersonalizedContent {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Type preference
    if (profile.preferredTypes.includes(content.type)) {
      score += 15;
      reasons.push(`Matches your preferred format: ${content.type}`);
    }

    // Category preference
    if (profile.preferredCategories.includes(content.category)) {
      score += 20;
      reasons.push(`In your favorite category: ${content.category}`);
    }

    // Difficulty match
    if (content.difficulty === profile.difficulty) {
      score += 10;
    }

    // Rating boost
    if (content.rating >= 4.5) {
      score += 5;
      reasons.push('Highly rated by other users');
    }

    // Goal alignment
    const goalMatch = profile.goals.some((g) =>
      content.tags.includes(g) || content.category === g
    );
    if (goalMatch) {
      score += 15;
      reasons.push('Aligned with your goals');
    }

    // Recency boost
    const daysSincePublish = Math.floor(
      (Date.now() - content.publishedAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSincePublish <= 7) {
      score += 10;
    } else if (daysSincePublish <= 30) {
      score += 5;
    }

    // Find progress from view history
    const viewed = profile.viewHistory.find((v) => v.contentId === content.id);
    const progress = viewed?.completionRate;

    return {
      ...content,
      relevanceScore: Math.min(score, 100),
      reasons,
      isNew: daysSincePublish <= 7,
      isRecommended: score >= 70,
      progress,
    };
  }

  private calculateSimilarity(source: ContentItem, target: ContentItem): number {
    let similarity = 0;

    if (source.category === target.category) similarity += 30;
    if (source.type === target.type) similarity += 20;
    if (source.difficulty === target.difficulty) similarity += 10;
    if (source.author === target.author) similarity += 15;

    // Tag overlap
    const commonTags = source.tags.filter((t) => target.tags.includes(t));
    similarity += commonTags.length * 5;

    return Math.min(similarity, 100);
  }

  private getFeaturedContent(content: PersonalizedContent[]): PersonalizedContent[] {
    return content
      .filter((c) => c.rating >= 4.7 && c.totalRatings >= 1000)
      .slice(0, 3);
  }

  private getForYouContent(
    content: PersonalizedContent[],
    profile: UserContentProfile
  ): PersonalizedContent[] {
    return content
      .filter((c) => !profile.viewHistory.some((v) => v.contentId === c.id && v.completionRate === 100))
      .slice(0, 10);
  }

  private getTrendingContent(content: PersonalizedContent[]): PersonalizedContent[] {
    return [...content]
      .sort((a, b) => b.totalRatings - a.totalRatings)
      .slice(0, 5);
  }

  private getContinueLearning(
    content: PersonalizedContent[],
    profile: UserContentProfile
  ): PersonalizedContent[] {
    return content.filter((c) => {
      const viewed = profile.viewHistory.find((v) => v.contentId === c.id);
      return viewed && viewed.completionRate > 0 && viewed.completionRate < 100;
    });
  }

  private getGoalBasedContent(
    content: PersonalizedContent[],
    profile: UserContentProfile
  ): PersonalizedContent[] {
    return content
      .filter((c) =>
        profile.goals.some(
          (g) => c.category === g || c.tags.includes(g)
        )
      )
      .slice(0, 5);
  }

  private getNewReleases(content: PersonalizedContent[]): PersonalizedContent[] {
    return content.filter((c) => c.isNew).slice(0, 5);
  }
}
