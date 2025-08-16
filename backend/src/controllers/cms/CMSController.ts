import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from 'sequelize';
import { ContentArticle } from '../../models/cms/ContentArticle';
import { ContentCategory } from '../../models/cms/ContentCategory';
import { ContentMedia } from '../../models/cms/ContentMedia';
import ContentTemplate from '../../models/cms/ContentTemplate';
import ContentVersion from '../../models/cms/ContentVersion';
import ContentInteraction from '../../models/cms/ContentInteraction';
import ContentSchedule from '../../models/cms/ContentSchedule';
import ContentComment from '../../models/cms/ContentComment';
import { User } from '../../models/User';
import { getCacheService } from '../../services/cache/UnifiedCacheService';
import uploadService from '../../services/upload/UploadService';
import { logger } from '../../utils/logger';
import slugify from 'slugify';

// Article Controllers
export const getArticles = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      author,
      tags,
      search,
      sort = '-createdAt',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // Apply filters
    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (author) where.authorId = author;
    if (tags) where.tags = { [Op.contains]: Array.isArray(tags) ? tags : [tags] };
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { summary: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Check if public access
    const isPublic = req.path.includes('/public');
    if (isPublic) {
      where.status = 'published';
      where.publishDate = { [Op.lte]: new Date() };
    }

    // Parse sort
    const sortString = String(sort);
    const sortField = sortString.startsWith('-') ? sortString.slice(1) : sortString;
    const sortOrder = sortString.startsWith('-') ? 'DESC' : 'ASC';

    const { rows: articles, count } = await ContentArticle.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortField, sortOrder]],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
        {
          model: ContentCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      distinct: true,
    });

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Failed to get articles:', error);
    res.status(500).json({ success: false, error: 'Failed to get articles' });
  }
};

export const createArticle = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      summary,
      content,
      categoryId,
      featuredImage,
      tags,
      seoTitle,
      seoDescription,
      seoKeywords,
      metadata,
      status = 'draft',
      visibility = 'public',
      publishDate,
      allowComments = true,
    } = req.body;

    // Generate slug if not provided
    const articleSlug = slug || slugify(title, { lower: true, strict: true });

    const article = await ContentArticle.create({
      title,
      slug: articleSlug,
      summary,
      content,
      authorId: Number(req.user!.id),
      categoryId,
      featuredImage,
      tags: tags || [],
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || summary,
      seoKeywords: seoKeywords || [],
      metadata,
      status,
      visibility,
      publishDate,
      allowComments,
      lastModifiedBy: Number(req.user!.id),
    });

    // Create initial version
    await article.createVersion(Number(req.user!.id), 'Initial version');

    // Invalidate cache
    await getCacheService().invalidate('cms:articles:*');

    res.status(201).json({
      success: true,
      data: article,
    });
  } catch (error) {
    logger.error('Failed to create article:', error);
    res.status(500).json({ success: false, error: 'Failed to create article' });
  }
};

export const getArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isPublic = req.path.includes('/public');

    // Try cache first
    const cacheKey = `cms:article:${id}`;
    const cached = await getCacheService().get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const where: any = isNaN(Number(id)) ? { slug: id } : { id };
    
    if (isPublic) {
      where.status = 'published';
      where.publishDate = { [Op.lte]: new Date() };
    }

    const article = await ContentArticle.scope(['full', 'withContent']).findOne({
      where,
    });

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Track view if public
    if (isPublic && req.user) {
      await ContentInteraction.create({
        userId: Number(req.user.id),
        contentId: article.id,
        interactionType: 'view',
      });
      await article.incrementViewCount();
    }

    // Cache the result
    await getCacheService().set(cacheKey, article, { ttl: 3600 });

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    logger.error('Failed to get article:', error);
    res.status(500).json({ success: false, error: 'Failed to get article' });
  }
};

export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await ContentArticle.findByPk(id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Check permissions
    if (!article.canEdit(Number(req.user!.id), req.user!.role)) {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    // Create version before updating
    await article.createVersion(Number(req.user!.id), req.body.changeSummary);

    // Update article
    await article.update({
      ...req.body,
      lastModifiedBy: Number(req.user!.id),
    });

    // Invalidate cache
    await getCacheService().del(`cms:article:${id}`);
    await getCacheService().invalidate('cms:articles:*');

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    logger.error('Failed to update article:', error);
    res.status(500).json({ success: false, error: 'Failed to update article' });
  }
};

export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await ContentArticle.findByPk(id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    await article.destroy();

    // Invalidate cache
    await getCacheService().del(`cms:article:${id}`);
    await getCacheService().invalidate('cms:articles:*');

    res.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete article:', error);
    res.status(500).json({ success: false, error: 'Failed to delete article' });
  }
};

export const publishArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await ContentArticle.findByPk(id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    if (!article.canPublish(req.user!.role)) {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    await article.publish();

    // Invalidate cache
    await getCacheService().del(`cms:article:${id}`);
    await getCacheService().invalidate('cms:articles:*');

    res.json({
      success: true,
      data: article,
      message: 'Article published successfully',
    });
  } catch (error) {
    logger.error('Failed to publish article:', error);
    res.status(500).json({ success: false, error: 'Failed to publish article' });
  }
};

