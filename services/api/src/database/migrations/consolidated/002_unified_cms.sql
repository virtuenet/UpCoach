-- =====================================================
-- Consolidated Migration: Unified CMS Schema
-- Replaces: 003_cms_content, 006_cms_schema
-- =====================================================

-- Unified Categories
CREATE TABLE IF NOT EXISTS unified_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('content', 'course', 'product', 'general')),
  parent_id UUID REFERENCES unified_categories(id) ON DELETE SET NULL,
  icon VARCHAR(255),
  image VARCHAR(500),
  color VARCHAR(7),
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_unified_categories_slug (slug),
  INDEX idx_unified_categories_type (type),
  INDEX idx_unified_categories_parent (parent_id),
  INDEX idx_unified_categories_active (is_active)
);

-- Unified Tags
CREATE TABLE IF NOT EXISTS unified_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('content', 'skill', 'topic', 'general')),
  color VARCHAR(7),
  icon VARCHAR(255),
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_unified_tags_slug (slug),
  INDEX idx_unified_tags_type (type),
  INDEX idx_unified_tags_usage (usage_count),
  INDEX idx_unified_tags_active (is_active)
);

-- Unified Content (Consolidates articles, courses, templates, etc.)
CREATE TABLE IF NOT EXISTS unified_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Fields
  type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'guide', 'exercise', 'lesson', 'tip', 'course', 'template', 'page', 'faq', 'announcement')),
  format VARCHAR(50) DEFAULT 'markdown' CHECK (format IN ('markdown', 'html', 'rich-text', 'video', 'audio', 'interactive')),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived', 'review', 'expired')),
  
  -- Relationships
  author_id UUID NOT NULL REFERENCES users(id),
  category_id UUID REFERENCES unified_categories(id),
  parent_id UUID REFERENCES unified_contents(id),
  "order" INTEGER DEFAULT 0,
  
  -- Media
  featured_image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  video_url VARCHAR(500),
  audio_url VARCHAR(500),
  attachments JSONB DEFAULT '[]',
  
  -- SEO
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  meta_keywords TEXT[],
  canonical_url VARCHAR(500),
  
  -- Publishing
  published_at TIMESTAMP,
  scheduled_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  reading_time INTEGER,
  completion_rate DECIMAL(5, 2),
  avg_rating DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  
  -- Access Control
  is_premium BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  required_roles TEXT[],
  required_tags TEXT[],
  
  -- Type-specific Data
  course_data JSONB,
  template_data JSONB,
  faq_data JSONB,
  
  -- Settings
  settings JSONB DEFAULT '{"allowComments": true, "allowSharing": true, "showAuthor": true, "showDate": true, "showReadingTime": true}',
  
  -- Versioning
  version INTEGER DEFAULT 1,
  version_history JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Indexes
  INDEX idx_unified_contents_slug (slug),
  INDEX idx_unified_contents_type (type),
  INDEX idx_unified_contents_status (status),
  INDEX idx_unified_contents_author (author_id),
  INDEX idx_unified_contents_category (category_id),
  INDEX idx_unified_contents_parent (parent_id),
  INDEX idx_unified_contents_published (published_at),
  INDEX idx_unified_contents_views (view_count),
  INDEX idx_unified_contents_premium (is_premium),
  INDEX idx_unified_contents_private (is_private),
  INDEX idx_unified_contents_keywords USING GIN (meta_keywords),
  INDEX idx_unified_contents_required_roles USING GIN (required_roles),
  INDEX idx_unified_contents_required_tags USING GIN (required_tags)
);

-- Content-Tag Relations
CREATE TABLE IF NOT EXISTS content_tag_relations (
  content_id UUID NOT NULL REFERENCES unified_contents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES unified_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (content_id, tag_id),
  INDEX idx_content_tags_content (content_id),
  INDEX idx_content_tags_tag (tag_id)
);

-- Unified Media
CREATE TABLE IF NOT EXISTS unified_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document', 'file')),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  content_id UUID REFERENCES unified_contents(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  folder VARCHAR(255),
  alt VARCHAR(255),
  caption TEXT,
  metadata JSONB DEFAULT '{}',
  processing JSONB DEFAULT '{"status": "pending"}',
  usage JSONB DEFAULT '{"viewCount": 0, "downloadCount": 0}',
  is_public BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_unified_media_type (type),
  INDEX idx_unified_media_content (content_id),
  INDEX idx_unified_media_uploader (uploaded_by),
  INDEX idx_unified_media_folder (folder),
  INDEX idx_unified_media_public (is_public),
  INDEX idx_unified_media_archived (is_archived)
);

