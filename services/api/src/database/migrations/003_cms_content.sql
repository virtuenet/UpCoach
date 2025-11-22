-- Create content categories table
CREATE TABLE IF NOT EXISTS content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES content_categories(id) ON DELETE CASCADE,
    icon VARCHAR(255),
    color VARCHAR(50),
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content tags table
CREATE TABLE IF NOT EXISTS content_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(50) DEFAULT '#6B7280',
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create contents table
CREATE TABLE IF NOT EXISTS contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'article' CHECK (type IN ('article', 'guide', 'exercise', 'lesson', 'tip')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
    category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    featured_image_url VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    reading_time INTEGER,
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    share_count INTEGER NOT NULL DEFAULT 0,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,
    settings JSONB DEFAULT '{"allowComments": true, "showAuthor": true, "showDate": true, "showReadingTime": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content media table
CREATE TABLE IF NOT EXISTS content_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document', 'other')),
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    metadata JSONB,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content tag relations table
CREATE TABLE IF NOT EXISTS content_tag_relations (
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (content_id, tag_id)
);

-- Create content views tracking table
CREATE TABLE IF NOT EXISTS content_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    session_id VARCHAR(255),
    view_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content likes table
CREATE TABLE IF NOT EXISTS content_likes (
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (content_id, user_id)
);

-- Create indexes
CREATE INDEX idx_content_categories_slug ON content_categories(slug);
CREATE INDEX idx_content_categories_parent_id ON content_categories(parent_id);
CREATE INDEX idx_content_categories_is_active ON content_categories(is_active);

CREATE INDEX idx_content_tags_slug ON content_tags(slug);
CREATE INDEX idx_content_tags_is_active ON content_tags(is_active);
CREATE INDEX idx_content_tags_usage_count ON content_tags(usage_count);

CREATE INDEX idx_contents_slug ON contents(slug);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_type ON contents(type);
CREATE INDEX idx_contents_author_id ON contents(author_id);
CREATE INDEX idx_contents_category_id ON contents(category_id);
CREATE INDEX idx_contents_published_at ON contents(published_at);
CREATE INDEX idx_contents_is_premium ON contents(is_premium);

CREATE INDEX idx_content_media_content_id ON content_media(content_id);
CREATE INDEX idx_content_media_type ON content_media(type);
CREATE INDEX idx_content_media_uploaded_by ON content_media(uploaded_by);
CREATE INDEX idx_content_media_is_public ON content_media(is_public);
CREATE INDEX idx_content_media_filename ON content_media(filename);

CREATE INDEX idx_content_views_content_id ON content_views(content_id);
CREATE INDEX idx_content_views_user_id ON content_views(user_id);
CREATE INDEX idx_content_views_created_at ON content_views(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON content_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_tags_updated_at BEFORE UPDATE ON content_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_media_updated_at BEFORE UPDATE ON content_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE content_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE content_tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tag_usage_count_trigger
AFTER INSERT OR DELETE ON content_tag_relations
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Create function to update content view count
CREATE OR REPLACE FUNCTION update_content_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contents SET view_count = view_count + 1 WHERE id = NEW.content_id;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_view_count_trigger
AFTER INSERT ON content_views
    FOR EACH ROW EXECUTE FUNCTION update_content_view_count();

-- Create function to update content like count
CREATE OR REPLACE FUNCTION update_content_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE contents SET like_count = like_count + 1 WHERE id = NEW.content_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contents SET like_count = like_count - 1 WHERE id = OLD.content_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_like_count_trigger
AFTER INSERT OR DELETE ON content_likes
    FOR EACH ROW EXECUTE FUNCTION update_content_like_count();