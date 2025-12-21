/**
 * Recommendations API Routes
 *
 * Endpoints for AI-powered personalized recommendations
 */

import { Router, Request, Response } from 'express';
import {
  RecommendationEngine,
  RecommendationType,
  RecommendationPriority,
} from '../services/recommendations/RecommendationEngine';
import {
  PersonalizedContentService,
  ContentType,
  ContentCategory,
} from '../services/recommendations/PersonalizedContentService';

const router = Router();

// Initialize services
const recommendationEngine = new RecommendationEngine();
const contentService = new PersonalizedContentService();

// ============================================================================
// Recommendation Routes
// ============================================================================

/**
 * GET /api/recommendations/:userId
 * Get personalized recommendations for a user
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { types, priorities, limit, excludeIds } = req.query;

    const recommendations = await recommendationEngine.generateRecommendations(
      userId,
      {
        types: types
          ? (types as string).split(',') as RecommendationType[]
          : undefined,
        priorities: priorities
          ? (priorities as string).split(',') as RecommendationPriority[]
          : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        excludeIds: excludeIds
          ? (excludeIds as string).split(',')
          : undefined,
      }
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
    });
  }
});

/**
 * POST /api/recommendations/:userId/interaction
 * Record a recommendation interaction
 */
router.post('/:userId/interaction', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { recommendationId, action } = req.body;

    if (!recommendationId || !action) {
      return res.status(400).json({
        success: false,
        error: 'recommendationId and action are required',
      });
    }

    await recommendationEngine.recordInteraction(
      userId,
      recommendationId,
      action
    );

    res.json({
      success: true,
      message: 'Interaction recorded',
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record interaction',
    });
  }
});

/**
 * GET /api/recommendations/metrics/effectiveness
 * Get recommendation effectiveness metrics (admin)
 */
router.get('/metrics/effectiveness', async (_req: Request, res: Response) => {
  try {
    const metrics = await recommendationEngine.getEffectivenessMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching effectiveness metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch effectiveness metrics',
    });
  }
});

// ============================================================================
// Content Personalization Routes
// ============================================================================

/**
 * GET /api/recommendations/content/:userId/feed
 * Get personalized content feed for a user
 */
router.get('/content/:userId/feed', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const feed = await contentService.getPersonalizedFeed(userId);

    res.json({
      success: true,
      data: feed,
    });
  } catch (error) {
    console.error('Error fetching content feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content feed',
    });
  }
});

/**
 * GET /api/recommendations/content/:userId/category/:category
 * Get content by category with personalization
 */
router.get(
  '/content/:userId/category/:category',
  async (req: Request, res: Response) => {
    try {
      const { userId, category } = req.params;
      const { limit, offset, type, difficulty } = req.query;

      const content = await contentService.getContentByCategory(
        userId,
        category as ContentCategory,
        {
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined,
          type: type as ContentType | undefined,
          difficulty: difficulty as
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | undefined,
        }
      );

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      console.error('Error fetching category content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category content',
      });
    }
  }
);

/**
 * GET /api/recommendations/content/:userId/search
 * Search content with personalized ranking
 */
router.get('/content/:userId/search', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { q, types, categories, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required',
      });
    }

    const content = await contentService.searchContent(userId, q as string, {
      types: types
        ? (types as string).split(',') as ContentType[]
        : undefined,
      categories: categories
        ? (categories as string).split(',') as ContentCategory[]
        : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search content',
    });
  }
});

/**
 * GET /api/recommendations/content/:userId/similar/:contentId
 * Get similar content
 */
router.get(
  '/content/:userId/similar/:contentId',
  async (req: Request, res: Response) => {
    try {
      const { userId, contentId } = req.params;
      const { limit } = req.query;

      const content = await contentService.getSimilarContent(
        userId,
        contentId,
        limit ? parseInt(limit as string) : 5
      );

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      console.error('Error fetching similar content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch similar content',
      });
    }
  }
);

/**
 * POST /api/recommendations/content/:userId/interaction
 * Record content interaction
 */
router.post(
  '/content/:userId/interaction',
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { contentId, action, metadata } = req.body;

      if (!contentId || !action) {
        return res.status(400).json({
          success: false,
          error: 'contentId and action are required',
        });
      }

      await contentService.recordInteraction(
        userId,
        contentId,
        action,
        metadata
      );

      res.json({
        success: true,
        message: 'Interaction recorded',
      });
    } catch (error) {
      console.error('Error recording content interaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record content interaction',
      });
    }
  }
);

export default router;
