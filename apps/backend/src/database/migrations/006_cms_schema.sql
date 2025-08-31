-- CMS Schema for UpCoach Content Management System

-- Content categories table
CREATE TABLE IF NOT EXISTS content_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES content_categories(id) ON DELETE SET NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content articles table
CREATE TABLE IF NOT EXISTS content_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    content JSONB NOT NULL,
    author_id INTEGER REFERENCES users(id) NOT NULL,
    category_id INTEGER REFERENCES content_categories(id),
    featured_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'members', 'premium')),
    publish_date TIMESTAMP,
    tags TEXT[],
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    reading_time INTEGER,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    last_modified_by INTEGER REFERENCES users(id)
);

-- Content versions table
CREATE TABLE IF NOT EXISTS content_versions (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES content_articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    change_summary TEXT,
    author_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, version_number)
);

-- Content media table
CREATE TABLE IF NOT EXISTS content_media (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size INTEGER,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    alt_text VARCHAR(255),
    caption TEXT,
    dimensions JSONB,
    uploaded_by INTEGER REFERENCES users(id),
    folder VARCHAR(255),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content templates table
CREATE TABLE IF NOT EXISTS content_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_type VARCHAR(50),
    structure JSONB NOT NULL,
    default_content JSONB,
    thumbnail VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content collections table
CREATE TABLE IF NOT EXISTS content_collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(50) CHECK (type IN ('series', 'course', 'program')),
    cover_image VARCHAR(500),
    author_id INTEGER REFERENCES users(id),
    order_type VARCHAR(20) DEFAULT 'manual' CHECK (order_type IN ('manual', 'chronological')),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content collection items table
CREATE TABLE IF NOT EXISTS content_collection_items (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER REFERENCES content_collections(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES content_articles(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT false,
    unlock_after_days INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, article_id)
);

-- Content comments table
CREATE TABLE IF NOT EXISTS content_comments (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES content_articles(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    parent_id INTEGER REFERENCES content_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content interactions table
CREATE TABLE IF NOT EXISTS content_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    article_id INTEGER REFERENCES content_articles(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) CHECK (interaction_type IN ('view', 'like', 'share', 'bookmark', 'complete')),
    interaction_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, article_id, interaction_type)
);

-- Content schedules table
CREATE TABLE IF NOT EXISTS content_schedules (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES content_articles(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('publish', 'unpublish', 'update')),
    action_data JSONB,
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_content_articles_slug ON content_articles(slug);
CREATE INDEX idx_content_articles_status ON content_articles(status);
CREATE INDEX idx_content_articles_author ON content_articles(author_id);
CREATE INDEX idx_content_articles_category ON content_articles(category_id);
CREATE INDEX idx_content_articles_publish_date ON content_articles(publish_date DESC);
CREATE INDEX idx_content_articles_tags ON content_articles USING GIN(tags);
CREATE INDEX idx_content_articles_featured ON content_articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_content_interactions_user_article ON content_interactions(user_id, article_id);
CREATE INDEX idx_content_media_tags ON content_media USING GIN(tags);
CREATE INDEX idx_content_media_folder ON content_media(folder);
CREATE INDEX idx_content_categories_slug ON content_categories(slug);
CREATE INDEX idx_content_collections_slug ON content_collections(slug);
CREATE INDEX idx_content_comments_article ON content_comments(article_id);
CREATE INDEX idx_content_schedules_date ON content_schedules(scheduled_date) WHERE is_processed = false;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON content_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_articles_updated_at BEFORE UPDATE ON content_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_templates_updated_at BEFORE UPDATE ON content_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_collections_updated_at BEFORE UPDATE ON content_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_comments_updated_at BEFORE UPDATE ON content_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO content_categories (name, slug, description, icon, color, order_index) VALUES
    ('Fitness', 'fitness', 'Workout routines, exercises, and fitness tips', 'fitness_center', '#FF6B6B', 1),
    ('Nutrition', 'nutrition', 'Healthy eating, meal plans, and recipes', 'restaurant', '#4ECDC4', 2),
    ('Mental Health', 'mental-health', 'Mindfulness, stress management, and emotional wellness', 'psychology', '#45B7D1', 3),
    ('Sleep', 'sleep', 'Sleep optimization and recovery techniques', 'bedtime', '#96CEB4', 4),
    ('Productivity', 'productivity', 'Time management and goal achievement strategies', 'trending_up', '#FECA57', 5),
    ('Motivation', 'motivation', 'Inspirational content and success stories', 'emoji_events', '#FF9FF3', 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert default templates
INSERT INTO content_templates (name, description, template_type, structure, is_active) VALUES
    ('Workout Guide', 'Template for creating workout guides', 'workout', 
     '{"sections": [{"type": "intro", "title": "Introduction"}, {"type": "warmup", "title": "Warm-up"}, {"type": "exercises", "title": "Main Workout"}, {"type": "cooldown", "title": "Cool-down"}, {"type": "tips", "title": "Pro Tips"}]}', 
     true),
    ('Recipe', 'Template for healthy recipes', 'recipe',
     '{"sections": [{"type": "overview", "title": "Overview"}, {"type": "ingredients", "title": "Ingredients"}, {"type": "instructions", "title": "Instructions"}, {"type": "nutrition", "title": "Nutrition Facts"}, {"type": "variations", "title": "Variations"}]}',
     true),
    ('Meditation Guide', 'Template for meditation sessions', 'meditation',
     '{"sections": [{"type": "intro", "title": "Introduction"}, {"type": "preparation", "title": "Preparation"}, {"type": "practice", "title": "The Practice"}, {"type": "closing", "title": "Closing"}, {"type": "journal", "title": "Reflection"}]}',
     true)
ON CONFLICT DO NOTHING;