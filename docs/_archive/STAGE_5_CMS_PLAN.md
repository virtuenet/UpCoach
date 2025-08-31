# Stage 5: CMS Panel & Content Management - Implementation Plan

## Overview
Stage 5 focuses on building a comprehensive Content Management System (CMS) for UpCoach to manage articles, guides, videos, and coaching content.

## Timeline: 4-5 Weeks

### Week 1: CMS Backend Infrastructure
- [ ] Design content database schema
- [ ] Create content models and migrations
- [ ] Build CMS API endpoints
- [ ] Implement content categorization
- [ ] Add search and filtering
- [ ] Set up media management

### Week 2: Content Editor & Creation
- [ ] Build rich text editor with formatting
- [ ] Add media upload and management
- [ ] Implement content templates
- [ ] Create SEO optimization tools
- [ ] Add content preview functionality
- [ ] Implement auto-save feature

### Week 3: Publishing Workflow
- [ ] Create draft/publish workflow
- [ ] Add content versioning
- [ ] Implement approval process
- [ ] Build scheduling system
- [ ] Add content analytics
- [ ] Create content calendar

### Week 4: Coach Portal & Permissions
- [ ] Build coach content interface
- [ ] Implement role-based permissions
- [ ] Add content collaboration tools
- [ ] Create content performance dashboard
- [ ] Implement content recommendations
- [ ] Add coach profile management

### Week 5: Mobile Integration & Polish
- [ ] Integrate CMS with mobile app
- [ ] Optimize content delivery
- [ ] Add offline content support
- [ ] Implement content personalization
- [ ] Performance optimization
- [ ] Testing and deployment

## Database Schema

```sql
-- Content tables
CREATE TABLE content_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES content_categories(id),
    icon VARCHAR(50),
    color VARCHAR(7),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    content JSONB NOT NULL, -- Rich text content in JSON format
    author_id INTEGER REFERENCES users(id) NOT NULL,
    category_id INTEGER REFERENCES content_categories(id),
    featured_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft', -- draft, review, published, archived
    visibility VARCHAR(20) DEFAULT 'public', -- public, members, premium
    publish_date TIMESTAMP,
    tags TEXT[],
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    reading_time INTEGER, -- in minutes
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

CREATE TABLE content_versions (
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

CREATE TABLE content_media (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size INTEGER,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    alt_text VARCHAR(255),
    caption TEXT,
    dimensions JSONB, -- {width, height}
    uploaded_by INTEGER REFERENCES users(id),
    folder VARCHAR(255),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_type VARCHAR(50), -- article, guide, workout, meal_plan
    structure JSONB NOT NULL, -- Template structure definition
    default_content JSONB,
    thumbnail VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(50), -- series, course, program
    cover_image VARCHAR(500),
    author_id INTEGER REFERENCES users(id),
    order_type VARCHAR(20) DEFAULT 'manual', -- manual, chronological
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_collection_items (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER REFERENCES content_collections(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES content_articles(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT false,
    unlock_after_days INTEGER, -- Days after enrollment to unlock
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, article_id)
);

CREATE TABLE content_comments (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES content_articles(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    parent_id INTEGER REFERENCES content_comments(id),
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    article_id INTEGER REFERENCES content_articles(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20), -- view, like, share, bookmark, complete
    interaction_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, article_id, interaction_type)
);

CREATE TABLE content_schedules (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES content_articles(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP NOT NULL,
    action VARCHAR(20) NOT NULL, -- publish, unpublish, update
    action_data JSONB,
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_content_articles_slug ON content_articles(slug);
CREATE INDEX idx_content_articles_status ON content_articles(status);
CREATE INDEX idx_content_articles_author ON content_articles(author_id);
CREATE INDEX idx_content_articles_category ON content_articles(category_id);
CREATE INDEX idx_content_articles_publish_date ON content_articles(publish_date DESC);
CREATE INDEX idx_content_articles_tags ON content_articles USING GIN(tags);
CREATE INDEX idx_content_interactions_user_article ON content_interactions(user_id, article_id);
CREATE INDEX idx_content_media_tags ON content_media USING GIN(tags);
```

## API Endpoints

### Content Management
- `GET /api/cms/articles` - List articles with filtering
- `POST /api/cms/articles` - Create new article
- `GET /api/cms/articles/:id` - Get article details
- `PUT /api/cms/articles/:id` - Update article
- `DELETE /api/cms/articles/:id` - Delete article
- `POST /api/cms/articles/:id/publish` - Publish article
- `POST /api/cms/articles/:id/unpublish` - Unpublish article
- `GET /api/cms/articles/:id/versions` - Get article versions
- `POST /api/cms/articles/:id/revert/:version` - Revert to version