export const unpublishArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await ContentArticle.findByPk(id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    if (!article.canPublish(req.user!.role)) {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    await article.unpublish();

    // Invalidate cache
    await getCacheService().del(`cms:article:${id}`);
    await getCacheService().invalidate('cms:articles:*');

    res.json({
      success: true,
      data: article,
      message: 'Article unpublished successfully',
    });
  } catch (error) {
    logger.error('Failed to unpublish article:', error);
    res.status(500).json({ success: false, error: 'Failed to unpublish article' });
  }
};

export const getArticleVersions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const versions = await ContentVersion.findAll({
      where: { contentId: id },
      order: [['version', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
      ],
    });

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    logger.error('Failed to get article versions:', error);
    res.status(500).json({ success: false, error: 'Failed to get versions' });
  }
};

export const revertArticleVersion = async (req: Request, res: Response) => {
  try {
    const { id, version } = req.params;
    
    const article = await ContentArticle.findByPk(id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const versionData = await ContentVersion.findOne({
      where: {
        contentId: id,
        version: version,
      },
    });

    if (!versionData) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    // Create new version before reverting
    await article.createVersion(Number(req.user!.id), `Reverted to version ${version}`);

    // Revert to selected version
    await article.update({
      title: versionData.title,
      content: versionData.content,
      lastModifiedBy: Number(req.user!.id),
    });

    // Invalidate cache
    await getCacheService().del(`cms:article:${id}`);
    await getCacheService().invalidate('cms:articles:*');

    res.json({
      success: true,
      data: article,
      message: `Reverted to version ${version}`,
    });
  } catch (error) {
    logger.error('Failed to revert article version:', error);
    res.status(500).json({ success: false, error: 'Failed to revert version' });
  }
};

// Media Controllers
export const uploadMedia = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { folder = 'general', altText, caption, tags } = req.body;

    // Upload to storage service
    const uploadResult = await uploadService.uploadFile(req.file, {
      folder: `cms/${folder}`,
      generateThumbnail: req.file.mimetype.startsWith('image/'),
    });

    const media = await ContentMedia.create({
      filename: uploadResult.filename,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      type: req.file.mimetype.startsWith('image/') ? 'image' : 
            req.file.mimetype.startsWith('video/') ? 'video' : 
            req.file.mimetype.startsWith('audio/') ? 'audio' : 'document',
      width: uploadResult.dimensions?.width,
      height: uploadResult.dimensions?.height,
      uploadedBy: req.user!.id,
      isPublic: true,
      metadata: {
        ...uploadResult.metadata,
        alt: altText,
        caption,
        folder,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      },
    });

    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    logger.error('Failed to upload media:', error);
    res.status(500).json({ success: false, error: 'Failed to upload media' });
  }
};

export const getMedia = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, folder, tags, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (folder) where.folder = folder;
    if (tags) where.tags = { [Op.contains]: Array.isArray(tags) ? tags : [tags] };
    if (search) {
      where[Op.or] = [
        { filename: { [Op.iLike]: `%${search}%` } },
        { originalFilename: { [Op.iLike]: `%${search}%` } },
        { altText: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: media, count } = await ContentMedia.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: media,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Failed to get media:', error);
    res.status(500).json({ success: false, error: 'Failed to get media' });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const media = await ContentMedia.findByPk(id);

    if (!media) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }

    // Delete from storage
    await uploadService.deleteFile(media.filename);
    if (media.thumbnailUrl) {
      await uploadService.deleteFile(media.thumbnailUrl);
    }

    await media.destroy();

    res.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete media:', error);
    res.status(500).json({ success: false, error: 'Failed to delete media' });
  }
};