-- Unified Interactions (Comments, Likes, Views, Ratings, etc.)
CREATE TABLE IF NOT EXISTS unified_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('view', 'like', 'share', 'comment', 'rating', 'bookmark', 'report', 'download')),
  content_id UUID NOT NULL REFERENCES unified_contents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_data JSONB,
  rating_data JSONB,
  share_data JSONB,
  report_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_unified_interactions_type (type),
  INDEX idx_unified_interactions_content (content_id),
  INDEX idx_unified_interactions_user (user_id),
  INDEX idx_unified_interactions_type_content (type, content_id),
  INDEX idx_unified_interactions_type_user (type, user_id),
  INDEX idx_unified_interactions_date (created_at)
);

-- Content Versions (for revision history)
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES unified_contents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(200),
  content TEXT,
  excerpt TEXT,
  meta_data JSONB,
  changed_by UUID NOT NULL REFERENCES users(id),
  change_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE KEY unique_content_version (content_id, version_number),
  INDEX idx_content_versions_content (content_id),
  INDEX idx_content_versions_user (changed_by),
  INDEX idx_content_versions_date (created_at)
);

-- Content Schedules
CREATE TABLE IF NOT EXISTS content_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES unified_contents(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP NOT NULL,
  schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('publish', 'unpublish', 'update', 'email', 'social')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_content_schedules_content (content_id),
  INDEX idx_content_schedules_date (scheduled_for),
  INDEX idx_content_schedules_status (status),
  INDEX idx_content_schedules_type (schedule_type)
);

-- Content Collections (for grouping related content)
CREATE TABLE IF NOT EXISTS content_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(250) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'manual' CHECK (type IN ('manual', 'smart', 'series', 'course')),
  cover_image VARCHAR(500),
  author_id UUID NOT NULL REFERENCES users(id),
  is_public BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_collections_slug (slug),
  INDEX idx_collections_type (type),
  INDEX idx_collections_author (author_id),
  INDEX idx_collections_public (is_public)
);

-- Collection Items
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES content_collections(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES unified_contents(id) ON DELETE CASCADE,
  "order" INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  added_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE KEY unique_collection_content (collection_id, content_id),
  INDEX idx_collection_items_collection (collection_id),
  INDEX idx_collection_items_content (content_id),
  INDEX idx_collection_items_order ("order")
);

-- Content Analytics Summary (Materialized View for Performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS content_analytics_summary AS
SELECT 
  c.id,
  c.type,
  c.title,
  c.slug,
  c.author_id,
  c.category_id,
  c.published_at,
  c.view_count,
  c.like_count,
  c.share_count,
  c.comment_count,
  c.avg_rating,
  COUNT(DISTINCT i.user_id) FILTER (WHERE i.type = 'view') as unique_views,
  COUNT(*) FILTER (WHERE i.type = 'view' AND i.created_at > NOW() - INTERVAL '7 days') as weekly_views,
  COUNT(*) FILTER (WHERE i.type = 'view' AND i.created_at > NOW() - INTERVAL '30 days') as monthly_views,
  AVG(CAST(i.metadata->>'duration' AS INTEGER)) FILTER (WHERE i.type = 'view') as avg_view_duration,
  COUNT(*) FILTER (WHERE i.type = 'comment' AND i.created_at > NOW() - INTERVAL '7 days') as weekly_comments,
  COALESCE(c.like_count::FLOAT / NULLIF(c.view_count, 0) * 100, 0) as engagement_rate
FROM unified_contents c
LEFT JOIN unified_interactions i ON c.id = i.content_id
WHERE c.status = 'published'
GROUP BY c.id, c.type, c.title, c.slug, c.author_id, c.category_id, c.published_at, 
         c.view_count, c.like_count, c.share_count, c.comment_count, c.avg_rating;

CREATE INDEX ON content_analytics_summary (id);
CREATE INDEX ON content_analytics_summary (type);
CREATE INDEX ON content_analytics_summary (author_id);
CREATE INDEX ON content_analytics_summary (engagement_rate DESC);

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION refresh_content_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY content_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update content counters
CREATE OR REPLACE FUNCTION update_content_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'view' THEN
      UPDATE unified_contents SET view_count = view_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.type = 'like' THEN
      UPDATE unified_contents SET like_count = like_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.type = 'share' THEN
      UPDATE unified_contents SET share_count = share_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.type = 'comment' THEN
      UPDATE unified_contents SET comment_count = comment_count + 1 WHERE id = NEW.content_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'like' THEN
      UPDATE unified_contents SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.content_id;
    ELSIF OLD.type = 'comment' THEN
      UPDATE unified_contents SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.content_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_counters
AFTER INSERT OR DELETE ON unified_interactions
FOR EACH ROW EXECUTE FUNCTION update_content_counters();