### Categories & Organization
- `GET /api/cms/categories` - List categories
- `POST /api/cms/categories` - Create category
- `PUT /api/cms/categories/:id` - Update category
- `DELETE /api/cms/categories/:id` - Delete category
- `GET /api/cms/collections` - List collections
- `POST /api/cms/collections` - Create collection
- `PUT /api/cms/collections/:id` - Update collection

### Media Management
- `POST /api/cms/media/upload` - Upload media file
- `GET /api/cms/media` - List media files
- `PUT /api/cms/media/:id` - Update media metadata
- `DELETE /api/cms/media/:id` - Delete media file
- `POST /api/cms/media/bulk-upload` - Bulk upload

### Templates & Tools
- `GET /api/cms/templates` - List content templates
- `POST /api/cms/templates` - Create template
- `GET /api/cms/seo/analyze` - Analyze SEO
- `POST /api/cms/content/preview` - Preview content

### Analytics & Reports
- `GET /api/cms/analytics/overview` - Content analytics overview
- `GET /api/cms/analytics/articles/:id` - Article performance
- `GET /api/cms/analytics/authors/:id` - Author statistics
- `GET /api/cms/analytics/engagement` - Engagement metrics

## CMS Admin Interface Components

### 1. Content Dashboard
```typescript
interface ContentDashboard {
  stats: {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
    avgReadingTime: number;
    engagementRate: number;
  };
  recentArticles: Article[];
  popularArticles: Article[];
  scheduledContent: ScheduledContent[];
  contentCalendar: CalendarEvent[];
}
```

### 2. Rich Text Editor
- Markdown support
- WYSIWYG editing
- Image/video embedding
- Code syntax highlighting
- Table support
- Custom components (callouts, tips, warnings)
- Real-time preview
- Auto-save functionality

### 3. Media Library
- Drag & drop upload
- Image editing (crop, resize)
- Folder organization
- Search and filtering
- Bulk operations
- CDN integration
- Automatic optimization

### 4. SEO Tools
- Title/description optimization
- Keyword analysis
- Readability score
- Social media preview
- Schema markup
- Internal linking suggestions
- Content scoring

### 5. Publishing Workflow
- Draft → Review → Published states
- Scheduled publishing
- Content approvals
- Version comparison
- Rollback capability
- Multi-language support

## Mobile App Integration

### Content Delivery API
```typescript
// Optimized content endpoint for mobile
GET /api/mobile/content/feed
{
  "categories": ["fitness", "nutrition"],
  "limit": 20,
  "offset": 0,
  "user_preferences": true
}

// Response includes optimized content
{
  "articles": [
    {
      "id": "123",
      "title": "10 Minute Morning Workout",
      "summary": "Quick routine to start your day",
      "content": {
        "format": "structured",
        "sections": [...],
        "media": [...]
      },
      "reading_time": 5,
      "difficulty": "beginner",
      "offline_available": true
    }
  ],
  "next_offset": 20,
  "has_more": true
}
```

### Offline Content Support
- Download articles for offline reading
- Sync read progress
- Cache management
- Automatic updates when online

## Coach Content Portal

### Features
- Simplified content creation
- Performance analytics
- Revenue sharing dashboard
- Content guidelines
- Collaboration tools
- Direct messaging with editors

### Permissions Matrix
| Role | Create | Edit Own | Edit All | Publish | Delete | Analytics |
|------|--------|----------|----------|---------|---------|-----------|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Coach | ✓ | ✓ | ✗ | ✗ | ✗ | Own only |
| User | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Implementation Priority

1. **Core CMS Backend** (Week 1)
   - Database schema
   - Basic CRUD operations
   - Authentication & permissions

2. **Content Editor** (Week 2)
   - Rich text editor integration
   - Media management
   - Templates

3. **Publishing System** (Week 3)
   - Workflow states
   - Scheduling
   - Versioning

4. **Coach Portal** (Week 4)
   - Coach-specific UI
   - Analytics dashboard
   - Content tools

5. **Mobile Integration** (Week 5)
   - API optimization
   - Offline support
   - Performance tuning

## Success Metrics

- Content creation time: < 30 minutes per article
- Page load time: < 2 seconds
- Editor performance: No lag with 10K+ word documents
- Media upload: < 5 seconds for 10MB files
- Search response: < 200ms
- Mobile content sync: < 10 seconds for 50 articles