// Category Controllers
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await ContentCategory.findAll({
      where: { isActive: true },
      order: [['orderIndex', 'ASC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Failed to get categories:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, parentId, icon, color, orderIndex } = req.body;
    
    const slug = slugify(name, { lower: true, strict: true });
    
    const category = await ContentCategory.create({
      name,
      slug,
      description,
      parentId,
      icon,
      color,
      order: orderIndex || 0,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('Failed to create category:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await ContentCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    await category.update(req.body);

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('Failed to update category:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await ContentCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Check if category has articles
    const articleCount = await ContentArticle.count({
      where: { categoryId: id },
    });

    if (articleCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category with ${articleCount} articles`,
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete category:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};

// Template Controllers
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const where: any = { isActive: true };
    
    if (type) where.templateType = type;

    const templates = await ContentTemplate.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('Failed to get templates:', error);
    res.status(500).json({ success: false, error: 'Failed to get templates' });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const template = await ContentTemplate.create({
      ...req.body,
      createdBy: Number(req.user!.id),
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Failed to create template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await ContentTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    await template.update(req.body);

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Failed to update template:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
};

// Content Analysis & Tools
export const analyzeContent = async (req: Request, res: Response) => {
  try {
    const { content, title } = req.body;

    // Perform content analysis
    const analysis = {
      readability: calculateReadability(content),
      seo: analyzeSEO(title, content),
      wordCount: content.split(/\s+/).length,
      readingTime: Math.ceil(content.split(/\s+/).length / 200),
      keywords: extractKeywords(content),
    };

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('Failed to analyze content:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze content' });
  }
};

export const previewContent = async (req: Request, res: Response) => {
  try {
    const { content, format = 'html' } = req.body;

    // Convert content to preview format
    const preview = await generatePreview(content, format);

    res.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    logger.error('Failed to preview content:', error);
    res.status(500).json({ success: false, error: 'Failed to preview content' });
  }
};

// Analytics
export const getContentAnalytics = async (req: Request, res: Response) => {
  try {
    const {} = req.query;

    const analytics = {
      totalArticles: await ContentArticle.count(),
      publishedArticles: await ContentArticle.count({
        where: { status: 'published' },
      }),
      totalViews: await ContentArticle.sum('viewCount'),
      totalLikes: await ContentArticle.sum('likeCount'),
      topArticles: await ContentArticle.findAll({
        where: { status: 'published' },
        order: [['viewCount', 'DESC']],
        limit: 10,
        attributes: ['id', 'title', 'slug', 'viewCount', 'likeCount'],
      }),
      categoryBreakdown: await ContentCategory.findAll({
        attributes: [
          'id',
          'name',
          [
            sequelize.fn('COUNT', sequelize.col('articles.id')),
            'articleCount',
          ],
        ],
        include: [
          {
            model: ContentArticle,
            as: 'articles',
            attributes: [],
          },
        ],
        group: ['ContentCategory.id'],
      }),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Failed to get content analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
};

export const getArticleAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await ContentArticle.findByPk(id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Check permissions
    if (req.user!.role !== 'admin' && 
        req.user!.role !== 'editor' && 
        article.authorId !== Number(req.user!.id)) {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const interactions = await ContentInteraction.findAll({
      where: { contentId: id },
      attributes: [
        'interactionType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['interactionType'],
    });

    const analytics = {
      article: {
        id: article.id,
        title: article.title,
        status: article.status,
        publishedAt: article.publishDate,
      },
      metrics: {
        views: article.viewCount,
        likes: article.likeCount,
        shares: article.shareCount,
        comments: await ContentComment.count({
          where: { contentId: id },
        }),
      },
      interactions: interactions.reduce((acc: Record<string, any>, curr) => {
        acc[curr.interactionType] = curr.get('count');
        return acc;
      }, {} as Record<string, any>),
      engagementRate: article.viewCount > 0 
        ? ((article.likeCount + article.shareCount) / article.viewCount * 100).toFixed(2)
        : 0,
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Failed to get article analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
};

// Scheduling
export const scheduleContent = async (req: Request, res: Response) => {
  try {
    const { articleId, scheduledDate, action, actionData } = req.body;

    const schedule = await ContentSchedule.create({
      contentId: articleId,
      scheduledFor: scheduledDate,
      scheduleType: action as 'publish' | 'unpublish' | 'update',
      metadata: actionData,
      createdBy: Number(req.user!.id),
    });

    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    logger.error('Failed to schedule content:', error);
    res.status(500).json({ success: false, error: 'Failed to schedule content' });
  }
};

export const getScheduledContent = async (_req: Request, res: Response) => {
  try {
    const schedules = await ContentSchedule.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: ContentArticle,
          as: 'article',
          attributes: ['id', 'title', 'slug', 'status'],
        },
      ],
      order: [['scheduledFor', 'ASC']],
    });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    logger.error('Failed to get scheduled content:', error);
    res.status(500).json({ success: false, error: 'Failed to get schedules' });
  }
};

// Helper functions
function calculateReadability(content: string): number {
  // Simple readability score based on sentence and word length
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // Flesch Reading Ease approximation
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (avgWordLength / 4.7);
  return Math.max(0, Math.min(100, score));
}

function analyzeSEO(title: string, content: string): any {
  const issues = [];
  const suggestions = [];

  // Title checks
  if (title.length < 30) issues.push('Title is too short');
  if (title.length > 60) issues.push('Title is too long');
  
  // Content checks
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 300) issues.push('Content is too short for SEO');
  
  // Meta description check (simplified)
  if (!content.includes('meta') && !content.includes('description')) {
    suggestions.push('Add a meta description');
  }

  return {
    score: Math.max(0, 100 - issues.length * 20),
    issues,
    suggestions,
  };
}

function extractKeywords(content: string): string[] {
  // Simple keyword extraction - in production, use NLP library
  const words = content.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 4)
    .filter(word => !['the', 'and', 'for', 'with', 'from'].includes(word));
  
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 10)
    .map(([word]) => word);
}

async function generatePreview(content: any, format: string): Promise<string> {
  // Generate preview based on format
  // This is a simplified version - in production, use proper markdown/HTML processors
  if (format === 'markdown') {
    return content.body || content;
  }
  
  // Simple markdown to HTML conversion
  let html = content.body || content;
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+)\*/g, '<em>$1</em>');
  html = html.replace(/\n/g, '<br>');
  
  return html;
}