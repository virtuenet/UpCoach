#!/usr/bin/env node

/**
 * Migration script to consolidate CMS models
 * Migrates data from old models to UnifiedContent model
 */

import { Sequelize } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path';

const migrateModels = async () => {
  console.log('🔄 Starting CMS model consolidation...\n');

  // Connect to database
  const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

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

    console.log('✅ unified_contents table ready');

    // Migrate Articles
    console.log('\n📝 Migrating articles...');
    const [articles] = await sequelize.query(`
      SELECT * FROM articles WHERE deleted_at IS NULL
    `);
    
    for (const article of articles as any[]) {
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
        }
      });
    }
    console.log(`✅ Migrated ${(articles as any[]).length} articles`);

    // Migrate Contents
    console.log('\n📄 Migrating contents...');
    const [contents] = await sequelize.query(`
      SELECT * FROM contents
    `);
    
    for (const content of contents as any[]) {
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
        }
      });
    }
    console.log(`✅ Migrated ${(contents as any[]).length} contents`);

    // Migrate Courses
    console.log('\n🎓 Migrating courses...');
    const [courses] = await sequelize.query(`
      SELECT * FROM courses
    `);
    
    for (const course of courses as any[]) {
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
        }
      });
    }
    console.log(`✅ Migrated ${(courses as any[]).length} courses`);

    // Migrate Templates
    console.log('\n📋 Migrating templates...');
    const [templates] = await sequelize.query(`
      SELECT * FROM templates
    `);
    
    for (const template of templates as any[]) {
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
        }
      });
    }
    console.log(`✅ Migrated ${(templates as any[]).length} templates`);

    // Create indexes
    console.log('\n📊 Creating indexes...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_unified_contents_type ON unified_contents(type);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_status ON unified_contents(status);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_author ON unified_contents(author_id);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_category ON unified_contents(category_id);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_parent ON unified_contents(parent_id);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_published ON unified_contents(published_at);
      CREATE INDEX IF NOT EXISTS idx_unified_contents_premium ON unified_contents(is_premium);
    `);
    console.log('✅ Indexes created');

    // Update model imports
    console.log('\n🔧 Updating model imports...');
    
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

    fs.writeFileSync(
      path.join(__dirname, '../models/cms/index.ts'),
      mappingContent
    );
    
    console.log('✅ Model mapping file created');

    console.log('\n✨ CMS model consolidation complete!');
    console.log('\nNext steps:');
    console.log('1. Update service files to use UnifiedContent model');
    console.log('2. Test all CMS functionality');
    console.log('3. Remove old model files once verified');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run migration
if (require.main === module) {
  migrateModels();
}

export default migrateModels;