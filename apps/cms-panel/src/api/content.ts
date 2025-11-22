import { apiClient } from './client';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  featuredImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  readTime: number;
  viewCount: number;
  shareCount: number;
  likeCount: number;
  metadata: {
    wordCount: number;
    version: number;
    lastEditedBy?: string;
    sources?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
  settings: {
    allowComments: boolean;
    enableNotifications: boolean;
    isFeatured: boolean;
    isTemplate: boolean;
  };
  analytics: {
    avgReadTime: number;
    bounceRate: number;
    completionRate: number;
    engagementScore: number;
  };
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  author?: {
    id: string;
    fullName: string;
  };
}

export interface GetArticlesParams {
  search?: string;
  status?: string;
  category?: string;
  author?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateArticleData {
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  status?: 'draft' | 'published';
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  settings?: {
    allowComments?: boolean;
    enableNotifications?: boolean;
    isFeatured?: boolean;
    isTemplate?: boolean;
  };
  publishingSchedule?: {
    scheduledPublishAt?: string | null;
    timezone?: string;
    autoPublish?: boolean;
  };
}

export interface ArticlesResponse {
  data: Article[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  path: string;
  isActive: boolean;
}

export const contentApi = {
  getArticles: async (params: GetArticlesParams = {}): Promise<ArticlesResponse> => {
    const response = await apiClient.get('/cms/articles', { params });
    return {
      data: response.data.data || response.data,
      pagination: response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: response.data?.length || 0,
        itemsPerPage: params.limit || 10,
      },
    };
  },

  getArticle: async (id: string, trackView: boolean = false): Promise<Article> => {
    const response = await apiClient.get(`/cms/articles/${id}`, {
      params: { trackView },
    });
    return response.data;
  },

  createArticle: async (data: CreateArticleData): Promise<Article> => {
    const response = await apiClient.post('/cms/articles', data);
    return response.data;
  },

  updateArticle: async (id: string, data: Partial<CreateArticleData>): Promise<Article> => {
    const response = await apiClient.put(`/cms/articles/${id}`, data);
    return response.data;
  },

  deleteArticle: async (id: string): Promise<void> => {
    await apiClient.delete(`/cms/articles/${id}`);
  },

  publishArticle: async (id: string): Promise<Article> => {
    const response = await apiClient.patch(`/cms/articles/${id}/publish`);
    return response.data;
  },

  archiveArticle: async (id: string): Promise<Article> => {
    const response = await apiClient.patch(`/cms/articles/${id}/archive`);
    return response.data;
  },

  searchArticles: async (
    query: string,
    filters: {
      category?: string;
      status?: string;
      author?: string;
      tags?: string[];
    } = {}
  ): Promise<Article[]> => {
    const params = { q: query, ...filters };
    if (filters.tags) {
      (params as any).tags = filters.tags.join(',');
    }
    const response = await apiClient.get('/cms/articles/search', { params });
    return response.data;
  },

  getPopularArticles: async (
    limit: number = 10,
    timeframe: string = 'month'
  ): Promise<Article[]> => {
    const response = await apiClient.get('/cms/articles/popular', {
      params: { limit, timeframe },
    });
    return response.data;
  },

  getArticleAnalytics: async (
    id: string
  ): Promise<{
    article: {
      id: string;
      title: string;
      status: string;
      publishedAt: string | null;
    };
    analytics: {
      totalViews: number;
      uniqueUsers: number;
      averageReadTime: number;
      completionRate: number;
      engagementScore: number;
      topReferrers: string[];
      deviceBreakdown: Record<string, number>;
      locationBreakdown: Record<string, number>;
    };
  }> => {
    const response = await apiClient.get(`/cms/articles/${id}/analytics`);
    return response.data;
  },

  // Categories API
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/cms/categories');
    return response.data;
  },

  createCategory: async (data: {
    name: string;
    description?: string;
    parentId?: string;
  }): Promise<Category> => {
    const response = await apiClient.post('/cms/categories', data);
    return response.data;
  },
};
