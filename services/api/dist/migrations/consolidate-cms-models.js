#!/usr/bin/env node
"use strict";
/**
 * Migration script to consolidate CMS models
 * Migrates data from old models to UnifiedContent model
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
const sequelize_1 = require("sequelize");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const migrateModels = async () => {
    logger_1.logger.info('🔄 Starting CMS model consolidation...\n');
    // Connect to database
    const sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL || '', {
        logging: false,
    });
    try {
        await sequelize.authenticate();
        logger_1.logger.info('✅ Database connected');
        // Create unified_contents table if not exists
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS unified_contents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        format VARCHAR(50) NOT NULL DEFAULT 'markdown',
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(250) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        author_id UUID NOT NULL REFERENCES users(id),
        category_id UUID REFERENCES content_categories(id),
        parent_id UUID REFERENCES unified_contents(id),
        "order" INTEGER DEFAULT 0,
        featured_image_url VARCHAR(500),
        thumbnail_url VARCHAR(500),
        video_url VARCHAR(500),
        audio_url VARCHAR(500),
        attachments JSONB DEFAULT '[]',
        meta_title VARCHAR(60),
        meta_description VARCHAR(160),
        meta_keywords TEXT[],
        canonical_url VARCHAR(500),
        published_at TIMESTAMP,
        scheduled_at TIMESTAMP,
        expires_at TIMESTAMP,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        share_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        reading_time INTEGER,
        completion_rate FLOAT,
        avg_rating FLOAT,
        rating_count INTEGER DEFAULT 0,
        is_premium BOOLEAN DEFAULT false,
        is_private BOOLEAN DEFAULT false,
        required_roles TEXT[],
        required_tags TEXT[],
        course_data JSONB,
        template_data JSONB,
        faq_data JSONB,
        settings JSONB DEFAULT '{"allowComments": true, "allowSharing": true, "showAuthor": true, "showDate": true, "showReadingTime": true}',
        version INTEGER DEFAULT 1,
        version_history JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
        logger_1.logger.info('✅ unified_contents table ready');
        // Migrate Articles
        logger_1.logger.info('\n📝 Migrating articles...');
        const [articles] = await sequelize.query(`
      SELECT * FROM articles WHERE deleted_at IS NULL
    `);
        for (const article of articles) {
            await sequelize.query(`
        INSERT INTO unified_contents (
          id, type, format, title, slug, content, excerpt, status,
          author_id, category_id, featured_image_url,
          meta_title, meta_description, meta_keywords,
          published_at, view_count, share_count, like_count,
          reading_time, settings, created_at, updated_at
        ) VALUES (
          :id, 'article', 'html', :title, :slug, :content, :excerpt, :status,
          :authorId, :categoryId, :featuredImage,
          :seoTitle, :seoDescription, :seoKeywords,
          :publishedAt, :viewCount, :shareCount, :likeCount,
          :readTime, :settings, :createdAt, :updatedAt
        ) ON CONFLICT (id) DO NOTHING
      `, {
                replacements: {
                    id: article.id,
                    title: article.title,
                    slug: article.slug,
                    content: article.content,
                    excerpt: article.excerpt,
                    status: article.status,
                    authorId: article.author_id || article.authorId,
                    categoryId: article.category_id || article.categoryId,
                    featuredImage: article.featured_image || article.featuredImage,
                    seoTitle: article.seo_title || article.seoTitle,
                    seoDescription: article.seo_description || article.seoDescription,
                    seoKeywords: article.seo_keywords || article.seoKeywords || [],
                    publishedAt: article.published_at || article.publishedAt,
                    viewCount: article.view_count || article.viewCount || 0,
                    shareCount: article.share_count || article.shareCount || 0,
                    likeCount: article.like_count || article.likeCount || 0,
                    readTime: article.read_time || article.readTime || 0,
                    settings: JSON.stringify(article.settings || {}),
                    createdAt: article.created_at || article.createdAt,
                    updatedAt: article.updated_at || article.updatedAt,
                },
            });
        }
        logger_1.logger.info(`✅ Migrated ${articles.length} articles`);
        // Migrate Contents
        logger_1.logger.info('\n📄 Migrating contents...');
        const [contents] = await sequelize.query(`
      SELECT * FROM contents
    `);
        for (const content of contents) {
            await sequelize.query(`
        INSERT INTO unified_contents (
          id, type, format, title, slug, content, excerpt, status,
          author_id, category_id, featured_image_url,
          meta_title, meta_description, meta_keywords,
          published_at, scheduled_at, view_count, like_count, share_count,
          reading_time, is_premium, "order", settings,
          created_at, updated_at
        ) VALUES (
          :id, :type, 'markdown', :title, :slug, :content, :excerpt, :status,
          :authorId, :categoryId, :featuredImageUrl,
          :metaTitle, :metaDescription, :metaKeywords,
          :publishedAt, :scheduledAt, :viewCount, :likeCount, :shareCount,
          :readingTime, :isPremium, :order, :settings,
          :createdAt, :updatedAt
        ) ON CONFLICT (id) DO NOTHING
      `, {
                replacements: {
                    id: content.id,
                    type: content.type || 'article',
                    title: content.title,
                    slug: content.slug,
                    content: content.content,
                    excerpt: content.excerpt,
                    status: content.status,
                    authorId: content.author_id || content.authorId,
                    categoryId: content.category_id || content.categoryId,
                    featuredImageUrl: content.featured_image_url || content.featuredImageUrl,
                    metaTitle: content.meta_title || content.metaTitle,
                    metaDescription: content.meta_description || content.metaDescription,
                    metaKeywords: content.meta_keywords || content.metaKeywords || [],
                    publishedAt: content.published_at || content.publishedAt,
                    scheduledAt: content.scheduled_at || content.scheduledAt,
                    viewCount: content.view_count || content.viewCount || 0,
                    likeCount: content.like_count || content.likeCount || 0,
                    shareCount: content.share_count || content.shareCount || 0,
                    readingTime: content.reading_time || content.readingTime,
                    isPremium: content.is_premium || content.isPremium || false,
                    order: content.order,
                    settings: JSON.stringify(content.settings || {}),
                    createdAt: content.created_at || content.createdAt,
                    updatedAt: content.updated_at || content.updatedAt,
                },
            });
        }
        logger_1.logger.info(`✅ Migrated ${contents.length} contents`);
        // Migrate Courses
        logger_1.logger.info('\n🎓 Migrating courses...');
        const [courses] = await sequelize.query(`
      SELECT * FROM courses
    `);
        for (const course of courses) {
            await sequelize.query(`
        INSERT INTO unified_contents (
          id, type, format, title, slug, content, excerpt, status,
          author_id, category_id, featured_image_url,
          published_at, is_premium, course_data,
          created_at, updated_at
        ) VALUES (
          :id, 'course', 'rich-text', :title, :slug, :description, :excerpt, :status,
          :authorId, :categoryId, :thumbnailUrl,
          :publishedAt, :isPremium, :courseData,
          :createdAt, :updatedAt
        ) ON CONFLICT (id) DO NOTHING
      `, {
                replacements: {
                    id: course.id,
                    title: course.title || course.name,
                    slug: course.slug || course.title?.toLowerCase().replace(/\s+/g, '-'),
                    description: course.description || course.content || '',
                    excerpt: course.excerpt || course.summary,
                    status: course.status || 'published',
                    authorId: course.instructor_id || course.author_id || course.authorId,
                    categoryId: course.category_id || course.categoryId,
                    thumbnailUrl: course.thumbnail_url || course.thumbnailUrl,
                    publishedAt: course.published_at || course.publishedAt,
                    isPremium: course.is_premium || course.isPremium || false,
                    courseData: JSON.stringify({
                        duration: course.duration,
                        difficulty: course.difficulty,
                        prerequisites: course.prerequisites,
                        objectives: course.objectives,
                        certificateEnabled: course.certificate_enabled,
                        maxEnrollments: course.max_enrollments,
                        currentEnrollments: course.current_enrollments,
                    }),
                    createdAt: course.created_at || course.createdAt,
                    updatedAt: course.updated_at || course.updatedAt,
                },
            });
        }
        logger_1.logger.info(`✅ Migrated ${courses.length} courses`);
        // Migrate Templates
        logger_1.logger.info('\n📋 Migrating templates...');
        const [templates] = await sequelize.query(`
      SELECT * FROM templates
    `);
        for (const template of templates) {
            await sequelize.query(`
        INSERT INTO unified_contents (
          id, type, format, title, slug, content, excerpt, status,
          author_id, category_id, template_data,
          created_at, updated_at
        ) VALUES (
          :id, 'template', 'html', :title, :slug, :content, :description, 'published',
          :authorId, :categoryId, :templateData,
          :createdAt, :updatedAt
        ) ON CONFLICT (id) DO NOTHING
      `, {
                replacements: {
                    id: template.id,
                    title: template.name || template.title,
                    slug: template.slug || template.name?.toLowerCase().replace(/\s+/g, '-'),
                    content: template.content || template.body || '',
                    description: template.description,
                    authorId: template.author_id || template.authorId || template.created_by,
                    categoryId: template.category_id || template.categoryId,
                    templateData: JSON.stringify({
                        category: template.category,
                        variables: template.variables,
                        previewData: template.preview_data,
                        usageCount: template.usage_count || 0,
                        lastUsedAt: template.last_used_at,
                    }),
                    createdAt: template.created_at || template.createdAt,
                    updatedAt: template.updated_at || template.updatedAt,
                },
            });
        }
        logger_1.logger.info(`✅ Migrated ${templates.length} templates`);
        // Create indexes
        logger_1.logger.info('\n📊 Creating indexes...');
        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_unified_contents_type ON unified_contents(type);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_status ON unified_contents(status);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_author ON unified_contents(author_id);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_category ON unified_contents(category_id);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_parent ON unified_contents(parent_id);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_published ON unified_contents(published_at);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_premium ON unified_contents(is_premium);
    `);
        logger_1.logger.info('✅ Indexes created');
        // Update model imports
        logger_1.logger.info('\n🔧 Updating model imports...');
        // Create mapping file
        const mappingContent = `
// Model Migration Mapping
// Old models -> UnifiedContent

export { UnifiedContent as Article } from './UnifiedContent';
export { UnifiedContent as Content } from './UnifiedContent';
export { UnifiedContent as ContentArticle } from './UnifiedContent';
export { UnifiedContent as Course } from './UnifiedContent';
export { UnifiedContent as Template } from './UnifiedContent';

// Export the unified model
export { UnifiedContent } from './UnifiedContent';
export default UnifiedContent;
`;
        fs.writeFileSync(path.join(__dirname, '../models/cms/index.ts'), mappingContent);
        logger_1.logger.info('✅ Model mapping file created');
        logger_1.logger.info('\n✨ CMS model consolidation complete!');
        logger_1.logger.info('\nNext steps:');
        logger_1.logger.info('1. Update service files to use UnifiedContent model');
        logger_1.logger.info('2. Test all CMS functionality');
        logger_1.logger.info('3. Remove old model files once verified');
    }
    catch (error) {
        logger_1.logger.error('❌ Migration failed:', error);
        process.exit(1);
    }
    finally {
        await sequelize.close();
    }
};
// Run migration
if (require.main === module) {
    migrateModels();
}
exports.default = migrateModels;
//# sourceMappingURL=consolidate-cms-models.js.map